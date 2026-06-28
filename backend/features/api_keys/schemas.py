from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class ApiKeyCreate(BaseModel):
    name: str
    scopes: List[str] = ["read", "write"]


class ApiKeyOut(BaseModel):
    id: str
    name: str
    scopes: List[str]
    is_active: bool
    last_used_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreated(ApiKeyOut):
    raw_key: str
