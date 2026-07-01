from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from features.messages.models import MessageDirection, MessageType
from core.storage import file_public_url


class AttachmentOut(BaseModel):
    filename: str
    path: str
    content_type: str
    size: int
    url: str


class AttachmentIn(BaseModel):
    filename: str
    path: str
    content_type: str
    size: int


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    contact_id: str
    direction: MessageDirection
    message_type: MessageType
    content: Optional[str]
    media_url: Optional[str]
    attachments: List[AttachmentOut] = []
    wa_message_id: Optional[str]
    is_read: bool
    sent_by: Optional[str]
    sent_at: datetime

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    conversation_id: str
    content: str
    message_type: MessageType = MessageType.text
    attachments: List[AttachmentIn] = []


class MessagePage(BaseModel):
    items: List[MessageOut]
    total: int


def message_to_out(msg) -> MessageOut:
    attachments = []
    for att in msg.attachments or []:
        attachments.append(
            AttachmentOut(
                filename=att["filename"],
                path=att["path"],
                content_type=att.get("content_type", "application/octet-stream"),
                size=att.get("size", 0),
                url=file_public_url(att["path"]),
            )
        )
    return MessageOut(
        id=msg.id,
        conversation_id=msg.conversation_id,
        contact_id=msg.contact_id,
        direction=msg.direction,
        message_type=msg.message_type,
        content=msg.content,
        media_url=msg.media_url,
        attachments=attachments,
        wa_message_id=msg.wa_message_id,
        is_read=msg.is_read,
        sent_by=msg.sent_by,
        sent_at=msg.sent_at,
    )
