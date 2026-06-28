import imapclient
import email
from email.header import decode_header
from sqlalchemy.ext.asyncio import AsyncSession
from features.email.models import EmailAccount
from features.contacts.models import Contact
from features.conversations.service import get_or_create_conversation
from features.conversations.models import ChannelType
from features.messages.service import save_message
from features.messages.models import MessageDirection, MessageType
from features.contacts.service import create_contact
from features.contacts.schemas import ContactCreate
from sqlalchemy import select
import asyncio


def _decode_header_value(value: str) -> str:
    parts = decode_header(value)
    result = []
    for part, charset in parts:
        if isinstance(part, bytes):
            result.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            result.append(part)
    return "".join(result)


def _sync_fetch(account: EmailAccount) -> list[dict]:
    messages = []
    with imapclient.IMAPClient(account.imap_host, port=account.imap_port, ssl=account.imap_use_ssl) as client:
        client.login(account.username, account.password)
        client.select_folder("INBOX")
        since = account.last_synced_at.date() if account.last_synced_at else None
        criteria = ["UNSEEN"] if not since else [f"SINCE {since.strftime('%d-%b-%Y')}"]
        uids = client.search(criteria)
        if not uids:
            return messages
        raw = client.fetch(uids, ["RFC822"])
        for uid, data in raw.items():
            raw_email = data[b"RFC822"]
            msg = email.message_from_bytes(raw_email)
            from_addr = msg.get("From", "")
            subject = _decode_header_value(msg.get("Subject", ""))
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="replace")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="replace")
            messages.append({"from": from_addr, "subject": subject, "body": body})
    return messages


async def sync_account(db: AsyncSession, account: EmailAccount):
    loop = asyncio.get_event_loop()
    messages = await loop.run_in_executor(None, _sync_fetch, account)

    for raw in messages:
        from_email = raw["from"].split("<")[-1].strip(">").strip()
        result = await db.execute(select(Contact).where(Contact.email == from_email))
        contact = result.scalar_one_or_none()
        if not contact:
            contact = await create_contact(db, ContactCreate(email=from_email, source="email"))
        conv = await get_or_create_conversation(db, contact.id, ChannelType.email)
        await save_message(
            db,
            conversation_id=conv.id,
            contact_id=contact.id,
            direction=MessageDirection.inbound,
            content=raw["body"],
            message_type=MessageType.text,
        )

    account.last_synced_at = __import__("datetime").datetime.utcnow()
    await db.flush()
