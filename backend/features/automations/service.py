from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from features.automations.models import AutomationRule
from features.automations.schemas import AutomationCreate, AutomationUpdate


async def list_automations(db: AsyncSession) -> list[AutomationRule]:
    result = await db.execute(select(AutomationRule).order_by(AutomationRule.created_at.desc()))
    return result.scalars().all()


async def create_automation(db: AsyncSession, user_id: str, data: AutomationCreate) -> AutomationRule:
    rule = AutomationRule(created_by=user_id, **data.model_dump())
    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return rule


async def update_automation(db: AsyncSession, rule_id: str, data: AutomationUpdate) -> AutomationRule:
    result = await db.execute(select(AutomationRule).where(AutomationRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(404, "Automation not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(rule, k, v)
    await db.flush()
    await db.refresh(rule)
    return rule


async def delete_automation(db: AsyncSession, rule_id: str):
    result = await db.execute(select(AutomationRule).where(AutomationRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(404, "Automation not found")
    await db.delete(rule)


async def run_keyword_automations(db: AsyncSession, contact_id: str, text: str):
    result = await db.execute(
        select(AutomationRule).where(AutomationRule.trigger_type == "keyword", AutomationRule.is_active == True)
    )
    rules = result.scalars().all()
    for rule in rules:
        keyword = rule.trigger_config.get("keyword", "").lower()
        if keyword and keyword in text.lower():
            from features.automations.executor import execute_steps
            await execute_steps(db, rule, contact_id)
