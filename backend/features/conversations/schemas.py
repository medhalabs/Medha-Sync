from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from features.conversations.models import ChannelType, ConversationStatus


class ConversationOut(BaseModel):
    id: str
    contact_id: str
    channel: ChannelType
    status: ConversationStatus
    assigned_to: Optional[str]
    subject: Optional[str]
    last_message_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationUpdate(BaseModel):
    status: Optional[ConversationStatus] = None
    assigned_to: Optional[str] = None


class ConversationPage(BaseModel):
    items: List[ConversationOut]
    total: int
    page: int
    size: int
