import smtplib
import base64
import asyncio
import httpx
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from sqlalchemy.ext.asyncio import AsyncSession
from features.email.models import EmailAccount
from features.email.service import get_decrypted_password, get_decrypted_access_token
from features.email.token_crypto import encrypt
from core.config import settings
from core.storage import get_object

logger = logging.getLogger(__name__)

AttachmentPayload = dict  # {filename, data: bytes, content_type}


def _build_mime(from_addr: str, to: str, subject: str, body: str, attachments: list[AttachmentPayload]):
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to
    msg.attach(MIMEText(body or "", "plain"))
    for att in attachments:
        content_type = att.get("content_type") or "application/octet-stream"
        maintype, _, subtype = content_type.partition("/")
        part = MIMEBase(maintype, subtype or "octet-stream")
        part.set_payload(att["data"])
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{att["filename"]}"')
        msg.attach(part)
    return msg


SMTP_TIMEOUT_SECONDS = 30


def _encode_gmail_raw(msg: MIMEMultipart) -> str:
    return base64.urlsafe_b64encode(msg.as_bytes()).decode().rstrip("=")


def _send_smtp_plain(account: EmailAccount, password: str, to: str, subject: str, body: str, attachments: list[AttachmentPayload]):
    from_addr = account.username or account.email_address
    msg = _build_mime(from_addr, to, subject, body, attachments)
    with smtplib.SMTP(account.smtp_host, account.smtp_port, timeout=SMTP_TIMEOUT_SECONDS) as server:
        server.starttls()
        server.login(from_addr, password)
        server.sendmail(from_addr, [to], msg.as_string())


async def _send_gmail_api(account: EmailAccount, access_token: str, to: str, subject: str, body: str, attachments: list[AttachmentPayload]):
    """Send via Gmail REST API (HTTPS). SMTP port 587 is blocked from many cloud Docker networks."""
    from_addr = account.email_address
    msg = _build_mime(from_addr, to, subject, body, attachments)
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers=headers,
            json={"raw": _encode_gmail_raw(msg)},
        )
        if resp.status_code == 401:
            raise PermissionError("gmail_token_expired")
        if resp.status_code == 403:
            try:
                detail = resp.json().get("error", {}).get("message", resp.text)
            except Exception:
                detail = resp.text
            if "accessNotConfigured" in resp.text or "Gmail API has not been used" in detail:
                raise ValueError(
                    "Gmail API is not enabled for your Google Cloud project. "
                    "Enable it at console.cloud.google.com → APIs & Services → Gmail API, then retry."
                )
            raise ValueError(detail or "Gmail API rejected the send request")
        resp.raise_for_status()


async def _send_outlook_graph(account: EmailAccount, access_token: str, to: str, subject: str, body: str, attachments: list[AttachmentPayload]):
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "Text", "content": body or ""},
            "toRecipients": [{"emailAddress": {"address": to}}],
        },
        "saveToSentItems": True,
    }
    if attachments:
        payload["message"]["attachments"] = [
            {
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": att["filename"],
                "contentType": att.get("content_type") or "application/octet-stream",
                "contentBytes": base64.b64encode(att["data"]).decode(),
            }
            for att in attachments
        ]
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post("https://graph.microsoft.com/v1.0/me/sendMail", headers=headers, json=payload)
        if resp.status_code == 401:
            raise PermissionError("outlook_token_expired")
        resp.raise_for_status()


async def _refresh_access_token(db: AsyncSession, account: EmailAccount) -> str:
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


def load_attachment_payloads(stored_attachments: list[dict]) -> list[AttachmentPayload]:
    payloads = []
    for att in stored_attachments:
        data, content_type = get_object(att["path"])
        payloads.append({
            "filename": att["filename"],
            "data": data,
            "content_type": att.get("content_type") or content_type,
        })
    return payloads


async def send_email(
    account: EmailAccount,
    to: str,
    subject: str,
    body: str,
    attachments: list[dict] | None = None,
    db: AsyncSession | None = None,
):
    """Send email via Gmail API, Microsoft Graph (Outlook), or SMTP (IMAP accounts)."""
    attachment_payloads = load_attachment_payloads(attachments or [])
    loop = asyncio.get_event_loop()

    if account.provider == "gmail":
        access_token = get_decrypted_access_token(account)
        if not access_token:
            raise ValueError("No Gmail access token configured")
        try:
            await _send_gmail_api(account, access_token, to, subject, body, attachment_payloads)
        except PermissionError:
            if not db:
                raise
            access_token = await _refresh_access_token(db, account)
            await _send_gmail_api(account, access_token, to, subject, body, attachment_payloads)

    elif account.provider == "outlook":
        access_token = get_decrypted_access_token(account)
        if not access_token:
            raise ValueError("No Outlook access token configured")
        try:
            await _send_outlook_graph(account, access_token, to, subject, body, attachment_payloads)
        except PermissionError:
            if not db:
                raise
            access_token = await _refresh_access_token(db, account)
            await _send_outlook_graph(account, access_token, to, subject, body, attachment_payloads)

    else:
        password = get_decrypted_password(account)
        if not password:
            raise ValueError("No SMTP credentials configured for this account")
        await loop.run_in_executor(
            None, _send_smtp_plain, account, password, to, subject, body, attachment_payloads
        )
