"""Tag model."""

from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class Tag(Base):
    """Tag taxonomy."""

    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True, index=True)

    track_links = relationship("TrackTag", back_populates="tag", cascade="all, delete-orphan")


class TrackTag(Base):
    """Many-to-many association between tracks and tags."""

    __tablename__ = "track_tags"
    __table_args__ = (UniqueConstraint("track_id", "tag_id", name="uq_track_tag"),)

    id = Column(Integer, primary_key=True)
    track_id = Column(Integer, ForeignKey("tracks.id"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)

    track = relationship("Track", back_populates="tag_links")
    tag = relationship("Tag", back_populates="track_links")
