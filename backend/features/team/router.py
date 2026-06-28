from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.team.schemas import TeamMemberInvite, TeamMemberUpdate
from features.team.service import invite_member, list_members, update_member
from features.auth.schemas import UserOut
from typing import List

router = APIRouter()


@router.get("", response_model=List[UserOut])
async def list_team(_: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await list_members(db)


@router.post("/invite", response_model=UserOut, status_code=201)
async def invite(data: TeamMemberInvite, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await invite_member(db, data)


@router.patch("/{user_id}", response_model=UserOut)
async def update_member_route(user_id: str, data: TeamMemberUpdate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await update_member(db, user_id, data)
