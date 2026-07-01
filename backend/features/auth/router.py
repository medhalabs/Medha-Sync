from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id, decode_token
from core.rate_limit import limiter, LIMITS
from core.config import settings
from features.auth.schemas import UserCreate, UserLogin, UserOut, TokenOut, RefreshRequest, OAuthCallbackRequest, OAuthAuthorizeOut
from features.auth.service import register_user, authenticate_user, get_user_by_id, get_or_create_google_user, issue_tokens
from features.email import google_oauth
from features.email.service import save_oauth_account
from features.email.imap_sync import sync_account
from core.security import create_access_token, create_refresh_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserOut)
@limiter.limit(LIMITS["auth_register"])
async def register(request: Request, data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(db, data)


@router.post("/login", response_model=TokenOut)
@limiter.limit(LIMITS["auth_login"])
async def login(request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)):
    user, access_token, refresh_token = await authenticate_user(db, data)
    return TokenOut(access_token=access_token, refresh_token=refresh_token, user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenOut)
@limiter.limit(LIMITS["auth_refresh"])
async def refresh(request: Request, data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    user = await get_user_by_id(db, payload["sub"])
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    return TokenOut(access_token=access_token, refresh_token=refresh_token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await get_user_by_id(db, user_id)


# ─── Google OAuth (login / register + Gmail) ─────────────────────────────────

@router.get("/google/authorize", response_model=OAuthAuthorizeOut)
async def google_authorize():
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(400, "Google OAuth credentials not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env")
    if not settings.GOOGLE_AUTH_REDIRECT_URI:
        raise HTTPException(400, "GOOGLE_AUTH_REDIRECT_URI is not configured")
    url = google_oauth.get_authorize_url(
        client_id=settings.GOOGLE_CLIENT_ID,
        redirect_uri=settings.GOOGLE_AUTH_REDIRECT_URI,
        state="auth",
    )
    return {"authorize_url": url}


@router.post("/google/callback", response_model=TokenOut)
@limiter.limit(LIMITS["auth_login"])
async def google_callback(request: Request, data: OAuthCallbackRequest, db: AsyncSession = Depends(get_db)):
    if not settings.GOOGLE_AUTH_REDIRECT_URI:
        raise HTTPException(400, "GOOGLE_AUTH_REDIRECT_URI is not configured")
    try:
        tokens = google_oauth.exchange_code(
            code=data.code,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            redirect_uri=settings.GOOGLE_AUTH_REDIRECT_URI,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    if not access_token or not refresh_token:
        raise HTTPException(400, "Google did not return refresh_token. Revoke app access at myaccount.google.com/permissions and try again.")

    profile = google_oauth.get_profile_from_token_response(tokens)
    email = profile.get("email")
    google_id = profile.get("google_id")
    if not email or not google_id:
        raise HTTPException(400, "Could not extract profile from Google token response")

    user, _is_new = await get_or_create_google_user(
        db,
        google_id=google_id,
        email=email,
        name=profile.get("name") or email.split("@")[0],
        avatar_url=profile.get("picture"),
    )

    account = await save_oauth_account(
        db=db,
        user_id=user.id,
        provider="gmail",
        email_address=email,
        access_token=access_token,
        refresh_token=refresh_token,
        label=f"Gmail – {email}",
    )

    try:
        await sync_account(db, account)
    except Exception as e:
        logger.warning("Initial Gmail sync failed for %s: %s", email, e)

    await db.commit()

    jwt_access, jwt_refresh = issue_tokens(user)
    return TokenOut(access_token=jwt_access, refresh_token=jwt_refresh, user=UserOut.model_validate(user))
