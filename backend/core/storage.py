from minio import Minio
from core.config import settings
import uuid
import io

client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ROOT_USER,
    secret_key=settings.MINIO_ROOT_PASSWORD,
    secure=settings.MINIO_SECURE,
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}


def ensure_bucket():
    if not client.bucket_exists(settings.MINIO_BUCKET):
        client.make_bucket(settings.MINIO_BUCKET)


def _object_name_from_path(stored_path: str) -> str:
    prefix = f"/{settings.MINIO_BUCKET}/"
    if stored_path.startswith(prefix):
        return stored_path[len(prefix):]
    if stored_path.startswith(f"{settings.MINIO_BUCKET}/"):
        return stored_path[len(f"{settings.MINIO_BUCKET}/"):]
    return stored_path.lstrip("/")


def is_stored_path(value: str) -> bool:
    if not value:
        return False
    if value.startswith("http://") or value.startswith("https://"):
        return False
    return value.startswith(f"/{settings.MINIO_BUCKET}/") or value.startswith(f"{settings.MINIO_BUCKET}/")


def upload_file(data: bytes, filename: str, content_type: str) -> str:
    ensure_bucket()
    object_name = f"{uuid.uuid4()}/{filename}"
    client.put_object(
        settings.MINIO_BUCKET,
        object_name,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return f"/{settings.MINIO_BUCKET}/{object_name}"


def get_object(stored_path: str) -> tuple[bytes, str]:
    object_name = _object_name_from_path(stored_path)
    response = client.get_object(settings.MINIO_BUCKET, object_name)
    try:
        data = response.read()
        content_type = response.headers.get("Content-Type", "application/octet-stream")
        return data, content_type
    finally:
        response.close()
        response.release_conn()


def file_public_url(stored_path: str) -> str:
    """URL for browsers and copy-link in the dashboard."""
    if not stored_path:
        return ""
    if stored_path.startswith("http://") or stored_path.startswith("https://"):
        return stored_path
    clean = stored_path.lstrip("/")
    return f"{settings.PUBLIC_API_URL.rstrip('/')}/api/files/{clean}"


def file_fetch_url(stored_path: str) -> str:
    """URL for internal services (Baileys) to download and send via WhatsApp."""
    if not stored_path:
        return ""
    if stored_path.startswith("http://") or stored_path.startswith("https://"):
        return stored_path
    clean = stored_path.lstrip("/")
    return f"{settings.BACKEND_URL.rstrip('/')}/api/files/{clean}"


def delete_object(stored_path: str) -> None:
    object_name = _object_name_from_path(stored_path)
    client.remove_object(settings.MINIO_BUCKET, object_name)


def is_image_type(content_type: str) -> bool:
    return content_type.startswith("image/")


def is_pdf_type(content_type: str) -> bool:
    return content_type == "application/pdf"
