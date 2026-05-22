from __future__ import annotations

import base64
import hashlib
import json
from datetime import timedelta
from email.message import EmailMessage
from typing import Any

import httpx
import jwt
from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings
from .models import TelegramLink, User, UserIntegrationAccount, utc_now
from .schemas import GmailSendRequest, IntegrationAccountResponse


GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"
GOOGLE_BASE_SCOPES = ("openid", "email", "profile")
GOOGLE_INTEGRATION_SCOPES: dict[str, tuple[str, ...]] = {
    "gmail": (GMAIL_SEND_SCOPE,),
    "google-drive": ("https://www.googleapis.com/auth/drive.file",),
    "google-docs": (
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/drive.file",
    ),
    "google-sheets": (
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
    ),
    "google-slides": (
        "https://www.googleapis.com/auth/presentations",
        "https://www.googleapis.com/auth/drive.file",
    ),
    "google-calendar": ("https://www.googleapis.com/auth/calendar.events",),
    "google-search-console": ("https://www.googleapis.com/auth/webmasters.readonly",),
    "google-analytics-4": ("https://www.googleapis.com/auth/analytics.readonly",),
}
GOOGLE_GMAIL_SCOPES = (*GOOGLE_BASE_SCOPES, GMAIL_SEND_SCOPE)


def get_google_integration_scopes(integration_slug: str) -> tuple[str, ...] | None:
    product_scopes = GOOGLE_INTEGRATION_SCOPES.get(integration_slug)
    if product_scopes is None:
        return None
    return (*GOOGLE_BASE_SCOPES, *product_scopes)


def _fernet(settings: Settings) -> Fernet:
    secret = (settings.integration_token_secret or settings.session_secret).encode("utf-8")
    key = base64.urlsafe_b64encode(hashlib.sha256(secret).digest())
    return Fernet(key)


def encrypt_token_payload(settings: Settings, payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return _fernet(settings).encrypt(raw).decode("utf-8")


def decrypt_token_payload(settings: Settings, encrypted_payload: str) -> dict[str, Any]:
    if not encrypted_payload:
        return {}
    raw = _fernet(settings).decrypt(encrypted_payload.encode("utf-8"))
    payload = json.loads(raw.decode("utf-8"))
    return payload if isinstance(payload, dict) else {}


def build_google_integration_state(settings: Settings, *, user_id: str, next_url: str, integration_slug: str) -> str:
    now = utc_now()
    token = jwt.encode(
        {
            "iss": settings.session_issuer,
            "aud": "google-integration-state",
            "sub": user_id,
            "next": next_url,
            "integration_slug": integration_slug,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=20)).timestamp()),
        },
        settings.session_secret,
        algorithm="HS256",
    )
    return token if isinstance(token, str) else str(token)


def build_google_gmail_state(settings: Settings, *, user_id: str, next_url: str) -> str:
    return build_google_integration_state(
        settings,
        user_id=user_id,
        next_url=next_url,
        integration_slug="gmail",
    )


def decode_google_integration_state(settings: Settings, state_token: str) -> dict[str, Any]:
    payload = jwt.decode(
        state_token,
        settings.session_secret,
        algorithms=["HS256"],
        issuer=settings.session_issuer,
        audience="google-integration-state",
    )
    return payload if isinstance(payload, dict) else {}


def decode_google_gmail_state(settings: Settings, state_token: str) -> dict[str, Any]:
    try:
        return decode_google_integration_state(settings, state_token)
    except Exception:
        payload = jwt.decode(
            state_token,
            settings.session_secret,
            algorithms=["HS256"],
            issuer=settings.session_issuer,
            audience="google-gmail-integration-state",
        )
        if isinstance(payload, dict):
            payload.setdefault("integration_slug", "gmail")
            return payload
        return {}


def _scope_list(scopes: Any) -> list[str]:
    if isinstance(scopes, str):
        return [scope for scope in scopes.split() if scope]
    if isinstance(scopes, list):
        return [str(scope) for scope in scopes if str(scope).strip()]
    return []


def integration_to_response(account: UserIntegrationAccount | None) -> IntegrationAccountResponse:
    if account is None:
        return IntegrationAccountResponse(
            provider="google",
            integration_slug="gmail",
            status="disconnected",
            scopes=[],
            can_send=False,
        )
    scopes = _scope_list((account.scopes_json or {}).get("scopes"))
    connected = account.status == "connected"
    return IntegrationAccountResponse(
        provider=account.provider,
        integration_slug=account.integration_slug,
        status=account.status,
        account_email=account.account_email,
        display_name=account.display_name,
        scopes=scopes,
        can_send=connected and GMAIL_SEND_SCOPE in scopes,
        connected_at=account.connected_at,
        last_used_at=account.last_used_at,
    )


def get_user_gmail_account(db: Session, *, user_id: str) -> UserIntegrationAccount | None:
    return get_user_google_account(db, user_id=user_id, integration_slug="gmail")


def get_user_google_account(db: Session, *, user_id: str, integration_slug: str) -> UserIntegrationAccount | None:
    return db.scalar(
        select(UserIntegrationAccount).where(
            UserIntegrationAccount.user_id == user_id,
            UserIntegrationAccount.provider == "google",
            UserIntegrationAccount.integration_slug == integration_slug,
            UserIntegrationAccount.status == "connected",
        )
    )


def resolve_action_user(
    db: Session,
    *,
    product_slug: str,
    user_id: str | None = None,
    telegram_user_id: str | None = None,
) -> User | None:
    if user_id:
        return db.get(User, user_id)
    if telegram_user_id:
        link = db.scalar(
            select(TelegramLink).where(
                TelegramLink.product_slug == product_slug,
                TelegramLink.telegram_user_id == telegram_user_id,
                TelegramLink.status == "linked",
            )
        )
        if link is None:
            return None
        return db.get(User, link.user_id)
    return None


def upsert_google_integration_account(
    db: Session,
    settings: Settings,
    *,
    user: User,
    integration_slug: str,
    token_payload: dict[str, Any],
    profile: dict[str, Any],
) -> UserIntegrationAccount:
    now = utc_now()
    existing = get_user_google_account(db, user_id=user.id, integration_slug=integration_slug)
    existing_tokens = decrypt_token_payload(settings, existing.encrypted_token_json) if existing else {}
    refresh_token = token_payload.get("refresh_token") or existing_tokens.get("refresh_token")
    expires_in = int(token_payload.get("expires_in") or 3600)
    token_state = {
        **existing_tokens,
        "access_token": token_payload.get("access_token"),
        "refresh_token": refresh_token,
        "token_type": token_payload.get("token_type") or "Bearer",
        "expires_at": int((now + timedelta(seconds=expires_in)).timestamp()),
    }
    scopes = _scope_list(token_payload.get("scope")) or _scope_list(existing.scopes_json.get("scopes") if existing else [])

    account = existing or UserIntegrationAccount(
        user_id=user.id,
        provider="google",
        integration_slug=integration_slug,
    )
    account.account_email = str(profile.get("email") or "").strip().lower() or user.email
    account.display_name = str(profile.get("name") or "").strip() or None
    account.status = "connected"
    account.scopes_json = {"scopes": scopes}
    account.encrypted_token_json = encrypt_token_payload(settings, token_state)
    account.connected_at = account.connected_at or now
    account.expires_at = now + timedelta(seconds=expires_in)
    account.metadata_json = {
        **((account.metadata_json or {}) if existing else {}),
        "email_verified": bool(profile.get("email_verified")),
    }
    if existing is None:
        db.add(account)
    db.flush()
    db.refresh(account)
    return account


def upsert_google_gmail_account(
    db: Session,
    settings: Settings,
    *,
    user: User,
    token_payload: dict[str, Any],
    profile: dict[str, Any],
) -> UserIntegrationAccount:
    return upsert_google_integration_account(
        db,
        settings,
        user=user,
        integration_slug="gmail",
        token_payload=token_payload,
        profile=profile,
    )


async def exchange_google_code_for_tokens(
    settings: Settings,
    *,
    code: str,
    redirect_uri: str,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    async with http_client_cls(timeout=20) as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        if response.status_code >= 400:
            raise ValueError(f"Google token exchange failed with status {response.status_code}")
        return response.json()


async def fetch_google_profile(access_token: str, *, http_client_cls=httpx.AsyncClient) -> dict[str, Any]:
    async with http_client_cls(timeout=20) as client:
        response = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        if response.status_code >= 400:
            raise ValueError(f"Google profile fetch failed with status {response.status_code}")
        return response.json()


async def _refresh_google_access_token(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    tokens: dict[str, Any],
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    refresh_token = str(tokens.get("refresh_token") or "").strip()
    if not refresh_token:
        raise ValueError("Gmail must be reconnected before sending.")
    async with http_client_cls(timeout=20) as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            headers={"Accept": "application/json"},
        )
        if response.status_code >= 400:
            raise ValueError(f"Google token refresh failed with status {response.status_code}")
        payload = response.json()
    now = utc_now()
    expires_in = int(payload.get("expires_in") or 3600)
    updated = {
        **tokens,
        "access_token": payload.get("access_token") or tokens.get("access_token"),
        "refresh_token": payload.get("refresh_token") or refresh_token,
        "token_type": payload.get("token_type") or tokens.get("token_type") or "Bearer",
        "expires_at": int((now + timedelta(seconds=expires_in)).timestamp()),
    }
    account.encrypted_token_json = encrypt_token_payload(settings, updated)
    account.expires_at = now + timedelta(seconds=expires_in)
    db.flush()
    return updated


async def ensure_gmail_access_token(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    http_client_cls=httpx.AsyncClient,
) -> str:
    tokens = decrypt_token_payload(settings, account.encrypted_token_json)
    access_token = str(tokens.get("access_token") or "").strip()
    expires_at = int(tokens.get("expires_at") or 0)
    if access_token and expires_at > int((utc_now() + timedelta(seconds=60)).timestamp()):
        return access_token
    refreshed = await _refresh_google_access_token(
        db,
        settings,
        account=account,
        tokens=tokens,
        http_client_cls=http_client_cls,
    )
    return str(refreshed.get("access_token") or "").strip()


def _build_gmail_raw_message(account: UserIntegrationAccount, payload: GmailSendRequest) -> str:
    message = EmailMessage()
    if account.account_email:
        message["From"] = account.account_email
    message["To"] = ", ".join(str(item) for item in payload.to)
    if payload.cc:
        message["Cc"] = ", ".join(str(item) for item in payload.cc)
    if payload.bcc:
        message["Bcc"] = ", ".join(str(item) for item in payload.bcc)
    message["Subject"] = payload.subject
    message.set_content(payload.body_text)
    if payload.body_html:
        message.add_alternative(payload.body_html, subtype="html")
    return base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")


async def send_gmail_message(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: GmailSendRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    access_token = await ensure_gmail_access_token(
        db,
        settings,
        account=account,
        http_client_cls=http_client_cls,
    )
    if not access_token:
        raise ValueError("Gmail must be reconnected before sending.")
    raw_message = _build_gmail_raw_message(account, payload)
    async with http_client_cls(timeout=20) as client:
        response = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            json={"raw": raw_message},
        )
        if response.status_code >= 400:
            raise ValueError(f"Gmail send failed with status {response.status_code}")
        result = response.json()
    account.last_used_at = utc_now()
    db.flush()
    return result if isinstance(result, dict) else {}
