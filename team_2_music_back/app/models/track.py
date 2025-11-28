"""Track model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base


class Track(Base):
    """Music track uploaded by a user."""

    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(32), default="ready", nullable=False)
    genre = Column(String(100), nullable=True)
    tags = Column(String(200), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    bpm = Column(Integer, nullable=True)
    audio_url = Column(String(255), nullable=True)
    cover_url = Column(String(255), nullable=True)
    ai_provider = Column(String(50), nullable=True)
    ai_model = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("UserProfile", backref="tracks")
    tag_links = relationship("TrackTag", back_populates="track", cascade="all, delete-orphan")
    playlist_links = relationship("PlaylistTrack", back_populates="track", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="track", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="track", cascade="all, delete-orphan")
