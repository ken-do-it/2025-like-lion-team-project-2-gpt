"""Unit tests for TrackService."""

from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.storage import StorageService
from app.db.base import Base
from app.models.user_profile import UserProfile
from app.schemas import UploadFinalizeRequest, UploadInitiateRequest
from app.services.tracks import TrackService


def setup_inmemory_db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return TestingSessionLocal()


def seed_user(db: Session, user_id: int = 1) -> None:
    user = UserProfile(id=user_id, auth_user_id=str(user_id), display_name="tester", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    db.add(user)
    db.commit()


def test_initiate_and_finalize_upload_creates_track():
    db = setup_inmemory_db()
    seed_user(db)
    service = TrackService(db=db, storage=StorageService(bucket="test-bucket"))

    presigned = service.initiate_upload(
        UploadInitiateRequest(filename="song.mp3", content_type="audio/mpeg", file_size=12345),
        owner_user_id=1,
    )
    assert presigned.storage_key.startswith("uploads/1/")

    upload_id = presigned.storage_key.split("/")[-2]
    track = service.finalize_upload(
        UploadFinalizeRequest(upload_id=upload_id, title="Hello", description=None, cover_url=None),
        owner_user_id=1,
    )

    assert track.title == "Hello"
    assert track.audio_url == presigned.storage_key
