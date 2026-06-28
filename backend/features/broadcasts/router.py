from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.broadcasts.schemas import BroadcastCreate, BroadcastOut
from features.broadcasts.service import create_broadcast, list_broadcasts, get_broadcast, send_broadcast_now
from typing import List

router = APIRouter()


@router.get("", response_model=List[BroadcastOut])
async def list_route(_: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await list_broadcasts(db)


@router.post("", response_model=BroadcastOut, status_code=201)
async def create_route(data: BroadcastCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await create_broadcast(db, user_id, data)


@router.get("/{broadcast_id}", response_model=BroadcastOut)
async def get_route(broadcast_id: str, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await get_broadcast(db, broadcast_id)


@router.post("/{broadcast_id}/send")
async def send_route(broadcast_id: str, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await send_broadcast_now(db, broadcast_id)
    return {"status": "queued"}
