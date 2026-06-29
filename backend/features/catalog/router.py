from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user_id
from features.catalog.schemas import CatalogItemCreate, CatalogItemUpdate, CatalogItemOut
from features.catalog.service import list_catalog_items, create_catalog_item, update_catalog_item, delete_catalog_item
from core.storage import upload_file, file_public_url, MAX_UPLOAD_BYTES, ALLOWED_CONTENT_TYPES
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
    content_type = file.content_type or "application/octet-stream"
    if content_type != "application/pdf":
        raise HTTPException(400, "Brochure must be a PDF file.")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

    stored_path = upload_file(content, file.filename or "brochure.pdf", content_type)
    await update_catalog_item(db, item_id, CatalogItemUpdate(brochure_url=stored_path))
    return {"path": stored_path, "url": file_public_url(stored_path)}


@router.post("/{item_id}/upload-image")
async def upload_image(
    item_id: str,
    file: UploadFile = File(...),
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    content_type = file.content_type or "application/octet-stream"
    if not content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (JPEG, PNG, WebP, or GIF).")
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, "Image type not allowed. Use JPEG, PNG, WebP, or GIF.")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

    stored_path = upload_file(content, file.filename or "image.jpg", content_type)
    await update_catalog_item(db, item_id, CatalogItemUpdate(image_url=stored_path))
    return {"path": stored_path, "url": file_public_url(stored_path)}
