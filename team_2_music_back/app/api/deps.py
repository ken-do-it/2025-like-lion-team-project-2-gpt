"""Dependency injection helpers for API routes."""

from collections.abc import Generator
from dataclasses import dataclass
from typing import Any

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

import httpx

from app.core.config import settings
from app.core.auth import AuthError, decode_jwt
from app.core.jwt import JWKSClient
from app.db.session import SessionLocal


@dataclass
class CurrentUser:
    """Lightweight current-user context."""

    user_id: int
    claims: dict


def get_db() -> Generator[Session, None, None]:
    """Provide a scoped SQLAlchemy session to request handlers."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    request: Request,
    authorization: str | None = Header(default=None, convert_underscores=True),
    x_user_id: int | None = Header(default=None, convert_underscores=True),
) -> CurrentUser:
    """Resolve the current user from Authorization Bearer token or fallback header."""

    jwks_client: JWKSClient = getattr(request.app.state, "jwks_client", JWKSClient())  # type: ignore[attr-defined]

    # Prefer Bearer JWT when provided
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        try:
            claims = await decode_jwt(token, jwks_client)
        except AuthError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=exc.code) from exc

        # Accept sub (preferred) or user_id in HS256 tokens.
        sub = claims.get("sub") or claims.get("user_id")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="INVALID_TOKEN")

        try:
            user_id = int(sub)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="INVALID_SUB") from None

        # Optional remote user sync: confirm user exists in auth server and upsert locally.
        user_id = await _verify_remote_user(token, user_id)

        return CurrentUser(user_id=user_id, claims=claims)

    # Dev fallback for local testing without JWT
    if settings.allow_header_auth and x_user_id is not None:
        return CurrentUser(user_id=x_user_id, claims={"sub": str(x_user_id)})

    if settings.jwks_url is None and not settings.allow_header_auth:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="AUTH_NOT_CONFIGURED")

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="UNAUTHORIZED")


async def _ensure_user_profile(db: Session, token: str, user_id: int) -> int:
    """Validate user against auth server; do not persist locally."""

    if not settings.auth_userinfo_url:
        return user_id

    async with httpx.AsyncClient(timeout=settings.auth_timeout_seconds) as client:
        resp = await client.get(
            str(settings.auth_userinfo_url),
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="AUTH_USER_NOT_FOUND")

    data = resp.json()
    remote_id = data.get("id")
    if remote_id is None or int(remote_id) != user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="AUTH_USER_MISMATCH")

    return user_id
