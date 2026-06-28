from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from features.broadcasts.models import Broadcast, BroadcastStatus
from features.broadcasts.schemas import BroadcastCreate
from datetime import datetime


async def create_broadcast(db: AsyncSession, user_id: str, data: BroadcastCreate) -> Broadcast:
    broadcast = Broadcast(created_by=user_id, **data.model_dump())
    db.add(broadcast)
    await db.flush()
    await db.refresh(broadcast)
    return broadcast


async def list_broadcasts(db: AsyncSession) -> list[Broadcast]:
    result = await db.execute(select(Broadcast).order_by(Broadcast.created_at.desc()))
    return result.scalars().all()


async def get_broadcast(db: AsyncSession, broadcast_id: str) -> Broadcast:
    result = await db.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
    b = result.scalar_one_or_none()
    if not b:
        raise HTTPException(404, "Broadcast not found")
    return b


async def send_broadcast_now(db: AsyncSession, broadcast_id: str):
    from workers.broadcast_tasks import send_broadcast_task
    send_broadcast_task.delay(broadcast_id)
    broadcast = await get_broadcast(db, broadcast_id)
    broadcast.status = BroadcastStatus.sending
    await db.flush()
