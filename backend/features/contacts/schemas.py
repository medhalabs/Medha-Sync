from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any


class ContactCreate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    pipeline_stage_id: Optional[str] = None
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    source: str = "manual"
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    pipeline_stage_id: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    opted_out: Optional[bool] = None
    notes: Optional[str] = None


class ContactOut(BaseModel):
    id: str
    name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    avatar_url: Optional[str]
    pipeline_stage_id: Optional[str]
    tags: List[str]
    custom_fields: Dict[str, Any]
    source: str
    opted_out: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContactPage(BaseModel):
    items: List[ContactOut]
    total: int
    page: int
    size: int
