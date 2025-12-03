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
        self.max_file_size = 50 * 1024 * 1024  # 50MB for local dev
        self.allowed_content_types = {"audio/mpeg", "audio/mp3", "audio/wav", "audio/flac"}

    def list_tracks(self, limit: int = 50, offset: int = 0) -> list[Track]:
        limit = min(max(limit, 1), 100)
        offset = max(offset, 0)
        tracks = self.db.query(Track).offset(offset).limit(limit).all()
        # attach counts
        for t in tracks:
            t.likes_count = len(t.likes) if hasattr(t, "likes") else 0
            t.plays_count = 0  # not tracked yet
        return tracks

    def get_track(self, track_id: int) -> Track:
        track = self.db.get(Track, track_id)
        if not track:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRACK_NOT_FOUND")
        track.likes_count = len(track.likes) if hasattr(track, "likes") else 0
        track.plays_count = 0
        return track

    def create_track(
        self,
        *,
        title: str,
        description: str | None,
        cover_url: str | None,
        genre: str | None,
        tags: str | None,
        ai_provider: str | None,
        ai_model: str | None,
        owner_user_id: int,
    ) -> Track:
        track = Track(
            title=title,
            description=description,
            cover_url=cover_url,
            status="ready",
            genre=genre,
            tags=tags,
            ai_provider=ai_provider,
            ai_model=ai_model,
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
        genre: str | None = None,
        tags: str | None = None,
        ai_provider: str | None = None,
        ai_model: str | None = None,
        owner_user_id: int,
    ) -> Track:
        upload_id = uuid4().hex
        storage_key = f"uploads/{owner_user_id}/{upload_id}/{file.filename}"
        file_bytes = file.file.read()

        if len(file_bytes) > self.max_file_size:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="FILE_TOO_LARGE")
        if file.content_type and file.content_type not in self.allowed_content_types:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="UNSUPPORTED_MEDIA_TYPE")

        self.storage.save_file(storage_key=storage_key, file_bytes=file_bytes)

        track = Track(
            title=title,
            description=description,
            cover_url=cover_url,
            status="ready",
            genre=genre,
            tags=tags,
            ai_provider=ai_provider,
            ai_model=ai_model,
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

    def update_track(
        self,
        track_id: int,
        owner_user_id: int,
        *,
        title: str | None,
        description: str | None,
        cover_url: str | None,
        genre: str | None,
        tags: str | None,
        ai_provider: str | None,
        ai_model: str | None,
    ) -> Track:
        track = self.get_track(track_id)
        if track.owner_user_id != owner_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="FORBIDDEN")

        if title is not None:
            track.title = title
        if description is not None:
            track.description = description
        if cover_url is not None:
            track.cover_url = cover_url
        if genre is not None:
            track.genre = genre
        if tags is not None:
            track.tags = tags
        if ai_provider is not None:
            track.ai_provider = ai_provider
        if ai_model is not None:
            track.ai_model = ai_model

        self.db.commit()
        self.db.refresh(track)
        return track

    def delete_track(self, track_id: int, owner_user_id: int) -> None:
        track = self.get_track(track_id)
        if track.owner_user_id != owner_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="FORBIDDEN")

        # Delete local file if exists
        if track.audio_url:
            from pathlib import Path

            file_path = self.storage.base_path / track.audio_url
            try:
                if file_path.exists():
                    file_path.unlink()
            except Exception:
                pass

        self.db.delete(track)
        self.db.commit()

    def replace_audio(self, track_id: int, owner_user_id: int, file: UploadFile) -> Track:
        track = self.get_track(track_id)
        if track.owner_user_id != owner_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="FORBIDDEN")

        file_bytes = file.file.read()
        if len(file_bytes) > self.max_file_size:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="FILE_TOO_LARGE")
        if file.content_type and file.content_type not in self.allowed_content_types:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="UNSUPPORTED_MEDIA_TYPE")

        upload_id = uuid4().hex
        storage_key = f"uploads/{owner_user_id}/{upload_id}/{file.filename}"
        self.storage.save_file(storage_key=storage_key, file_bytes=file_bytes)

        if track.audio_url:
            from pathlib import Path

            old_path = self.storage.base_path / track.audio_url
            try:
                if old_path.exists():
                    old_path.unlink()
            except Exception:
                pass

        track.audio_url = storage_key
        track.status = "ready"
        self.db.commit()
        self.db.refresh(track)
        return track
