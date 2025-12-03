"""Comment model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from .base import Base


class Comment(Base):
    """User comment on a track."""

    __tablename__ = "comments"

    id = Column(Integer, primary_key=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    track = relationship("Track", back_populates="comments")
    user = relationship("UserProfile", backref="comments")
