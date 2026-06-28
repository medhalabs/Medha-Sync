from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from features.email.models import EmailAccount
from features.email.schemas import EmailAccountCreate


async def add_email_account(db: AsyncSession, user_id: str, data: EmailAccountCreate) -> EmailAccount:
    account = EmailAccount(user_id=user_id, **data.model_dump())
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return account


async def list_email_accounts(db: AsyncSession, user_id: str) -> list[EmailAccount]:
    result = await db.execute(select(EmailAccount).where(EmailAccount.user_id == user_id))
    return result.scalars().all()


async def get_all_active_accounts(db: AsyncSession) -> list[EmailAccount]:
    result = await db.execute(select(EmailAccount).where(EmailAccount.is_active == True))
    return result.scalars().all()
