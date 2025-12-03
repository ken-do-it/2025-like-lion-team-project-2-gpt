"""Like schemas."""

from pydantic import BaseModel


class LikeActionResponse(BaseModel):
    track_id: int
    liked: bool
