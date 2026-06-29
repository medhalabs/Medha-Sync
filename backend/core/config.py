from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # MinIO
    MINIO_ENDPOINT: str
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_BUCKET: str = "medha-files"
    MINIO_SECURE: bool = False

    # Public URLs for stored files (WhatsApp + dashboard links)
    BACKEND_URL: str = "http://backend:8000"
    PUBLIC_API_URL: str = "http://localhost:8000"

    # Auth — SECRET_KEY MUST be set via environment variable in production
    SECRET_KEY: str = "dev-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # WhatsApp
    WA_PROVIDER: str = "baileys"
    BAILEYS_SERVICE_URL: str = "http://baileys-service:3001"
    META_PHONE_NUMBER_ID: str = ""
    META_ACCESS_TOKEN: str = ""
    META_WEBHOOK_VERIFY_TOKEN: str = ""

    # Email (legacy IMAP env-based)
    EMAIL_HOST: str = ""
    EMAIL_PORT: int = 993
    EMAIL_USE_SSL: bool = True
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    # Google OAuth (Gmail)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/settings/email-callback"

    # Microsoft OAuth (Outlook)
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    MICROSOFT_REDIRECT_URI: str = "http://localhost:3000/settings/email-callback"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # App — DEBUG should be False in production
    ENVIRONMENT: str = "development"
    DEBUG: bool = False  # Change to True only locally via .env
    CORS_ORIGINS: List[str] = []  # Must be explicitly configured

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
