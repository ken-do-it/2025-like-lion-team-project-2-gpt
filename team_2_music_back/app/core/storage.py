"""Storage signing utilities (stub)."""

from dataclasses import dataclass
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, NoCredentialsError

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
    """Storage service supporting local filesystem (dev) and S3 (prod)."""

    def __init__(self, bucket: str | None = None, base_path: str | None = None) -> None:
        self.bucket = bucket or settings.s3_bucket
        self.base_path = Path(base_path or settings.local_storage_path)
        self.aws_region = settings.aws_region
        self.is_s3_enabled = bool(self.bucket and settings.aws_region)

        self.s3_client = None
        if self.is_s3_enabled:
            # boto3 will pick up IAM Role if access keys are not provided
            self.s3_client = boto3.client(
                "s3",
                region_name=self.aws_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
            )

    def presign_put(self, storage_key: str, expires_in: int | None = None) -> PresignedUpload:
        ttl = expires_in or settings.presign_expiration
        if self.is_s3_enabled and self.s3_client:
            url = self.s3_client.generate_presigned_url(
                "put_object",
                Params={"Bucket": self.bucket, "Key": storage_key},
                ExpiresIn=ttl,
            )
            return PresignedUpload(url=url, expires_in=ttl, storage_key=storage_key)
        # local fallback
        url = f"/uploads/{storage_key}"
        return PresignedUpload(url=url, expires_in=ttl, storage_key=storage_key)

    def save_file(self, storage_key: str, file_bytes: bytes) -> str:
        """Save file to S3 if enabled, otherwise local storage."""

        if self.is_s3_enabled and self.s3_client:
            try:
                self.s3_client.put_object(Bucket=self.bucket, Key=storage_key, Body=file_bytes)
                return storage_key
            except (BotoCoreError, NoCredentialsError) as exc:
                raise RuntimeError("S3_UPLOAD_FAILED") from exc

        # local
        target_path = self.base_path / storage_key
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_bytes(file_bytes)
        return str(target_path)

    def presign_get(self, storage_key: str, expires_in: int | None = None) -> str:
        ttl = expires_in or settings.presign_expiration
        if self.is_s3_enabled and self.s3_client:
            return self.s3_client.generate_presigned_url(
                "get_object", Params={"Bucket": self.bucket, "Key": storage_key}, ExpiresIn=ttl
            )
        # local fallback (not used for remote clients)
        return str(self.base_path / storage_key)
