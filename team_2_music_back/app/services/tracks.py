"""Track-related service functions."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.track import Track
from app.models.upload_session import UploadSession
from app.schemas import UploadFinalizeRequest, UploadInitiateRequest
from app.core.storage import StorageService, PresignedUpload
from fastapi import HTTPException, status
from fastapi import UploadFile


class TrackService:
    """Encapsulate track and upload session operations."""

    def __init__(self, db: Session, storage: StorageService) -> None:
        self.db = db
        self.storage = storage

    def list_tracks(self, limit: int = 50) -> list[Track]:
        return self.db.query(Track).limit(limit).all()

    def get_track(self, track_id: int) -> Track:
        track = self.db.get(Track, track_id)
        if not track:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRACK_NOT_FOUND")
        return track

    def create_track(self, *, title: str, description: str | None, cover_url: str | None, owner_user_id: int) -> Track:
        track = Track(
            title=title,
            description=description,
            cover_url=cover_url,
            status="ready",
            owner_user_id=owner_user_id,
        )
        self.db.add(track)
        self.db.commit()
        self.db.refresh(track)
        return track

    def upload_direct(
        self,
        *,
        file: UploadFile,
        title: str,
        description: str | None,
        cover_url: str | None,
        owner_user_id: int,
    ) -> Track:
        upload_id = uuid4().hex
        storage_key = f"uploads/{owner_user_id}/{upload_id}/{file.filename}"
        file_bytes = file.file.read()
        self.storage.save_file(storage_key=storage_key, file_bytes=file_bytes)

        track = Track(
            title=title,
            description=description,
            cover_url=cover_url,
            status="ready",
            owner_user_id=owner_user_id,
            audio_url=storage_key,
        )
        self.db.add(track)
        self.db.commit()
        self.db.refresh(track)
        return track

    def initiate_upload(self, payload: UploadInitiateRequest, owner_user_id: int) -> PresignedUpload:
        upload_id = uuid4().hex
        storage_key = f"uploads/{owner_user_id}/{upload_id}/{payload.filename}"
        presigned = self.storage.presign_put(storage_key=storage_key)

        session = UploadSession(
            upload_id=upload_id,
            owner_user_id=owner_user_id,
            filename=payload.filename,
            content_type=payload.content_type,
            file_size=payload.file_size,
            storage_key=storage_key,
            status="initiated",
            expires_at=datetime.utcnow() + presigned.expires_in_as_timedelta(),
        )
        self.db.add(session)
        self.db.commit()
        return presigned

    def finalize_upload(self, payload: UploadFinalizeRequest, owner_user_id: int) -> Track:
        session = (
            self.db.query(UploadSession)
            .filter(
                UploadSession.upload_id == payload.upload_id,
                UploadSession.owner_user_id == owner_user_id,
            )
            .first()
        )
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="UPLOAD_NOT_FOUND")
        if session.status != "initiated":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="UPLOAD_INVALID_STATE")
        if session.expires_at and session.expires_at < datetime.utcnow():
            session.status = "expired"
            self.db.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="UPLOAD_EXPIRED")

        session.status = "completed"

        track = Track(
            title=payload.title,
            description=payload.description,
            cover_url=payload.cover_url,
            status="processing",
            owner_user_id=owner_user_id,
            audio_url=session.storage_key,
        )
        self.db.add(track)
        self.db.commit()
        self.db.refresh(track)
        return track

    def cleanup_expired_uploads(self, owner_user_id: int) -> None:
        now = datetime.utcnow()
        self.db.query(UploadSession).filter(
            UploadSession.owner_user_id == owner_user_id,
            UploadSession.status == "initiated",
            UploadSession.expires_at < now,
        ).delete(synchronize_session=False)
        self.db.commit()
