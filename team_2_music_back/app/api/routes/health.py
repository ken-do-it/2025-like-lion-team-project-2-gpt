"""Health and readiness probes."""

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.system import HealthResponse, ErrorResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def health_check() -> HealthResponse:
    """Return a lightweight status payload for monitoring."""

    return HealthResponse(
        status="ok",
        environment=settings.environment,
        version=settings.version,
    )
