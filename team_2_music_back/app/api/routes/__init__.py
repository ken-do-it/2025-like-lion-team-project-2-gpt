"""Public API routes."""

from fastapi import APIRouter

from . import health, tracks

router = APIRouter()
router.include_router(health.router, tags=["system"])
router.include_router(tracks.router)

__all__ = ["router"]
