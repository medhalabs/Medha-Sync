from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from core.config import settings
from features.email.schemas import ImapAccountCreate, EmailAccountOut, SendEmailRequest, OAuthAuthorizeOut, OAuthCallbackRequest
from features.email.service import add_email_account, list_email_accounts, get_all_active_accounts, save_oauth_account, delete_email_account
from features.email.imap_sync import sync_account
from features.email.smtp_sender import send_email
from features.email import google_oauth, outlook_oauth
from typing import List

router = APIRouter()


# ─── IMAP accounts ────────────────────────────────────────────────────────────

@router.get("/accounts", response_model=List[EmailAccountOut])
async def list_accounts(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await list_email_accounts(db, user_id)


@router.post("/accounts", response_model=EmailAccountOut, status_code=201)
async def add_account(data: ImapAccountCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await add_email_account(db, user_id, data)


@router.delete("/accounts/{account_id}", status_code=204)
async def remove_account(account_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await delete_email_account(db, account_id, user_id)


# ─── Gmail OAuth ───────────────────────────────────────────────────────────────

@router.get("/gmail/authorize", response_model=OAuthAuthorizeOut)
async def gmail_authorize(_: str = Depends(get_current_user_id)):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(400, "Google OAuth credentials not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env")
    url = google_oauth.get_authorize_url(
        client_id=settings.GOOGLE_CLIENT_ID,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
        state="gmail",
    )
    return {"authorize_url": url}


@router.post("/gmail/callback", response_model=EmailAccountOut)
async def gmail_callback(data: OAuthCallbackRequest, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    try:
        tokens = google_oauth.exchange_code(
            code=data.code,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            redirect_uri=data.redirect_uri,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    if not access_token or not refresh_token:
        raise HTTPException(400, "Google did not return refresh_token. Make sure you requested offline access and revoked previous access first.")

    email_addr = google_oauth.get_email_from_token_response(tokens)
    if not email_addr:
        raise HTTPException(400, "Could not extract email from Google token response")

    account = await save_oauth_account(
        db=db,
        user_id=user_id,
        provider="gmail",
        email_address=email_addr,
        access_token=access_token,
        refresh_token=refresh_token,
        label=f"Gmail – {email_addr}",
    )
    await db.commit()
    return account


# ─── Outlook OAuth ─────────────────────────────────────────────────────────────

@router.get("/outlook/authorize", response_model=OAuthAuthorizeOut)
async def outlook_authorize(_: str = Depends(get_current_user_id)):
    if not settings.MICROSOFT_CLIENT_ID or not settings.MICROSOFT_CLIENT_SECRET:
        raise HTTPException(400, "Microsoft OAuth credentials not configured. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to .env")
    url = outlook_oauth.get_authorize_url(
        client_id=settings.MICROSOFT_CLIENT_ID,
        redirect_uri=settings.MICROSOFT_REDIRECT_URI,
        state="outlook",
    )
    return {"authorize_url": url}


@router.post("/outlook/callback", response_model=EmailAccountOut)
async def outlook_callback(data: OAuthCallbackRequest, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    try:
        tokens = outlook_oauth.exchange_code(
            code=data.code,
            client_id=settings.MICROSOFT_CLIENT_ID,
            client_secret=settings.MICROSOFT_CLIENT_SECRET,
            redirect_uri=data.redirect_uri,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    if not access_token or not refresh_token:
        raise HTTPException(400, "Microsoft did not return refresh_token. Ensure offline_access scope is requested.")

    email_addr = outlook_oauth.get_email_from_token_response(tokens)
    if not email_addr:
        raise HTTPException(400, "Could not extract email from Microsoft token response")

    account = await save_oauth_account(
        db=db,
        user_id=user_id,
        provider="outlook",
        email_address=email_addr,
        access_token=access_token,
        refresh_token=refresh_token,
        label=f"Outlook – {email_addr}",
    )
    await db.commit()
    return account


# ─── Sync ──────────────────────────────────────────────────────────────────────

@router.post("/sync")
async def trigger_sync(_: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    accounts = await get_all_active_accounts(db)
    synced = 0
    errors = []
    for account in accounts:
        try:
            await sync_account(db, account)
            synced += 1
        except Exception as e:
            errors.append({"account": account.label, "error": str(e)})
    await db.commit()
    return {"synced": synced, "errors": errors}


@router.post("/send")
async def send_email_route(data: SendEmailRequest, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    accounts = await list_email_accounts(db, user_id)
    if not accounts:
        raise HTTPException(400, "No email account configured")
    await send_email(accounts[0], data.to, data.subject, data.body)
    return {"sent": True}
