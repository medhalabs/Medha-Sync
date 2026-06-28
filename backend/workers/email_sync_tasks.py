from workers.celery_app import celery_app
import asyncio


@celery_app.task(name="workers.email_sync_tasks.sync_all_emails")
def sync_all_emails():
    asyncio.run(_sync())


async def _sync():
    from core.database import AsyncSessionLocal
    from features.email.service import get_all_active_accounts
    from features.email.imap_sync import sync_account

    async with AsyncSessionLocal() as db:
        accounts = await get_all_active_accounts(db)
        for account in accounts:
            try:
                await sync_account(db, account)
            except Exception:
                pass
        await db.commit()
