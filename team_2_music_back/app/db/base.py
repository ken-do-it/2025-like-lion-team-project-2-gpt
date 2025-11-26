"""Import all ORM models for Alembic autogeneration."""

from app.models.base import Base  # noqa: F401
from app.models.comment import Comment  # noqa: F401
from app.models.follow import Follow  # noqa: F401
from app.models.play_history import PlayHistory  # noqa: F401
from app.models.playlist import Playlist, PlaylistTrack  # noqa: F401
from app.models.tag import Tag, TrackTag  # noqa: F401
from app.models.track import Track  # noqa: F401
from app.models.user_profile import UserProfile  # noqa: F401
from app.models.vote import Like  # noqa: F401
from app.models.upload_session import UploadSession  # noqa: F401
