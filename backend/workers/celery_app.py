from celery import Celery
from core.config import settings

celery_app = Celery(
    "medha",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["workers.broadcast_tasks", "workers.email_sync_tasks"],
)

celery_app.conf.beat_schedule = {
    "sync-emails-every-5-minutes": {
        "task": "workers.email_sync_tasks.sync_all_emails",
        "schedule": 300.0,
    },
}

celery_app.conf.timezone = "UTC"
