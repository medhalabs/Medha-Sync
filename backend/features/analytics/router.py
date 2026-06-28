from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.analytics.schemas import AnalyticsOut
from features.analytics.service import get_analytics

router = APIRouter()


@router.get("", response_model=AnalyticsOut)
async def analytics(_: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await get_analytics(db)
