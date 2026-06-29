from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from core.database import get_db
from core.security import get_current_user_id
from features.documents.schemas import DocumentOut, DocumentUpdate
from features.documents.service import (
    list_documents,
    create_document,
    update_document,
    delete_document,
)

router = APIRouter()


@router.get("", response_model=List[DocumentOut])
async def get_documents(
    kind: Optional[str] = None,
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await list_documents(db, kind=kind)


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await create_document(db, user_id, file, name=name)


@router.patch("/{document_id}", response_model=DocumentOut)
async def rename_document(
    document_id: str,
    data: DocumentUpdate,
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await update_document(db, document_id, data)


@router.delete("/{document_id}", status_code=204)
async def remove_document(
    document_id: str,
    _: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await delete_document(db, document_id)
