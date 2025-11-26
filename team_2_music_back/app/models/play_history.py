"""Play history model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from .base import Base


class PlayHistory(Base):
    """Records when a user plays a track."""

    __tablename__ = "play_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False, index=True)
    played_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("UserProfile", backref="play_history")
    track = relationship("Track", backref="play_events")
