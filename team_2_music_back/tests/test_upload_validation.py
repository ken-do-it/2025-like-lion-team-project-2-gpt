"""Tests for upload validation."""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from fastapi import HTTPException
from io import BytesIO

from app.core.storage import StorageService
from app.db.base import Base
from app.models.user_profile import UserProfile
from app.services.tracks import TrackService


def setup_inmemory_db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return TestingSessionLocal()


def seed_user(db: Session, user_id: int = 1) -> None:
    user = UserProfile(id=user_id, auth_user_id=str(user_id), display_name="tester")
    db.add(user)
    db.commit()


class DummyUploadFile:
    def __init__(self, filename: str, content: bytes, content_type: str) -> None:
        self.filename = filename
        self.file = BytesIO(content)
        self.content_type = content_type


def test_rejects_large_file():
    db = setup_inmemory_db()
    seed_user(db)
    service = TrackService(db=db, storage=StorageService(bucket="test-bucket"))

    # 51MB
    big_content = b"x" * (51 * 1024 * 1024)
    upload = DummyUploadFile(filename="big.mp3", content=big_content, content_type="audio/mpeg")
    try:
        service.upload_direct(file=upload, title="t", description=None, cover_url=None, owner_user_id=1)
        assert False, "Expected HTTPException for large file"
    except HTTPException as exc:
        assert exc.detail == "FILE_TOO_LARGE"


def test_rejects_unsupported_type():
    db = setup_inmemory_db()
    seed_user(db)
    service = TrackService(db=db, storage=StorageService(bucket="test-bucket"))

    upload = DummyUploadFile(filename="song.txt", content=b"hello", content_type="text/plain")
    try:
        service.upload_direct(file=upload, title="t", description=None, cover_url=None, owner_user_id=1)
        assert False, "Expected HTTPException for unsupported type"
    except HTTPException as exc:
        assert exc.detail == "UNSUPPORTED_MEDIA_TYPE"
