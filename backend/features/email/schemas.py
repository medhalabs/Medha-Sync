from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class EmailAccountCreate(BaseModel):
    label: str
    imap_host: str
    imap_port: int = 993
    imap_use_ssl: bool = True
    username: str
    password: str
    smtp_host: str
    smtp_port: int = 587


class EmailAccountOut(BaseModel):
    id: str
    label: str
    imap_host: str
    username: str
    last_synced_at: Optional[datetime]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    conversation_id: Optional[str] = None
