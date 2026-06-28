import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from features.email.models import EmailAccount
import asyncio


def _send_sync(account: EmailAccount, to: str, subject: str, body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = account.username
    msg["To"] = to
    msg.attach(MIMEText(body, "plain"))
    with smtplib.SMTP(account.smtp_host, account.smtp_port) as server:
        server.starttls()
        server.login(account.username, account.password)
        server.sendmail(account.username, to, msg.as_string())


async def send_email(account: EmailAccount, to: str, subject: str, body: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_sync, account, to, subject, body)
