from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.automations.schemas import AutomationCreate, AutomationUpdate, AutomationOut
from features.automations.service import list_automations, create_automation, update_automation, delete_automation
from typing import List

router = APIRouter()


@router.get("", response_model=List[AutomationOut])
async def list_route(_: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await list_automations(db)


@router.post("", response_model=AutomationOut, status_code=201)
async def create_route(data: AutomationCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await create_automation(db, user_id, data)


@router.patch("/{rule_id}", response_model=AutomationOut)
async def update_route(rule_id: str, data: AutomationUpdate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await update_automation(db, rule_id, data)


@router.delete("/{rule_id}", status_code=204)
async def delete_route(rule_id: str, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await delete_automation(db, rule_id)
