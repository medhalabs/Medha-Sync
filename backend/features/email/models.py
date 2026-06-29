import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class EmailAccount(Base):
    __tablename__ = "email_accounts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, index=True)
    label: Mapped[str] = mapped_column(String)
    provider: Mapped[str] = mapped_column(String(32), default="imap")  # imap | gmail | outlook
    email_address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # IMAP / SMTP plain-auth fields
    imap_host: Mapped[str | None] = mapped_column(String, nullable=True)
    imap_port: Mapped[int] = mapped_column(Integer, default=993)
    imap_use_ssl: Mapped[bool] = mapped_column(Boolean, default=True)
    username: Mapped[str | None] = mapped_column(String, nullable=True)
    password_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    smtp_host: Mapped[str | None] = mapped_column(String, nullable=True)
    smtp_port: Mapped[int] = mapped_column(Integer, default=587)

    # OAuth tokens (Gmail uses IMAP XOAUTH2; Outlook uses Graph API)
    access_token_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)

    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
