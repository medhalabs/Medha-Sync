from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.conversations.schemas import ConversationOut, ConversationUpdate, ConversationPage
from features.conversations.service import list_conversations, update_conversation
from typing import Optional

router = APIRouter()


@router.get("", response_model=ConversationPage)
async def list_conversations_route(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    channel: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items, total = await list_conversations(db, page, size, channel, status, assigned_to)
    return ConversationPage(items=items, total=total, page=page, size=size)


@router.patch("/{conv_id}", response_model=ConversationOut)
async def update_conversation_route(conv_id: str, data: ConversationUpdate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await update_conversation(db, conv_id, data)
