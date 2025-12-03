"""JWT verification helpers."""

from __future__ import annotations

import json
import time
from dataclasses import dataclass

from jose import jwt, jwk
from jose.utils import base64url_decode

from app.core.config import settings
from app.core.jwt import JWKSClient


@dataclass
class AuthError(Exception):
    code: str
    message: str = "Unauthorized"


def _find_jwk_for_kid(kid: str, jwks: dict) -> dict | None:
    keys = jwks.get("keys", [])
    for key in keys:
        if key.get("kid") == kid:
            return key
    return None


async def decode_jwt(token: str, jwks_client: JWKSClient) -> dict:
    """Verify RS256 JWT using JWKS and return claims.

    Minimal verification: signature (kid lookup), exp, and optional audience from settings.
    """

    try:
        header = jwt.get_unverified_header(token)
    except Exception as exc:  # noqa: BLE001
        raise AuthError(code="INVALID_TOKEN", message="Invalid JWT header") from exc

    kid = header.get("kid")
    if not kid:
        raise AuthError(code="INVALID_TOKEN", message="Missing kid")

    alg = header.get("alg", "RS256")
    if alg != "RS256":
        raise AuthError(code="INVALID_TOKEN", message="Unsupported alg")

    jwks = await jwks_client.get_jwks()
    key_data = _find_jwk_for_kid(kid, jwks)
    if not key_data:
        raise AuthError(code="JWKS_KEY_NOT_FOUND", message="Signing key not found")

    try:
        key = jwk.construct(key_data)
        message, encoded_signature = token.rsplit(".", 1)
        decoded_signature = base64url_decode(encoded_signature.encode())
        if not key.verify(message.encode(), decoded_signature):
            raise AuthError(code="INVALID_SIGNATURE", message="Invalid token signature")

        claims = jwt.get_unverified_claims(token)
    except AuthError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise AuthError(code="INVALID_TOKEN", message="Failed to verify token") from exc

    exp = claims.get("exp")
    if exp is None or time.time() > exp:
        raise AuthError(code="TOKEN_EXPIRED", message="Token expired")

    audience = settings.project_name if settings.project_name else None
    token_aud = claims.get("aud")
    if audience and token_aud and audience not in (token_aud if isinstance(token_aud, list) else [token_aud]):
        raise AuthError(code="INVALID_AUDIENCE", message="Invalid audience")

    return claims
