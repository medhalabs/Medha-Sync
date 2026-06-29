from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, UploadFile
from features.documents.models import Document
from features.documents.schemas import DocumentUpdate
from core.storage import (
    upload_file,
    delete_object,
    MAX_UPLOAD_BYTES,
    ALLOWED_CONTENT_TYPES,
)


async def list_documents(
    db: AsyncSession,
    kind: str | None = None,
) -> list[Document]:
    query = select(Document).order_by(Document.created_at.desc())
    result = await db.execute(query)
    docs = result.scalars().all()
    if kind == "pdf":
        return [d for d in docs if d.content_type == "application/pdf"]
    if kind == "image":
        return [d for d in docs if d.content_type.startswith("image/")]
    return docs


async def get_document(db: AsyncSession, document_id: str) -> Document:
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


async def create_document(
    db: AsyncSession,
    user_id: str,
    file: UploadFile,
    name: str | None = None,
) -> Document:
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            400,
            "File type not allowed. Use PDF or image (JPEG, PNG, WebP, GIF).",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            400,
            f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    filename = file.filename or "upload"
    stored_path = upload_file(content, filename, content_type)
    display_name = (name or filename).strip() or filename

    doc = Document(
        name=display_name,
        filename=filename,
        stored_path=stored_path,
        content_type=content_type,
        file_size=len(content),
        uploaded_by=user_id,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc


async def update_document(db: AsyncSession, document_id: str, data: DocumentUpdate) -> Document:
    doc = await get_document(db, document_id)
    if data.name is not None:
        doc.name = data.name.strip() or doc.filename
    await db.flush()
    await db.refresh(doc)
    return doc


async def delete_document(db: AsyncSession, document_id: str) -> None:
    doc = await get_document(db, document_id)
    try:
        delete_object(doc.stored_path)
    except Exception:
        pass
    await db.delete(doc)
