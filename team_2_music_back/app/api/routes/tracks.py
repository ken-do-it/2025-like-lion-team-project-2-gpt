"""Track API stubs."""

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db
from app.core.storage import StorageService
from app.models.track import Track
from app.schemas import (
    TrackCreate,
    TrackRead,
    UploadFinalizeRequest,
    UploadInitiateRequest,
    UploadInitiateResponse,
)
from app.services.tracks import TrackService

router = APIRouter(prefix="/tracks", tags=["tracks"])


def _service(db: Session, storage: StorageService | None = None) -> TrackService:
    return TrackService(db=db, storage=storage or StorageService())


@router.get("", response_model=list[TrackRead], summary="List tracks")
def list_tracks(db: Session = Depends(get_db)) -> list[Track]:
    """Return a simple list of tracks."""

    return _service(db).list_tracks()


@router.post("", response_model=TrackRead, status_code=status.HTTP_201_CREATED, summary="Create track")
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
        owner_user_id=current_user.user_id,
    )


@router.get("/{track_id}", response_model=TrackRead, summary="Get track detail")
def get_track(track_id: int, db: Session = Depends(get_db)) -> Track:
    """Fetch a single track by ID."""

    return _service(db).get_track(track_id)


@router.post(
    "/upload/initiate",
    response_model=UploadInitiateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate a presigned upload (stub)",
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
)
def finalize_upload(
    payload: UploadFinalizeRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Track:
    """Finalize a previously initiated upload and create a Track."""

    return _service(db).finalize_upload(payload, owner_user_id=current_user.user_id)


@router.post(
    "/upload/cleanup",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clean up expired upload sessions for current user",
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
)
async def direct_upload(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str | None = Form(None),
    cover_url: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Track:
    """Directly upload a file to local storage and create a Track."""

    return _service(db).upload_direct(
        file=file,
        title=title,
        description=description,
        cover_url=cover_url,
        owner_user_id=current_user.user_id,
    )
