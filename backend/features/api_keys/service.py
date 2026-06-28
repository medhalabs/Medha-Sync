import secrets
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from features.api_keys.models import ApiKey
from features.api_keys.schemas import ApiKeyCreate
from datetime import datetime


def _hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def create_api_key(db: AsyncSession, user_id: str, data: ApiKeyCreate) -> tuple[ApiKey, str]:
    raw_key = f"mk_{secrets.token_urlsafe(32)}"
    key = ApiKey(user_id=user_id, name=data.name, key_hash=_hash_key(raw_key), scopes=data.scopes)
    db.add(key)
    await db.flush()
    await db.refresh(key)
    return key, raw_key


async def list_api_keys(db: AsyncSession, user_id: str) -> list[ApiKey]:
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == user_id, ApiKey.is_active == True))
    return result.scalars().all()


async def revoke_api_key(db: AsyncSession, key_id: str, user_id: str):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user_id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(404, "API key not found")
    key.is_active = False
    key.revoked_at = datetime.utcnow()
    await db.flush()
