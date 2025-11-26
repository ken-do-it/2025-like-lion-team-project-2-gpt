"""User profile model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from .base import Base


class UserProfile(Base):
    """Represents a user profile sourced from an external auth server."""

    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(String(64), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    bio = Column(String(500), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Integer, default=1, nullable=False)
