"""Like and comment routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db
from app.schemas import CommentCreate, CommentRead, ErrorResponse, LikeActionResponse
from app.services.interactions import InteractionService

router = APIRouter(prefix="/interactions", tags=["interactions"])


def _svc(db: Session) -> InteractionService:
    return InteractionService(db=db)


@router.post(
    "/tracks/{track_id}/like",
    response_model=LikeActionResponse,
    status_code=status.HTTP_200_OK,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def like_track(
    track_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> LikeActionResponse:
    liked = _svc(db).toggle_like(track_id=track_id, user_id=current_user.user_id, like=True)
    return LikeActionResponse(track_id=track_id, liked=liked)


@router.delete(
    "/tracks/{track_id}/like",
    response_model=LikeActionResponse,
    status_code=status.HTTP_200_OK,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def unlike_track(
    track_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> LikeActionResponse:
    liked = _svc(db).toggle_like(track_id=track_id, user_id=current_user.user_id, like=False)
    return LikeActionResponse(track_id=track_id, liked=liked)


@router.get(
    "/tracks/{track_id}/likes/count",
    response_model=int,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def like_count(track_id: int, db: Session = Depends(get_db)) -> int:
    return _svc(db).count_likes(track_id)


@router.post(
    "/tracks/{track_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def add_comment(
    track_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> CommentRead:
    payload.track_id = track_id
    return _svc(db).add_comment(payload, user_id=current_user.user_id)


@router.get(
    "/tracks/{track_id}/comments",
    response_model=list[CommentRead],
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def list_comments(
    track_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[CommentRead]:
    return _svc(db).list_comments(track_id=track_id, limit=limit, offset=offset)
