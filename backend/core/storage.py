from minio import Minio
from minio.error import S3Error
from core.config import settings
import uuid
import io

client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ROOT_USER,
    secret_key=settings.MINIO_ROOT_PASSWORD,
    secure=settings.MINIO_SECURE,
)


def ensure_bucket():
    if not client.bucket_exists(settings.MINIO_BUCKET):
        client.make_bucket(settings.MINIO_BUCKET)


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


def get_presigned_url(object_path: str) -> str:
    object_name = object_path.lstrip(f"/{settings.MINIO_BUCKET}/")
    return client.presigned_get_object(settings.MINIO_BUCKET, object_name)
