"""Like model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class Like(Base):
    """Track like relationship."""

    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("track_id", "user_id", name="uq_track_like_user"),)

    id = Column(Integer, primary_key=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    track = relationship("Track", back_populates="likes")
    user = relationship("UserProfile", backref="likes")
