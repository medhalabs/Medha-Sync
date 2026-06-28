from pydantic import BaseModel, EmailStr
from typing import Optional
from features.auth.models import UserRole


class TeamMemberInvite(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.agent


class TeamMemberUpdate(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
