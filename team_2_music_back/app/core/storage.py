"""Storage signing utilities (stub)."""

from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings


@dataclass
class PresignedUpload:
    url: str
    expires_in: int
    storage_key: str

    def expires_in_as_timedelta(self):
        from datetime import timedelta

        return timedelta(seconds=self.expires_in)


class StorageService:
    """Stub storage service. Replace with real S3 presign logic later."""

    def __init__(self, bucket: str | None = None, base_path: str | None = None) -> None:
        self.bucket = bucket or settings.s3_bucket
        self.base_path = Path(base_path or settings.local_storage_path)

    def presign_put(self, storage_key: str, expires_in: int | None = None) -> PresignedUpload:
        ttl = expires_in or settings.presign_expiration
        # TODO: Replace with boto3 generate_presigned_url
        url = f"https://{self.bucket}.example.com/{storage_key}"
        return PresignedUpload(url=url, expires_in=ttl, storage_key=storage_key)

    def save_file(self, storage_key: str, file_bytes: bytes) -> str:
        """Save file to local storage path."""

        target_path = self.base_path / storage_key
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_bytes(file_bytes)
        return str(target_path)
