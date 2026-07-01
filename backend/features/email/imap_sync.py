import imapclient
import email
import httpx
import asyncio
import base64
import logging
from email.header import decode_header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from features.email.models import EmailAccount
from features.email.service import get_decrypted_password, get_decrypted_access_token
from features.contacts.models import Contact
from features.conversations.service import get_or_create_conversation
from features.conversations.models import ChannelType, Conversation
from features.messages.service import save_message
from features.messages.models import MessageDirection, MessageType
from features.contacts.service import create_contact
from features.contacts.schemas import ContactCreate
from features.email.token_crypto import encrypt
from features.email.body_utils import normalize_email_body
from core.config import settings
from core.storage import upload_file

logger = logging.getLogger(__name__)


def _decode_header_value(value: str) -> str:
    parts = decode_header(value)
    result = []
    for part, charset in parts:
        if isinstance(part, bytes):
            result.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            result.append(part)
    return "".join(result)


def _extract_body_and_attachments(msg) -> tuple[str, list[dict]]:
    plain = ""
    html = ""
    attachments: list[dict] = []

    if msg.is_multipart():
        for part in msg.walk():
            content_disposition = str(part.get("Content-Disposition", ""))
            filename = part.get_filename()
            if filename:
                filename = _decode_header_value(filename)
            is_attachment = bool(filename) or "attachment" in content_disposition.lower()
            if is_attachment:
                payload = part.get_payload(decode=True)
                if not payload:
                    continue
                safe_name = filename or "attachment"
                content_type = part.get_content_type() or "application/octet-stream"
                try:
                    stored_path = upload_file(payload, safe_name, content_type)
                    attachments.append({
                        "filename": safe_name,
                        "path": stored_path,
                        "content_type": content_type,
                        "size": len(payload),
                    })
                except Exception:
                    logger.exception("Failed to store attachment %s", safe_name)
                continue
            ctype = part.get_content_type()
            payload = part.get_payload(decode=True)
            if not payload:
                continue
            charset = part.get_content_charset() or "utf-8"
            decoded = payload.decode(charset, errors="replace")
            if ctype == "text/plain" and not plain:
                plain = decoded
            elif ctype == "text/html" and not html:
                html = decoded
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            decoded = payload.decode(charset, errors="replace")
            if msg.get_content_type() == "text/html":
                html = decoded
            else:
                plain = decoded

    body = normalize_email_body(plain=plain, html=html)
    return body, attachments


def _parse_rfc822(raw_bytes: bytes) -> dict:
    msg = email.message_from_bytes(raw_bytes)
    from_addr = msg.get("From", "")
    subject = _decode_header_value(msg.get("Subject", ""))
    body, attachments = _extract_body_and_attachments(msg)
    return {"from": from_addr, "subject": subject, "body": body, "attachments": attachments}


def _sync_imap_plain(account: EmailAccount, password: str) -> list[dict]:
    """Fetch via IMAP with username/password."""
    messages = []
    with imapclient.IMAPClient(account.imap_host, port=account.imap_port, ssl=account.imap_use_ssl) as client:
        client.login(account.username, password)
        client.select_folder("INBOX")
        since = account.last_synced_at.date() if account.last_synced_at else None
        criteria = ["UNSEEN"] if not since else [f"SINCE {since.strftime('%d-%b-%Y')}"]
        uids = client.search(criteria)
        if not uids:
            return messages
        raw = client.fetch(uids, ["RFC822"])
        for uid, data in raw.items():
            messages.append(_parse_rfc822(data[b"RFC822"]))
    return messages


def _sync_imap_xoauth2(account: EmailAccount, access_token: str) -> list[dict]:
    """Fetch via IMAP XOAUTH2 (Gmail OAuth)."""
    messages = []
    with imapclient.IMAPClient("imap.gmail.com", port=993, ssl=True) as client:
        client.oauth2_login(account.email_address, access_token)
        client.select_folder("INBOX")
        since = account.last_synced_at.date() if account.last_synced_at else None
        criteria = ["UNSEEN"] if not since else [f"SINCE {since.strftime('%d-%b-%Y')}"]
        uids = client.search(criteria)
        if not uids:
            return messages
        raw = client.fetch(uids, ["RFC822"])
        for uid, data in raw.items():
            messages.append(_parse_rfc822(data[b"RFC822"]))
    return messages


async def _fetch_outlook_attachments(client: httpx.AsyncClient, message_id: str, headers: dict) -> list[dict]:
    attachments: list[dict] = []
    resp = await client.get(
        f"https://graph.microsoft.com/v1.0/me/messages/{message_id}/attachments",
        headers=headers,
    )
    resp.raise_for_status()
    for att in resp.json().get("value", []):
        if att.get("@odata.type") != "#microsoft.graph.fileAttachment":
            continue
        raw = att.get("contentBytes")
        if not raw:
            continue
        data = base64.b64decode(raw)
        filename = att.get("name") or "attachment"
        content_type = att.get("contentType") or "application/octet-stream"
        try:
            stored_path = upload_file(data, filename, content_type)
            attachments.append({
                "filename": filename,
                "path": stored_path,
                "content_type": content_type,
                "size": len(data),
            })
        except Exception:
            logger.exception("Failed to store Outlook attachment %s", filename)
    return attachments


async def _fetch_outlook_messages(account: EmailAccount, access_token: str) -> list[dict]:
    """Fetch unread messages from Outlook via Microsoft Graph REST API."""
    messages = []
    headers = {"Authorization": f"Bearer {access_token}"}
    url = (
        "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages"
        "?$filter=isRead eq false&$top=50&$select=id,from,subject,body,hasAttachments"
    )
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code == 401:
            raise PermissionError("outlook_token_expired")
        resp.raise_for_status()
        data = resp.json()
        for m in data.get("value", []):
            from_email = (m.get("from") or {}).get("emailAddress", {}).get("address", "")
            subject = m.get("subject", "")
            body_raw = (m.get("body") or {}).get("content", "")
            body = normalize_email_body(
                html=body_raw if (m.get("body") or {}).get("contentType") == "html" else "",
                plain=body_raw if (m.get("body") or {}).get("contentType") != "html" else "",
            )
            attachments = []
            if m.get("hasAttachments"):
                attachments = await _fetch_outlook_attachments(client, m["id"], headers)
            messages.append({
                "from": from_email,
                "subject": subject,
                "body": body,
                "attachments": attachments,
            })
    return messages


async def _refresh_and_update(db: AsyncSession, account: EmailAccount) -> str:
    """Refresh OAuth token, update DB, return new access token."""
    from features.email import google_oauth, outlook_oauth
    if account.provider == "gmail":
        resp = google_oauth.refresh_access_token(
            account.refresh_token,
            settings.GOOGLE_CLIENT_ID,
            settings.GOOGLE_CLIENT_SECRET,
        )
    else:
        resp = outlook_oauth.refresh_access_token(
            account.refresh_token,
            settings.MICROSOFT_CLIENT_ID,
            settings.MICROSOFT_CLIENT_SECRET,
        )
    new_token = resp.get("access_token", "")
    account.access_token_encrypted = encrypt(new_token)
    await db.flush()
    return new_token


async def sync_account(db: AsyncSession, account: EmailAccount):
    loop = asyncio.get_event_loop()

    if account.provider == "gmail":
        access_token = get_decrypted_access_token(account)
        if not access_token:
            logger.warning("No access token for Gmail account %s", account.id)
            return
        try:
            messages = await loop.run_in_executor(None, _sync_imap_xoauth2, account, access_token)
        except Exception as e:
            if "authentication" in str(e).lower() or "AUTHENTICATIONFAILED" in str(e):
                logger.info("Gmail token expired for %s, refreshing", account.email_address)
                access_token = await _refresh_and_update(db, account)
                messages = await loop.run_in_executor(None, _sync_imap_xoauth2, account, access_token)
            else:
                raise

    elif account.provider == "outlook":
        access_token = get_decrypted_access_token(account)
        if not access_token:
            logger.warning("No access token for Outlook account %s", account.id)
            return
        try:
            messages = await _fetch_outlook_messages(account, access_token)
        except PermissionError:
            logger.info("Outlook token expired for %s, refreshing", account.email_address)
            access_token = await _refresh_and_update(db, account)
            messages = await _fetch_outlook_messages(account, access_token)

    else:
        password = get_decrypted_password(account)
        if not password:
            return
        messages = await loop.run_in_executor(None, _sync_imap_plain, account, password)

    for raw in messages:
        from_raw = raw["from"]
        from_email = from_raw.split("<")[-1].strip(">").strip() if "<" in from_raw else from_raw.strip()
        if not from_email:
            continue
        result = await db.execute(select(Contact).where(Contact.email == from_email))
        contact = result.scalar_one_or_none()
        if not contact:
            contact = await create_contact(db, ContactCreate(email=from_email, source="email"))
        conv = await get_or_create_conversation(db, contact.id, ChannelType.email)
        if raw.get("subject") and not conv.subject:
            conv.subject = raw["subject"]
        attachments = raw.get("attachments") or []
        content = raw["body"] or raw["subject"] or "(no content)"
        if attachments and not raw["body"]:
            names = ", ".join(a["filename"] for a in attachments[:3])
            content = f"Sent {len(attachments)} attachment(s): {names}"
        message_type = MessageType.document if attachments and not raw["body"] else MessageType.text
        await save_message(
            db,
            conversation_id=conv.id,
            contact_id=contact.id,
            direction=MessageDirection.inbound,
            content=content,
            message_type=message_type,
            attachments=attachments,
        )

    import datetime as dt
    account.last_synced_at = dt.datetime.utcnow()
    await db.flush()
