from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime


async def execute_steps(db, rule, contact_id: str):
    import asyncio
    from features.automations.models import AutomationRule

    for step in rule.steps:
        step_type = step.get("type")
        config = step.get("config", {})

        if step_type == "send_whatsapp":
            from features.whatsapp.provider import get_whatsapp_adapter
            from features.contacts.models import Contact
            from sqlalchemy import select
            result = await db.execute(select(Contact).where(Contact.id == contact_id))
            contact = result.scalar_one_or_none()
            if contact and contact.phone:
                adapter = get_whatsapp_adapter()
                await adapter.send_text(contact.phone, config.get("message", ""))

        elif step_type == "add_tag":
            from features.contacts.models import Contact
            from sqlalchemy import select
            result = await db.execute(select(Contact).where(Contact.id == contact_id))
            contact = result.scalar_one_or_none()
            if contact:
                tags = contact.tags or []
                tag = config.get("tag")
                if tag and tag not in tags:
                    tags.append(tag)
                    contact.tags = tags

        elif step_type == "move_pipeline":
            from features.contacts.models import Contact
            from sqlalchemy import select
            result = await db.execute(select(Contact).where(Contact.id == contact_id))
            contact = result.scalar_one_or_none()
            if contact:
                contact.pipeline_stage_id = config.get("stage_id")

        elif step_type == "wait":
            seconds = config.get("seconds", 0)
            if seconds > 0:
                await asyncio.sleep(min(seconds, 30))

    rule.last_run_at = datetime.utcnow()
    rule.run_count += 1
    await db.flush()
