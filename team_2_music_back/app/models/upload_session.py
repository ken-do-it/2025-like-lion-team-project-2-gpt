"""Upload session model for presigned uploads."""

from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


def default_expires_at() -> datetime:
    return datetime.utcnow() + timedelta(minutes=15)


class UploadSession(Base):
    """Represents an in-flight upload before a Track is finalized."""

    __tablename__ = "upload_sessions"
    __table_args__ = (UniqueConstraint("upload_id", name="uq_upload_session_upload_id"),)

    id = Column(Integer, primary_key=True)
    upload_id = Column(String(64), default=lambda: uuid4().hex, nullable=False)
    owner_user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    storage_key = Column(String(255), nullable=False)
    status = Column(String(32), default="initiated", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, default=default_expires_at, nullable=False)

    owner = relationship("UserProfile", backref="upload_sessions")
