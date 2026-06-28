from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.api_keys.schemas import ApiKeyCreate, ApiKeyOut, ApiKeyCreated
from features.api_keys.service import create_api_key, list_api_keys, revoke_api_key
from typing import List

router = APIRouter()


@router.get("", response_model=List[ApiKeyOut])
async def list_keys(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await list_api_keys(db, user_id)


@router.post("", response_model=ApiKeyCreated, status_code=201)
async def create_key(data: ApiKeyCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    key, raw = await create_api_key(db, user_id, data)
    return ApiKeyCreated(**key.__dict__, raw_key=raw)


@router.delete("/{key_id}", status_code=204)
async def revoke_key(key_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await revoke_api_key(db, key_id, user_id)
