from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from features.conversations.models import Conversation, ChannelType, ConversationStatus
from features.conversations.schemas import ConversationOut, ConversationUpdate
from features.contacts.models import Contact
from features.messages.models import Message
from typing import Optional


def _build_out(conv: Conversation, contact: Contact | None, preview: str | None) -> ConversationOut:
    return ConversationOut(
        id=conv.id,
        contact_id=conv.contact_id,
        contact_name=contact.name if contact else None,
        contact_phone=contact.phone if contact else None,
        contact_email=contact.email if contact else None,
        contact_avatar=contact.avatar_url if contact else None,
        contact_tags=contact.tags if contact else [],
        last_message_preview=preview,
        channel=conv.channel,
        status=conv.status,
        assigned_to=conv.assigned_to,
        subject=conv.subject,
        last_message_at=conv.last_message_at,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


async def get_or_create_conversation(db: AsyncSession, contact_id: str, channel: ChannelType) -> Conversation:
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.contact_id == contact_id,
            Conversation.channel == channel,
            Conversation.status != ConversationStatus.resolved,
        )
        .order_by(Conversation.created_at.desc())
    )
    conv = result.scalar_one_or_none()
    if not conv:
        conv = Conversation(contact_id=contact_id, channel=channel)
        db.add(conv)
        await db.flush()
        await db.refresh(conv)
    return conv


async def list_conversations(
    db: AsyncSession,
    page: int = 1,
    size: int = 20,
    channel: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
) -> tuple:
    query = select(Conversation)
    if channel:
        query = query.where(Conversation.channel == channel)
    if status:
        query = query.where(Conversation.status == status)
    if assigned_to:
        query = query.where(Conversation.assigned_to == assigned_to)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.order_by(Conversation.last_message_at.desc().nullslast()).offset((page - 1) * size).limit(size)
    convs = (await db.execute(query)).scalars().all()

    # Batch-load contacts and last message preview
    contact_ids = list({c.contact_id for c in convs})
    contacts = {}
    if contact_ids:
        rows = (await db.execute(select(Contact).where(Contact.id.in_(contact_ids)))).scalars().all()
        contacts = {r.id: r for r in rows}

    previews = {}
    for conv in convs:
        last_msg = (
            await db.execute(
                select(Message)
                .where(Message.conversation_id == conv.id)
                .order_by(Message.sent_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        previews[conv.id] = (last_msg.content[:80] if last_msg and last_msg.content else None)

    items = [_build_out(c, contacts.get(c.contact_id), previews.get(c.id)) for c in convs]
    return items, total


async def get_conversation(db: AsyncSession, conv_id: str) -> ConversationOut:
    conv = (await db.execute(select(Conversation).where(Conversation.id == conv_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    contact = (await db.execute(select(Contact).where(Contact.id == conv.contact_id))).scalar_one_or_none()
    last_msg = (
        await db.execute(
            select(Message).where(Message.conversation_id == conv_id).order_by(Message.sent_at.desc()).limit(1)
        )
    ).scalar_one_or_none()
    return _build_out(conv, contact, last_msg.content[:80] if last_msg and last_msg.content else None)


async def update_conversation(db: AsyncSession, conv_id: str, data: ConversationUpdate) -> ConversationOut:
    conv = (await db.execute(select(Conversation).where(Conversation.id == conv_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(conv, k, v)
    await db.flush()
    await db.refresh(conv)
    contact = (await db.execute(select(Contact).where(Contact.id == conv.contact_id))).scalar_one_or_none()
    return _build_out(conv, contact, None)
