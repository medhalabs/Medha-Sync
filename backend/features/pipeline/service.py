from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from features.pipeline.models import PipelineStage, Deal
from features.pipeline.schemas import StageCreate, DealCreate, DealUpdate


async def list_stages(db: AsyncSession) -> list[PipelineStage]:
    result = await db.execute(select(PipelineStage).order_by(PipelineStage.position))
    return result.scalars().all()


async def create_stage(db: AsyncSession, data: StageCreate) -> PipelineStage:
    stage = PipelineStage(**data.model_dump())
    db.add(stage)
    await db.flush()
    await db.refresh(stage)
    return stage


async def list_deals(db: AsyncSession, stage_id: str = None, contact_id: str = None) -> list[Deal]:
    query = select(Deal)
    if stage_id:
        query = query.where(Deal.stage_id == stage_id)
    if contact_id:
        query = query.where(Deal.contact_id == contact_id)
    result = await db.execute(query.order_by(Deal.created_at.desc()))
    return result.scalars().all()


async def create_deal(db: AsyncSession, data: DealCreate) -> Deal:
    deal = Deal(**data.model_dump())
    db.add(deal)
    await db.flush()
    await db.refresh(deal)
    return deal


async def update_deal(db: AsyncSession, deal_id: str, data: DealUpdate) -> Deal:
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(404, "Deal not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(deal, k, v)
    await db.flush()
    await db.refresh(deal)
    return deal


async def delete_deal(db: AsyncSession, deal_id: str):
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(404, "Deal not found")
    await db.delete(deal)
