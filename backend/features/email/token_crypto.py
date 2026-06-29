"""Fernet symmetric encryption for OAuth tokens and passwords stored in DB."""
import hashlib
import base64
from cryptography.fernet import Fernet
from core.config import settings


def _get_fernet() -> Fernet:
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key_bytes))


def encrypt(value: str) -> str:
    return _get_fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    return _get_fernet().decrypt(value.encode()).decode()
