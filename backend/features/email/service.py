from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from features.email.models import EmailAccount
from features.email.schemas import ImapAccountCreate
from features.email.token_crypto import encrypt, decrypt
import datetime


async def list_email_accounts(db: AsyncSession, user_id: str) -> list[EmailAccount]:
    result = await db.execute(select(EmailAccount).where(EmailAccount.user_id == user_id, EmailAccount.is_active == True))
    return result.scalars().all()


async def get_all_active_accounts(db: AsyncSession) -> list[EmailAccount]:
    result = await db.execute(select(EmailAccount).where(EmailAccount.is_active == True))
    return result.scalars().all()


async def add_email_account(db: AsyncSession, user_id: str, data: ImapAccountCreate) -> EmailAccount:
    account = EmailAccount(
        user_id=user_id,
        label=data.label,
        provider="imap",
        email_address=data.username,
        imap_host=data.imap_host,
        imap_port=data.imap_port,
        imap_use_ssl=data.imap_use_ssl,
        username=data.username,
        password_encrypted=encrypt(data.password),
        smtp_host=data.smtp_host,
        smtp_port=data.smtp_port,
    )
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return account


async def save_oauth_account(
    db: AsyncSession,
    user_id: str,
    provider: str,
    email_address: str,
    access_token: str,
    refresh_token: str,
    label: str | None = None,
) -> EmailAccount:
    """Create or update OAuth-based email account."""
    result = await db.execute(
        select(EmailAccount).where(
            EmailAccount.user_id == user_id,
            EmailAccount.provider == provider,
            EmailAccount.email_address == email_address,
        )
    )
    account = result.scalar_one_or_none()
    if account:
        account.access_token_encrypted = encrypt(access_token)
        account.refresh_token = refresh_token
        account.is_active = True
        account.label = label or email_address
    else:
        account = EmailAccount(
            user_id=user_id,
            label=label or email_address,
            provider=provider,
            email_address=email_address,
            access_token_encrypted=encrypt(access_token),
            refresh_token=refresh_token,
        )
        db.add(account)
    await db.flush()
    await db.refresh(account)
    return account


def get_decrypted_password(account: EmailAccount) -> str | None:
    if not account.password_encrypted:
        return None
    return decrypt(account.password_encrypted)


def get_decrypted_access_token(account: EmailAccount) -> str | None:
    if not account.access_token_encrypted:
        return None
    return decrypt(account.access_token_encrypted)


async def delete_email_account(db: AsyncSession, account_id: str, user_id: str):
    result = await db.execute(select(EmailAccount).where(EmailAccount.id == account_id, EmailAccount.user_id == user_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(404, "Account not found")
    await db.delete(account)
