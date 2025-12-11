"""JWKS fetching helpers for JWT validation."""

from __future__ import annotations

import json
import time
from typing import Any

import httpx
from redis.asyncio import Redis  # type: ignore[import]

from .config import settings


class JWKSClient:
    """Fetch and cache JWKS documents for RS256 verification."""

    _CACHE_KEY = "auth:jwks"

    def __init__(self, redis_client: Redis | None = None) -> None:
        self._redis = redis_client
        # httpx expects a string URL; Pydantic's AnyHttpUrl needs to be cast.
        self._jwks_url = str(settings.jwks_url) if settings.jwks_url else None
        self._ttl = settings.jwks_cache_ttl
        self._local_cache: tuple[float, dict[str, Any]] | None = None

    async def warm(self) -> None:
        """Prime the cache so the first request is fast.

        Failures here should not crash the app; they will be retried on demand.
        """

        if not self._jwks_url:
            return

        try:
            await self.get_jwks()
        except Exception as exc:  # noqa: BLE001
            import logging

            logging.getLogger(__name__).warning("JWKS warmup failed: %s", exc)

    async def get_jwks(self) -> dict[str, Any]:
        """Retrieve JWKS using Redis and in-process caching."""

        if not self._jwks_url:
            raise RuntimeError("JWKS URL is not configured")

        cached = self._read_from_local_cache()
        if cached:
            return cached

        if self._redis:
            blob = await self._redis.get(self._CACHE_KEY)
            if blob:
                data = json.loads(blob)
                self._write_local_cache(data)
                return data

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(self._jwks_url)
            response.raise_for_status()
            data = response.json()

        if self._redis:
            await self._redis.set(self._CACHE_KEY, json.dumps(data), ex=self._ttl)

        self._write_local_cache(data)
        return data

    def _read_from_local_cache(self) -> dict[str, Any] | None:
        if not self._local_cache:
            return None
        expires_at, payload = self._local_cache
        if expires_at < time.time():
            self._local_cache = None
            return None
        return payload

    def _write_local_cache(self, payload: dict[str, Any]) -> None:
        self._local_cache = (time.time() + self._ttl, payload)
