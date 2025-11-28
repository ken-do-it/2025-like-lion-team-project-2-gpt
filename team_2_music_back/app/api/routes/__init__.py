"""Public API routes."""

from fastapi import APIRouter

from . import health, tracks, interactions

router = APIRouter()
router.include_router(health.router, tags=["system"])
router.include_router(tracks.router)
router.include_router(interactions.router)

__all__ = ["router"]
