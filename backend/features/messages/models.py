import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Enum as SAEnum, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base
import enum


class MessageDirection(str, enum.Enum):
    inbound = "inbound"
    outbound = "outbound"


class MessageType(str, enum.Enum):
    text = "text"
    image = "image"
    document = "document"
    audio = "audio"
    video = "video"
    interactive = "interactive"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String, index=True)
    contact_id: Mapped[str] = mapped_column(String, index=True)
    direction: Mapped[MessageDirection] = mapped_column(SAEnum(MessageDirection))
    message_type: Mapped[MessageType] = mapped_column(SAEnum(MessageType), default=MessageType.text)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_url: Mapped[str | None] = mapped_column(String, nullable=True)
    attachments: Mapped[list] = mapped_column(JSON, default=list)
    wa_message_id: Mapped[str | None] = mapped_column(String, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_by: Mapped[str | None] = mapped_column(String, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
