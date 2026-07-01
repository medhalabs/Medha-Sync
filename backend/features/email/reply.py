import logging
from sqlalchemy.ext.asyncio import AsyncSession
from features.email.service import list_email_accounts
from features.email.smtp_sender import send_email
from features.conversations.models import Conversation

logger = logging.getLogger(__name__)


def _reply_subject(conv: Conversation) -> str:
    subject = (conv.subject or "Your message").strip()
    if not subject.lower().startswith("re:"):
        return f"Re: {subject}"
    return subject


async def send_conversation_reply(
    db: AsyncSession,
    user_id: str,
    conv: Conversation,
    to_email: str,
    body: str,
    attachments: list[dict] | None = None,
):
    accounts = await list_email_accounts(db, user_id)
    if not accounts:
        raise ValueError("No email account configured. Connect Gmail, Outlook, or IMAP in Settings.")

    account = accounts[0]
    subject = _reply_subject(conv)
    await send_email(account, to_email, subject, body, attachments=attachments, db=db)
