from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List
from features.broadcasts.models import BroadcastStatus


class BroadcastCreate(BaseModel):
    name: str
    message_template: str
    channel: str = "whatsapp"
    segment_filter: Dict[str, Any] = {}
    scheduled_at: Optional[datetime] = None


class BroadcastOut(BaseModel):
    id: str
    name: str
    message_template: str
    channel: str
    segment_filter: Dict[str, Any]
    status: BroadcastStatus
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    total_recipients: int
    delivered_count: int
    read_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
