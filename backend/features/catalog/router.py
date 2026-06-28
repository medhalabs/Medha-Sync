from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.catalog.schemas import CatalogItemCreate, CatalogItemUpdate, CatalogItemOut
from features.catalog.service import list_catalog_items, create_catalog_item, update_catalog_item, delete_catalog_item
from core.storage import upload_file
from typing import List, Optional

router = APIRouter()


@router.get("", response_model=List[CatalogItemOut])
async def list_items(parent_id: Optional[str] = None, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await list_catalog_items(db, parent_id)


@router.post("", response_model=CatalogItemOut, status_code=201)
async def create_item(data: CatalogItemCreate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await create_catalog_item(db, data)


@router.patch("/{item_id}", response_model=CatalogItemOut)
async def update_item(item_id: str, data: CatalogItemUpdate, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await update_catalog_item(db, item_id, data)


@router.delete("/{item_id}", status_code=204)
async def delete_item(item_id: str, _: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await delete_catalog_item(db, item_id)


@router.post("/{item_id}/upload-brochure")
async def upload_brochure(
    item_id: str,
    file: UploadFile = File(...),
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    url = upload_file(content, file.filename, file.content_type or "application/pdf")
    from features.catalog.schemas import CatalogItemUpdate
    await update_catalog_item(db, item_id, CatalogItemUpdate(brochure_url=url))
    return {"url": url}
