from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class AutomationStep(BaseModel):
    type: str
    config: Dict[str, Any] = {}


class AutomationCreate(BaseModel):
    name: str
    trigger_type: str
    trigger_config: Dict[str, Any] = {}
    steps: List[Dict[str, Any]] = []


class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    trigger_config: Optional[Dict[str, Any]] = None
    steps: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None


class AutomationOut(BaseModel):
    id: str
    name: str
    trigger_type: str
    trigger_config: Dict[str, Any]
    steps: List[Dict[str, Any]]
    is_active: bool
    last_run_at: Optional[datetime]
    run_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
