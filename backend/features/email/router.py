from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.email.schemas import EmailAccountCreate, EmailAccountOut, SendEmailRequest
from features.email.service import add_email_account, list_email_accounts, get_all_active_accounts
from features.email.imap_sync import sync_account
from features.email.smtp_sender import send_email
from typing import List

router = APIRouter()


@router.get("/accounts", response_model=List[EmailAccountOut])
async def list_accounts(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await list_email_accounts(db, user_id)


@router.post("/accounts", response_model=EmailAccountOut, status_code=201)
async def add_account(data: EmailAccountCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await add_email_account(db, user_id, data)


@router.post("/sync")
async def trigger_sync(_: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    accounts = await get_all_active_accounts(db)
    for account in accounts:
        await sync_account(db, account)
    return {"synced": len(accounts)}


@router.post("/send")
async def send_email_route(data: SendEmailRequest, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    accounts = await list_email_accounts(db, user_id)
    if not accounts:
        from fastapi import HTTPException
        raise HTTPException(400, "No email account configured")
    await send_email(accounts[0], data.to, data.subject, data.body)
    return {"sent": True}
