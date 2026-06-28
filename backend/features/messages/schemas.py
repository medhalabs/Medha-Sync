from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from features.messages.models import MessageDirection, MessageType


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    contact_id: str
    direction: MessageDirection
    message_type: MessageType
    content: Optional[str]
    media_url: Optional[str]
    wa_message_id: Optional[str]
    is_read: bool
    sent_by: Optional[str]
    sent_at: datetime

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    conversation_id: str
    content: str
    message_type: MessageType = MessageType.text


class MessagePage(BaseModel):
    items: List[MessageOut]
    total: int
