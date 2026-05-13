from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from .config import Settings


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def new_magic_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def build_session_token(settings: Settings, user_id: str, email: str) -> str:
    now = utc_now()
    payload = {
        "sub": user_id,
        "email": email,
        "iss": settings.session_issuer,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.session_max_age_seconds)).timestamp()),
    }
    return jwt.encode(payload, settings.session_secret, algorithm="HS256")


def decode_session_token(settings: Settings, token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.session_secret,
        algorithms=["HS256"],
        issuer=settings.session_issuer,
    )
