from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ImapAccountCreate(BaseModel):
    label: str
    imap_host: str
    imap_port: int = 993
    imap_use_ssl: bool = True
    username: str
    password: str
    smtp_host: str
    smtp_port: int = 587


# Keep old name as alias for backwards compat
EmailAccountCreate = ImapAccountCreate


class OAuthCallbackRequest(BaseModel):
    code: str
    redirect_uri: str


class OAuthAuthorizeOut(BaseModel):
    authorize_url: str


class EmailAccountOut(BaseModel):
    id: str
    label: str
    provider: str
    email_address: Optional[str]
    imap_host: Optional[str]
    username: Optional[str]
    last_synced_at: Optional[datetime]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    conversation_id: Optional[str] = None
