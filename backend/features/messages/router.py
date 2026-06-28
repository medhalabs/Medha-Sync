from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.messages.schemas import MessageOut, MessagePage
from features.messages.service import list_messages

router = APIRouter()


@router.get("/conversation/{conversation_id}", response_model=MessagePage)
async def get_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_messages(db, conversation_id, page, size)
    return MessagePage(items=items, total=total)
