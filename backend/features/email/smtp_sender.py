import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from features.email.models import EmailAccount
from features.email.service import get_decrypted_password
import asyncio


def _send_sync(account: EmailAccount, password: str, to: str, subject: str, body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = account.username or account.email_address
    msg["To"] = to
    msg.attach(MIMEText(body, "plain"))
    with smtplib.SMTP(account.smtp_host, account.smtp_port) as server:
        server.starttls()
        server.login(account.username or account.email_address, password)
        server.sendmail(account.username or account.email_address, to, msg.as_string())


async def send_email(account: EmailAccount, to: str, subject: str, body: str):
    password = get_decrypted_password(account)
    if not password:
        raise ValueError("No SMTP credentials configured for this account")
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_sync, account, password, to, subject, body)
