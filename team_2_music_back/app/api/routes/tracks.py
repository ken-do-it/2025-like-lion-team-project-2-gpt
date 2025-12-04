"""Track API stubs."""

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db
from app.core.config import settings
from app.core.storage import StorageService
from app.models.track import Track
from app.schemas import (
    ErrorResponse,
    TrackCreate,
    TrackRead,
    TrackUpdate,
    UploadFinalizeRequest,
    UploadInitiateRequest,
    UploadInitiateResponse,
)
from app.services.tracks import TrackService

router = APIRouter(prefix="/tracks", tags=["tracks"])


def _service(db: Session, storage: StorageService | None = None) -> TrackService:
    return TrackService(db=db, storage=storage or StorageService())


@router.get(
    "",
    response_model=list[TrackRead],
    summary="List tracks",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def list_tracks(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[Track]:
    """Return a simple list of tracks."""

    return _service(db).list_tracks(limit=limit, offset=offset)


@router.post(
    "",
    response_model=TrackRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create track",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def create_track(
    payload: TrackCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Track:
    """Create a track."""

    return _service(db).create_track(
        title=payload.title,
        description=payload.description,
        cover_url=payload.cover_url,
        genre=getattr(payload, "genre", None),
        tags=getattr(payload, "tags", None),
        ai_provider=getattr(payload, "ai_provider", None),
        ai_model=getattr(payload, "ai_model", None),
        owner_user_id=current_user.user_id,
    )


@router.get(
    "/{track_id}",
    response_model=TrackRead,
    summary="Get track detail",
    responses={404: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def get_track(track_id: int, db: Session = Depends(get_db)) -> Track:
    """Fetch a single track by ID."""

    return _service(db).get_track(track_id)


@router.patch(
    "/{track_id}",
    response_model=TrackRead,
    summary="Update track (owner only)",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def update_track(
    track_id: int,
    payload: TrackUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Track:
    return _service(db).update_track(
        track_id=track_id,
        owner_user_id=current_user.user_id,
        title=payload.title,
        description=payload.description,
        cover_url=payload.cover_url,
        genre=payload.genre,
        tags=payload.tags,
        ai_provider=getattr(payload, "ai_provider", None),
        ai_model=getattr(payload, "ai_model", None),
    )


@router.delete(
    "/{track_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete track (owner only)",
    responses={401: {"model": ErrorResponse}, 403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def delete_track(
    track_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    _service(db).delete_track(track_id=track_id, owner_user_id=current_user.user_id)


@router.post(
    "/{track_id}/upload/replace",
    response_model=TrackRead,
    status_code=status.HTTP_200_OK,
    summary="Replace audio file for a track (owner only)",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def replace_audio(
    track_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Track:
    """Replace the audio file of a track (local storage)."""

    return _service(db).replace_audio(track_id=track_id, owner_user_id=current_user.user_id, file=file)


@router.post(
    "/upload/initiate",
    response_model=UploadInitiateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate a presigned upload (stub)",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def initiate_upload(
    payload: UploadInitiateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    storage: StorageService = Depends(StorageService),
) -> UploadInitiateResponse:
    """Create an upload session and return a presigned URL (stub)."""

    presigned = _service(db, storage).initiate_upload(payload, owner_user_id=current_user.user_id)
    upload_id = presigned.storage_key.split("/")[-2] if "/" in presigned.storage_key else presigned.storage_key

    return UploadInitiateResponse(
        upload_id=upload_id,
        presigned_url=presigned.url,
        expires_in=presigned.expires_in,
        storage_key=presigned.storage_key,
    )


@router.post(
    "/upload/finalize",
    response_model=TrackRead,
    status_code=status.HTTP_201_CREATED,
    summary="Finalize upload and create track",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
def finalize_upload(
    payload: UploadFinalizeRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Track:
    """Finalize a previously initiated upload and create a Track."""

    return _service(db).finalize_upload(payload, owner_user_id=current_user.user_id)


@router.get(
    "/{track_id}/stream",
    summary="Stream a track from local storage (dev)",
    responses={404: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def stream_track(track_id: int, db: Session = Depends(get_db)) -> FileResponse:
    """Stream track audio. If S3 사용 중이면 presigned URL로 리디렉션."""

    track = _service(db).get_track(track_id)
    if not track.audio_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AUDIO_NOT_FOUND")

    # S3 사용 시 presigned GET으로 리디렉션
    storage = StorageService()
    if storage.is_s3_enabled:
        presigned_url = storage.presign_get(track.audio_url)
        return RedirectResponse(url=presigned_url, status_code=status.HTTP_302_FOUND)

    file_path = Path(settings.local_storage_path) / track.audio_url
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AUDIO_NOT_FOUND")

    return FileResponse(path=file_path, media_type="audio/mpeg", filename=file_path.name)


@router.get(
    "/{track_id}/cover",
    summary="Fetch cover image for a track",
    responses={404: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def get_cover(track_id: int, db: Session = Depends(get_db)):
    """Return cover image file or presigned URL redirect."""

    track = _service(db).get_track(track_id)
    if not track.cover_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="COVER_NOT_FOUND")

    storage = StorageService()
    if storage.is_s3_enabled:
        presigned_url = storage.presign_get(track.cover_url)
        return RedirectResponse(url=presigned_url, status_code=status.HTTP_302_FOUND)

    file_path = Path(settings.local_storage_path) / track.cover_url
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="COVER_NOT_FOUND")

    media_type = "image/jpeg"
    suffix = file_path.suffix.lower()
    if suffix == ".png":
        media_type = "image/png"
    elif suffix == ".webp":
        media_type = "image/webp"

    return FileResponse(path=file_path, media_type=media_type, filename=file_path.name)


@router.post(
    "/upload/cleanup",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clean up expired upload sessions for current user",
    responses={401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
def cleanup_expired_uploads(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    """Remove expired upload sessions for the caller."""

    _service(db).cleanup_expired_uploads(owner_user_id=current_user.user_id)


@router.post(
    "/upload/direct",
    response_model=TrackRead,
    status_code=status.HTTP_201_CREATED,
    summary="Direct upload (local storage) and create track",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def direct_upload(
    file: UploadFile = File(...),
    cover_file: UploadFile | None = File(None),
    title: str = Form(...),
    description: str | None = Form(None),
    genre: str | None = Form(None),
    tags: str | None = Form(None),
    ai_provider: str | None = Form(None),
    ai_model: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Track:
    """Directly upload a file to local storage and create a Track."""

    return _service(db).upload_direct(
        file=file,
        cover_file=cover_file,
        title=title,
        description=description,
        genre=genre,
        tags=tags,
        ai_provider=ai_provider,
        ai_model=ai_model,
        owner_user_id=current_user.user_id,
    )
