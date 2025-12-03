"""Track schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class TrackBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    cover_url: str | None = Field(default=None, max_length=255)
    genre: str | None = Field(default=None, max_length=100)
    tags: str | None = Field(default=None, max_length=200)
    ai_provider: str | None = Field(default=None, max_length=50)
    ai_model: str | None = Field(default=None, max_length=100)
    duration_seconds: int | None = Field(default=None, ge=0)


class TrackCreate(TrackBase):
    pass


class TrackUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    cover_url: str | None = Field(default=None, max_length=255)
    genre: str | None = Field(default=None, max_length=100)
    tags: str | None = Field(default=None, max_length=200)
    ai_provider: str | None = Field(default=None, max_length=50)
    ai_model: str | None = Field(default=None, max_length=100)
    duration_seconds: int | None = Field(default=None, ge=0)


class TrackRead(TrackBase):
    id: int
    owner_user_id: int
    status: str
    audio_url: str | None = None
    genre: str | None = None
    tags: str | None = None
    ai_provider: str | None = None
    ai_model: str | None = None
    duration_seconds: int | None = None
    likes_count: int = 0
    plays_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
