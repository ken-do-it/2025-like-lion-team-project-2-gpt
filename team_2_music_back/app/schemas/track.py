"""Track schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class TrackBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    cover_url: str | None = Field(default=None, max_length=255)


class TrackCreate(TrackBase):
    pass


class TrackRead(TrackBase):
    id: int
    owner_user_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
