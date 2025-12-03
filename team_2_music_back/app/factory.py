"""FastAPI application factory and lifecycle hooks."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.routes import router as api_router
from .core.config import settings
from .core.errors import register_error_handlers
from .core.jwt import JWKSClient
from app.db import base  # noqa: F401  # ensure models are imported for SQLAlchemy mappings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Warm caches and dispose shared resources gracefully."""

    jwks_client = JWKSClient()
    app.state.jwks_client = jwks_client

    if settings.jwks_url:
        await jwks_client.warm()

    yield


def create_app() -> FastAPI:
    """Instantiate the FastAPI application with routing and middleware."""

    application = FastAPI(
        title=settings.project_name,
        version=settings.version,
        lifespan=lifespan,
        root_path=settings.root_path,
    )

    application.include_router(api_router, prefix=settings.api_prefix)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Serve local uploads (only for dev/local)
    application.mount(
        "/uploads",
        StaticFiles(directory=settings.local_storage_path, check_dir=False),
        name="uploads",
    )

    register_error_handlers(application)

    return application
