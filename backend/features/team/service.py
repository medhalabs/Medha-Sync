from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from features.auth.models import User
from features.auth.schemas import UserCreate
from features.auth.service import register_user
from features.team.schemas import TeamMemberInvite, TeamMemberUpdate
import secrets


async def invite_member(db: AsyncSession, data: TeamMemberInvite) -> User:
    temp_password = secrets.token_urlsafe(12)
    user_data = UserCreate(email=data.email, name=data.name, password=temp_password, role=data.role)
    return await register_user(db, user_data)


async def list_members(db: AsyncSession) -> list[User]:
    result = await db.execute(select(User).order_by(User.created_at))
    return result.scalars().all()


async def update_member(db: AsyncSession, user_id: str, data: TeamMemberUpdate) -> User:
    from fastapi import HTTPException
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    await db.flush()
    await db.refresh(user)
    return user
