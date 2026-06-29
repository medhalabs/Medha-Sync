from pydantic import BaseModel, computed_field
from datetime import datetime
from typing import Optional, Literal
from core.storage import file_public_url, is_image_type, is_pdf_type


class DocumentOut(BaseModel):
    id: str
    name: str
    filename: str
    stored_path: str
    content_type: str
    file_size: int
    uploaded_by: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def url(self) -> str:
        return file_public_url(self.stored_path)

    @computed_field
    @property
    def kind(self) -> Literal["pdf", "image"]:
        return "image" if is_image_type(self.content_type) else "pdf"


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
