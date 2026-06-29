from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from core.security import get_current_user_id
from core.storage import (
    upload_file,
    get_object,
    file_public_url,
    MAX_UPLOAD_BYTES,
    ALLOWED_CONTENT_TYPES,
)
from core.config import settings

router = APIRouter()


class FileUploadOut(BaseModel):
    path: str
    url: str
    filename: str
    content_type: str


@router.post("/upload", response_model=FileUploadOut)
async def upload_catalog_file(
    file: UploadFile = File(...),
    _: str = Depends(get_current_user_id),
):
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            400,
            "File type not allowed. Use PDF or image (JPEG, PNG, WebP, GIF).",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

    filename = file.filename or "upload"
    stored_path = upload_file(content, filename, content_type)

    return FileUploadOut(
        path=stored_path,
        url=file_public_url(stored_path),
        filename=filename,
        content_type=content_type,
    )


@router.get("/{object_path:path}")
async def serve_file(object_path: str):
    """Public file access — used by WhatsApp (Baileys) and shareable links."""
    bucket_prefix = f"{settings.MINIO_BUCKET}/"
    if not object_path.startswith(bucket_prefix):
        raise HTTPException(404, "File not found")

    stored_path = f"/{object_path}"
    try:
        data, content_type = get_object(stored_path)
    except Exception:
        raise HTTPException(404, "File not found")

    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
