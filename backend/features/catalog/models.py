import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    brochure_url: Mapped[str | None] = mapped_column(String, nullable=True)
    link_url: Mapped[str | None] = mapped_column(String, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    menu_label: Mapped[str] = mapped_column(String)
    parent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    position: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
