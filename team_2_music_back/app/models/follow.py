"""Follow model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class Follow(Base):
    """Follow relationship between users."""

    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="uq_follow"),)

    id = Column(Integer, primary_key=True)
    follower_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    follower = relationship("UserProfile", foreign_keys=[follower_id], backref="following")
    following = relationship("UserProfile", foreign_keys=[following_id], backref="followers")
