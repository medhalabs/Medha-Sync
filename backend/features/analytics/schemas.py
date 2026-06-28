from pydantic import BaseModel
from typing import List, Dict, Any


class OverviewStats(BaseModel):
    total_contacts: int
    total_conversations: int
    whatsapp_conversations: int
    email_conversations: int
    open_conversations: int
    resolved_today: int


class ChannelVolume(BaseModel):
    date: str
    whatsapp: int
    email: int


class AnalyticsOut(BaseModel):
    overview: OverviewStats
    volume_last_7_days: List[ChannelVolume]
