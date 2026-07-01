from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from features.messages.models import Message, MessageDirection, MessageType
from features.conversations.models import Conversation
from datetime import datetime


async def save_message(
    db: AsyncSession,
    conversation_id: str,
    contact_id: str,
    direction: MessageDirection,
    content: str,
    message_type: MessageType = MessageType.text,
    media_url: str = None,
    attachments: list | None = None,
    wa_message_id: str = None,
    sent_by: str = None,
) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        contact_id=contact_id,
        direction=direction,
        message_type=message_type,
        content=content,
        media_url=media_url,
        attachments=attachments or [],
        wa_message_id=wa_message_id,
        sent_by=sent_by,
    )
    db.add(msg)
    await db.execute(
        Conversation.__table__.update()
        .where(Conversation.id == conversation_id)
        .values(last_message_at=datetime.utcnow())
    )
    await db.flush()
    await db.refresh(msg)
    return msg


async def list_messages(db: AsyncSession, conversation_id: str, page: int = 1, size: int = 50) -> tuple:
    query = select(Message).where(Message.conversation_id == conversation_id)
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    query = query.order_by(Message.sent_at.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    return list(reversed(result.scalars().all())), total
