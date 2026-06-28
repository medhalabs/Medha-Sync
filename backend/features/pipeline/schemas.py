from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class StageCreate(BaseModel):
    name: str
    position: int = 0
    color: str = "#6366f1"


class StageOut(BaseModel):
    id: str
    name: str
    position: int
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DealCreate(BaseModel):
    contact_id: str
    stage_id: str
    title: str
    value: Optional[float] = None
    notes: Optional[str] = None


class DealUpdate(BaseModel):
    stage_id: Optional[str] = None
    title: Optional[str] = None
    value: Optional[float] = None
    notes: Optional[str] = None


class DealOut(BaseModel):
    id: str
    contact_id: str
    stage_id: str
    title: str
    value: Optional[float]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
