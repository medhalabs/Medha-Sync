from workers.celery_app import celery_app
import asyncio
from sqlalchemy import select


@celery_app.task(name="workers.broadcast_tasks.send_broadcast_task")
def send_broadcast_task(broadcast_id: str):
    asyncio.run(_send(broadcast_id))


async def _send(broadcast_id: str):
    from core.database import AsyncSessionLocal
    from features.broadcasts.models import Broadcast, BroadcastStatus
    from features.contacts.models import Contact
    from features.whatsapp.provider import get_whatsapp_adapter
    from datetime import datetime

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
        broadcast = result.scalar_one_or_none()
        if not broadcast:
            return

        contacts_result = await db.execute(select(Contact).where(Contact.opted_out == False, Contact.phone != None))
        contacts = contacts_result.scalars().all()

        adapter = get_whatsapp_adapter()
        delivered = 0
        for contact in contacts:
            try:
                msg = broadcast.message_template.replace("{{name}}", contact.name or "")
                await adapter.send_text(contact.phone, msg)
                delivered += 1
            except Exception:
                pass

        broadcast.status = BroadcastStatus.sent
        broadcast.sent_at = datetime.utcnow()
        broadcast.total_recipients = len(contacts)
        broadcast.delivered_count = delivered
        await db.commit()
