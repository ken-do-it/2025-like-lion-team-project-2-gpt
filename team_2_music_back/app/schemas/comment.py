"""Comment schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    # track_id는 경로 파라미터에서 설정되므로 요청 본문에서는 선택값으로 둔다.
    track_id: int | None = None
    body: str = Field(min_length=1, max_length=500)


class CommentRead(BaseModel):
    id: int
    track_id: int
    user_id: int
    body: str
    created_at: datetime

    class Config:
        from_attributes = True
