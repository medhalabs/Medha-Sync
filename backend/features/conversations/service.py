from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from features.conversations.models import Conversation, ChannelType, ConversationStatus
from features.conversations.schemas import ConversationUpdate
from typing import Optional


async def get_or_create_conversation(db: AsyncSession, contact_id: str, channel: ChannelType) -> Conversation:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.contact_id == contact_id, Conversation.channel == channel, Conversation.status != ConversationStatus.resolved)
        .order_by(Conversation.created_at.desc())
    )
    conv = result.scalar_one_or_none()
    if not conv:
        conv = Conversation(contact_id=contact_id, channel=channel)
        db.add(conv)
        await db.flush()
        await db.refresh(conv)
    return conv


async def list_conversations(db: AsyncSession, page: int = 1, size: int = 20, channel: Optional[str] = None, status: Optional[str] = None, assigned_to: Optional[str] = None) -> tuple:
    query = select(Conversation)
    if channel:
        query = query.where(Conversation.channel == channel)
    if status:
        query = query.where(Conversation.status == status)
    if assigned_to:
        query = query.where(Conversation.assigned_to == assigned_to)
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    query = query.offset((page - 1) * size).limit(size).order_by(Conversation.last_message_at.desc())
    result = await db.execute(query)
    return result.scalars().all(), total


async def update_conversation(db: AsyncSession, conv_id: str, data: ConversationUpdate) -> Conversation:
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(conv, k, v)
    await db.flush()
    await db.refresh(conv)
    return conv
