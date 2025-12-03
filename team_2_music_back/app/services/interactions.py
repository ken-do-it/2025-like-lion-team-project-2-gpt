"""Like and comment services."""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.track import Track
from app.models.vote import Like
from app.schemas import CommentCreate


class InteractionService:
    """Encapsulate like/comment interactions."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def toggle_like(self, track_id: int, user_id: int, like: bool) -> bool:
        track = self.db.get(Track, track_id)
        if not track:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRACK_NOT_FOUND")

        existing = (
            self.db.query(Like)
            .filter(Like.track_id == track_id, Like.user_id == user_id)
            .first()
        )
        if like:
            if not existing:
                like_row = Like(track_id=track_id, user_id=user_id)
                self.db.add(like_row)
                self.db.commit()
            return True
        if existing:
            self.db.delete(existing)
            self.db.commit()
        return False

    def count_likes(self, track_id: int) -> int:
        return self.db.query(func.count(Like.id)).filter(Like.track_id == track_id).scalar() or 0

    def add_comment(self, payload: CommentCreate, user_id: int) -> Comment:
        track = self.db.get(Track, payload.track_id)
        if not track:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRACK_NOT_FOUND")

        comment = Comment(
            track_id=payload.track_id,
            user_id=user_id,
            body=payload.body,
            created_at=datetime.utcnow(),
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def list_comments(self, track_id: int, limit: int = 50, offset: int = 0) -> list[Comment]:
        limit = min(max(limit, 1), 100)
        offset = max(offset, 0)
        return (
            self.db.query(Comment)
            .filter(Comment.track_id == track_id)
            .order_by(Comment.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
