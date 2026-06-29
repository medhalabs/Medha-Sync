from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from features.conversations.models import ChannelType, ConversationStatus


class ConversationOut(BaseModel):
    id: str
    contact_id: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_avatar: Optional[str] = None
    contact_tags: List[str] = []
    last_message_preview: Optional[str] = None
    channel: ChannelType
    status: ConversationStatus
    assigned_to: Optional[str] = None
    subject: Optional[str] = None
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": False}


class ConversationUpdate(BaseModel):
    status: Optional[ConversationStatus] = None
    assigned_to: Optional[str] = None


class ConversationPage(BaseModel):
    items: List[ConversationOut]
    total: int
    page: int
    size: int
