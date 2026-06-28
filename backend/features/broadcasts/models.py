import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, JSON, Enum as SAEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base
import enum


class BroadcastStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    sending = "sending"
    sent = "sent"
    failed = "failed"


class Broadcast(Base):
    __tablename__ = "broadcasts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String)
    message_template: Mapped[str] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(String, default="whatsapp")
    segment_filter: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[BroadcastStatus] = mapped_column(SAEnum(BroadcastStatus), default=BroadcastStatus.draft)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    total_recipients: Mapped[int] = mapped_column(Integer, default=0)
    delivered_count: Mapped[int] = mapped_column(Integer, default=0)
    read_count: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
