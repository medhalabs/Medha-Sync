from pydantic import BaseModel
from typing import List


class OverviewStats(BaseModel):
    total_contacts: int
    total_conversations: int
    whatsapp_conversations: int
    email_conversations: int
    open_conversations: int
    resolved_today: int
    total_messages: int
    messages_today: int
    bot_conversations: int
    agent_conversations: int


class ChannelVolume(BaseModel):
    date: str
    whatsapp: int
    email: int


class ConversationStatusBreakdown(BaseModel):
    bot: int
    agent: int
    resolved: int


class AnalyticsOut(BaseModel):
    overview: OverviewStats
    volume_last_7_days: List[ChannelVolume]
    status_breakdown: ConversationStatusBreakdown
