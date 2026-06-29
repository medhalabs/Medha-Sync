from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from core.database import get_db
from core.security import get_current_user_id
from features.messages.schemas import MessageOut, MessagePage
from features.messages.service import list_messages, save_message
from features.messages.models import MessageDirection, Message
from features.conversations.models import Conversation, ChannelType
from features.contacts.models import Contact
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class MessageSend(BaseModel):
    conversation_id: str
    content: str


@router.get("/conversation/{conversation_id}", response_model=MessagePage)
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_messages(db, conversation_id, page, size)
    return MessagePage(items=items, total=total)


@router.post("", response_model=MessageOut, status_code=201)
async def send_message(
    body: MessageSend,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    conv = (await db.execute(select(Conversation).where(Conversation.id == body.conversation_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Conversation not found")

    contact = (await db.execute(select(Contact).where(Contact.id == conv.contact_id))).scalar_one_or_none()

    msg = await save_message(
        db,
        conversation_id=conv.id,
        contact_id=conv.contact_id,
        direction=MessageDirection.outbound,
        content=body.content,
        sent_by=user_id,
    )
    await db.commit()

    # Send via WhatsApp if channel is whatsapp and contact has phone
    if conv.channel == ChannelType.whatsapp and contact and contact.phone:
        try:
            from features.whatsapp.provider import get_whatsapp_adapter
            adapter = get_whatsapp_adapter()
            await adapter.send_text(contact.phone, body.content)
        except Exception:
            logger.exception("Failed to send WA message to %s", contact.phone)

    await db.refresh(msg)
    return msg


@router.delete("/{message_id}", status_code=204)
async def delete_message(
    message_id: str,
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single message."""
    msg = (await db.execute(select(Message).where(Message.id == message_id))).scalar_one_or_none()
    if not msg:
        raise HTTPException(404, "Message not found")
    await db.delete(msg)
    await db.commit()


@router.delete("/conversation/{conversation_id}/all", status_code=204)
async def delete_all_messages(
    conversation_id: str,
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete all messages in a conversation."""
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Conversation not found")

    await db.execute(delete(Message).where(Message.conversation_id == conversation_id))
    await db.commit()
