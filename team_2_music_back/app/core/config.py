"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Stitch Music API"
    version: str = "0.1.0"
    root_path: str = ""
    environment: str = "development"
    api_prefix: str = "/api"

    database_url: str = "sqlite:///./app.db"
    redis_url: str = "redis://localhost:6379/0"

    jwks_url: AnyHttpUrl | None = None
    jwks_audience: str | None = None
    jwks_cache_ttl: int = 3600
    allow_header_auth: bool = True

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]

    s3_bucket: str = "stitch-music-dev"
    presign_expiration: int = 900

    local_storage_path: str = "storage"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="MUSIC_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
