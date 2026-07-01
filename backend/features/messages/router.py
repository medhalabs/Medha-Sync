from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from core.database import get_db
from core.security import get_current_user_id
from core.storage import upload_file, file_public_url, MAX_UPLOAD_BYTES, is_stored_path
from features.messages.schemas import MessageOut, MessagePage, AttachmentIn, message_to_out
from features.messages.service import list_messages, save_message
from features.messages.models import MessageDirection, Message, MessageType
from features.conversations.models import Conversation, ChannelType
from features.contacts.models import Contact
from features.email.reply import send_conversation_reply
from pydantic import BaseModel
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class MessageSend(BaseModel):
    conversation_id: str
    content: str
    attachments: List[AttachmentIn] = []


class AttachmentUploadOut(BaseModel):
    filename: str
    path: str
    content_type: str
    size: int
    url: str


@router.get("/conversation/{conversation_id}", response_model=MessagePage)
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_messages(db, conversation_id, page, size)
    return MessagePage(items=[message_to_out(m) for m in items], total=total)


@router.post("/attachments/upload", response_model=AttachmentUploadOut)
async def upload_message_attachment(
    file: UploadFile = File(...),
    _: str = Depends(get_current_user_id),
):
    if not file.filename:
        raise HTTPException(400, "Filename is required")

    content_type = file.content_type or "application/octet-stream"
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

    stored_path = upload_file(content, file.filename, content_type)
    return AttachmentUploadOut(
        filename=file.filename,
        path=stored_path,
        content_type=content_type,
        size=len(content),
        url=file_public_url(stored_path),
    )


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

    attachments = []
    for att in body.attachments:
        if not is_stored_path(att.path):
            raise HTTPException(400, f"Invalid attachment path: {att.filename}")
        attachments.append(att.model_dump())

    if not body.content.strip() and not attachments:
        raise HTTPException(400, "Message content or attachment is required")

    message_type = MessageType.document if attachments and not body.content.strip() else MessageType.text
    msg = await save_message(
        db,
        conversation_id=conv.id,
        contact_id=conv.contact_id,
        direction=MessageDirection.outbound,
        content=body.content,
        message_type=message_type,
        attachments=attachments,
        sent_by=user_id,
    )

    if conv.channel == ChannelType.email:
        if not contact or not contact.email:
            raise HTTPException(400, "Contact has no email address")
        try:
            await send_conversation_reply(
                db,
                user_id,
                conv,
                contact.email,
                body.content,
                attachments=attachments,
            )
        except ValueError as e:
            await db.rollback()
            raise HTTPException(400, str(e))
        except Exception:
            logger.exception("Failed to send email reply to %s", contact.email)
            await db.rollback()
            raise HTTPException(502, "Failed to send email. Check your email account settings.")

    elif conv.channel == ChannelType.whatsapp and contact and contact.phone:
        try:
            from features.whatsapp.provider import get_whatsapp_adapter
            adapter = get_whatsapp_adapter()
            await adapter.send_text(contact.phone, body.content)
        except Exception:
            logger.exception("Failed to send WA message to %s", contact.phone)

    await db.commit()
    await db.refresh(msg)
    return message_to_out(msg)


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
