from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.pipeline.schemas import StageCreate, StageOut, DealCreate, DealUpdate, DealOut
from features.pipeline.service import list_stages, create_stage, list_deals, create_deal, update_deal, delete_deal
from typing import List, Optional

router = APIRouter()


@router.get("/stages", response_model=List[StageOut])
async def get_stages(_: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await list_stages(db)


@router.post("/stages", response_model=StageOut, status_code=201)
async def add_stage(data: StageCreate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await create_stage(db, data)


@router.get("/deals", response_model=List[DealOut])
async def get_deals(stage_id: Optional[str] = None, contact_id: Optional[str] = None, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await list_deals(db, stage_id, contact_id)


@router.post("/deals", response_model=DealOut, status_code=201)
async def add_deal(data: DealCreate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await create_deal(db, data)


@router.patch("/deals/{deal_id}", response_model=DealOut)
async def patch_deal(deal_id: str, data: DealUpdate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await update_deal(db, deal_id, data)


@router.delete("/deals/{deal_id}", status_code=204)
async def remove_deal(deal_id: str, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await delete_deal(db, deal_id)
