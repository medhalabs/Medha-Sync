from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CatalogItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    brochure_url: Optional[str] = None
    image_url: Optional[str] = None
    menu_label: str
    parent_id: Optional[str] = None
    position: int = 0


class CatalogItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    brochure_url: Optional[str] = None
    image_url: Optional[str] = None
    menu_label: Optional[str] = None
    parent_id: Optional[str] = None
    position: Optional[int] = None
    is_active: Optional[bool] = None


class CatalogItemOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    brochure_url: Optional[str]
    image_url: Optional[str]
    menu_label: str
    parent_id: Optional[str]
    position: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
