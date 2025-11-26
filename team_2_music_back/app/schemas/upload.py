"""Upload session schemas."""

from pydantic import BaseModel, Field


class UploadInitiateRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=100)
    file_size: int = Field(gt=0)


class UploadInitiateResponse(BaseModel):
    upload_id: str
    presigned_url: str
    expires_in: int
    storage_key: str


class UploadFinalizeRequest(BaseModel):
    upload_id: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    cover_url: str | None = Field(default=None, max_length=255)
