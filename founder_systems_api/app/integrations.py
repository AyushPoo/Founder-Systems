from __future__ import annotations

import base64
import hashlib
import json
from datetime import timedelta
from email.message import EmailMessage
from typing import Any
from urllib.parse import quote

import httpx
import jwt
from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings
from .models import TelegramLink, User, UserIntegrationAccount, utc_now
from .schemas import (
    GmailSendRequest,
    GithubIssueCreateRequest,
    GoogleAnalyticsRunReportRequest,
    GoogleCalendarEventCreateRequest,
    GoogleDocCreateRequest,
    GoogleSearchConsoleQueryRequest,
    GoogleSheetCreateRequest,
    HubSpotContactCreateRequest,
    IntegrationAccountResponse,
    MailchimpCampaignsListRequest,
    MetaAdsInsightsRequest,
    RazorpayPaymentsListRequest,
)


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
EXTERNAL_INTEGRATION_SCOPES: dict[str, tuple[str, ...]] = {
    "github": ("repo", "user:email"),
    "hubspot": (
        "crm.objects.contacts.read",
        "crm.objects.contacts.write",
        "crm.objects.deals.read",
        "crm.objects.deals.write",
    ),
    "mailchimp": (),
    "meta-ads": ("ads_read", "ads_management", "business_management"),
    "linkedin": ("openid", "profile", "email"),
}
EXTERNAL_PROVIDER_BY_SLUG = {
    "github": "github",
    "hubspot": "hubspot",
    "mailchimp": "mailchimp",
    "meta-ads": "meta",
    "linkedin": "linkedin",
}


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


def build_external_integration_state(settings: Settings, *, user_id: str, next_url: str, integration_slug: str) -> str:
    now = utc_now()
    token = jwt.encode(
        {
            "iss": settings.session_issuer,
            "aud": "external-integration-state",
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


def decode_external_integration_state(settings: Settings, state_token: str) -> dict[str, Any]:
    payload = jwt.decode(
        state_token,
        settings.session_secret,
        algorithms=["HS256"],
        issuer=settings.session_issuer,
        audience="external-integration-state",
    )
    return payload if isinstance(payload, dict) else {}


def get_external_integration_scopes(integration_slug: str) -> tuple[str, ...] | None:
    return EXTERNAL_INTEGRATION_SCOPES.get(integration_slug)


def _external_integration_provider(integration_slug: str) -> str:
    return EXTERNAL_PROVIDER_BY_SLUG.get(integration_slug, integration_slug)


def external_integration_credentials(settings: Settings, integration_slug: str) -> tuple[str | None, str | None]:
    if integration_slug == "github":
        return settings.github_client_id, settings.github_client_secret
    if integration_slug == "hubspot":
        return settings.hubspot_client_id, settings.hubspot_client_secret
    if integration_slug == "mailchimp":
        return settings.mailchimp_client_id, settings.mailchimp_client_secret
    if integration_slug == "meta-ads":
        return settings.meta_client_id, settings.meta_client_secret
    if integration_slug == "linkedin":
        return settings.linkedin_client_id, settings.linkedin_client_secret
    return None, None


def build_external_authorization_url(
    settings: Settings,
    *,
    integration_slug: str,
    redirect_uri: str,
    state: str,
) -> str:
    client_id, _client_secret = external_integration_credentials(settings, integration_slug)
    scopes = get_external_integration_scopes(integration_slug)
    if client_id is None or scopes is None:
        raise ValueError("Unsupported external integration")

    if integration_slug == "github":
        base_url = "https://github.com/login/oauth/authorize"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(scopes),
            "state": state,
        }
    elif integration_slug == "hubspot":
        base_url = "https://app.hubspot.com/oauth/authorize"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(scopes),
            "state": state,
        }
    elif integration_slug == "mailchimp":
        base_url = "https://login.mailchimp.com/oauth2/authorize"
        params = {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "state": state,
        }
    elif integration_slug == "meta-ads":
        base_url = f"https://www.facebook.com/{settings.meta_graph_version}/dialog/oauth"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": ",".join(scopes),
            "response_type": "code",
            "state": state,
        }
    elif integration_slug == "linkedin":
        base_url = "https://www.linkedin.com/oauth/v2/authorization"
        params = {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(scopes),
            "state": state,
        }
    else:
        raise ValueError("Unsupported external integration")

    return str(httpx.URL(base_url).copy_merge_params(params))


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


def get_user_integration_account(db: Session, *, user_id: str, integration_slug: str) -> UserIntegrationAccount | None:
    provider = _external_integration_provider(integration_slug)
    return db.scalar(
        select(UserIntegrationAccount).where(
            UserIntegrationAccount.user_id == user_id,
            UserIntegrationAccount.provider == provider,
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


def upsert_external_integration_account(
    db: Session,
    settings: Settings,
    *,
    user: User,
    integration_slug: str,
    token_payload: dict[str, Any],
    profile: dict[str, Any],
) -> UserIntegrationAccount:
    now = utc_now()
    provider = _external_integration_provider(integration_slug)
    existing = get_user_integration_account(db, user_id=user.id, integration_slug=integration_slug)
    existing_tokens = decrypt_token_payload(settings, existing.encrypted_token_json) if existing else {}
    expires_in_raw = token_payload.get("expires_in")
    expires_in = int(expires_in_raw) if expires_in_raw is not None else None
    token_state = {
        **existing_tokens,
        "access_token": token_payload.get("access_token") or existing_tokens.get("access_token"),
        "refresh_token": token_payload.get("refresh_token") or existing_tokens.get("refresh_token"),
        "token_type": token_payload.get("token_type") or existing_tokens.get("token_type") or "Bearer",
    }
    expires_at = None
    if expires_in:
        expires_at = now + timedelta(seconds=expires_in)
        token_state["expires_at"] = int(expires_at.timestamp())

    scopes = _scope_list(token_payload.get("scope")) or list(get_external_integration_scopes(integration_slug) or [])
    account = existing or UserIntegrationAccount(
        user_id=user.id,
        provider=provider,
        integration_slug=integration_slug,
    )
    account.account_email = str(profile.get("email") or "").strip().lower() or None
    account.display_name = str(profile.get("name") or profile.get("login") or profile.get("account_name") or "").strip() or None
    account.status = "connected"
    account.scopes_json = {"scopes": scopes}
    account.encrypted_token_json = encrypt_token_payload(settings, token_state)
    account.connected_at = account.connected_at or now
    account.expires_at = expires_at
    account.metadata_json = {
        **((account.metadata_json or {}) if existing else {}),
        **{key: value for key, value in profile.items() if key not in {"email", "name", "login"}},
    }
    if existing is None:
        db.add(account)
    db.flush()
    db.refresh(account)
    return account


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


async def exchange_external_code_for_tokens(
    settings: Settings,
    *,
    integration_slug: str,
    code: str,
    redirect_uri: str,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    client_id, client_secret = external_integration_credentials(settings, integration_slug)
    if not client_id or not client_secret:
        raise ValueError("External integration credentials are not configured.")

    async with http_client_cls(timeout=20) as client:
        if integration_slug == "github":
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
        elif integration_slug == "hubspot":
            response = await client.post(
                "https://api.hubapi.com/oauth/v1/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
        elif integration_slug == "mailchimp":
            response = await client.post(
                "https://login.mailchimp.com/oauth2/token",
                data={
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
                auth=(client_id, client_secret),
                headers={"Accept": "application/json"},
            )
        elif integration_slug == "meta-ads":
            response = await client.get(
                f"https://graph.facebook.com/{settings.meta_graph_version}/oauth/access_token",
                params={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
        elif integration_slug == "linkedin":
            response = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "client_id": client_id,
                    "client_secret": client_secret,
                },
                headers={"Accept": "application/json"},
            )
        else:
            raise ValueError("Unsupported external integration")
        if response.status_code >= 400:
            raise ValueError(f"{integration_slug} token exchange failed with status {response.status_code}")
        payload = response.json()
        return payload if isinstance(payload, dict) else {}


async def fetch_google_profile(access_token: str, *, http_client_cls=httpx.AsyncClient) -> dict[str, Any]:
    async with http_client_cls(timeout=20) as client:
        response = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        if response.status_code >= 400:
            raise ValueError(f"Google profile fetch failed with status {response.status_code}")
        return response.json()


async def fetch_external_profile(
    integration_slug: str,
    access_token: str,
    *,
    settings: Settings,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
    async with http_client_cls(timeout=20) as client:
        if integration_slug == "github":
            profile_response = await client.get("https://api.github.com/user", headers=headers)
            if profile_response.status_code >= 400:
                raise ValueError(f"GitHub profile fetch failed with status {profile_response.status_code}")
            profile = profile_response.json()
            email = str(profile.get("email") or "").strip().lower()
            if not email:
                emails_response = await client.get("https://api.github.com/user/emails", headers=headers)
                if emails_response.status_code < 400:
                    emails = emails_response.json()
                    if isinstance(emails, list):
                        primary = next((item for item in emails if item.get("primary")), None) or (emails[0] if emails else {})
                        email = str(primary.get("email") or "").strip().lower()
            return {
                "email": email,
                "name": profile.get("name"),
                "login": profile.get("login"),
                "provider_user_id": str(profile.get("id") or ""),
            }
        if integration_slug == "hubspot":
            response = await client.get(f"https://api.hubapi.com/oauth/v1/access-tokens/{access_token}", headers={"Accept": "application/json"})
            if response.status_code >= 400:
                raise ValueError(f"HubSpot profile fetch failed with status {response.status_code}")
            profile = response.json()
            return {
                "email": profile.get("user"),
                "name": profile.get("hub_domain") or profile.get("app_id"),
                "hub_id": profile.get("hub_id"),
                "hub_domain": profile.get("hub_domain"),
            }
        if integration_slug == "mailchimp":
            response = await client.get("https://login.mailchimp.com/oauth2/metadata", headers=headers)
            if response.status_code >= 400:
                raise ValueError(f"Mailchimp metadata fetch failed with status {response.status_code}")
            profile = response.json()
            return {
                "email": profile.get("login", {}).get("email") if isinstance(profile.get("login"), dict) else None,
                "name": profile.get("accountname") or profile.get("dc"),
                "dc": profile.get("dc"),
                "api_endpoint": profile.get("api_endpoint"),
                "login_url": profile.get("login_url"),
            }
        if integration_slug == "meta-ads":
            response = await client.get(
                f"https://graph.facebook.com/{settings.meta_graph_version}/me",
                params={"fields": "id,name,email", "access_token": access_token},
                headers={"Accept": "application/json"},
            )
            if response.status_code >= 400:
                raise ValueError(f"Meta profile fetch failed with status {response.status_code}")
            profile = response.json()
            return {
                "email": profile.get("email"),
                "name": profile.get("name"),
                "provider_user_id": profile.get("id"),
            }
        if integration_slug == "linkedin":
            response = await client.get("https://api.linkedin.com/v2/userinfo", headers=headers)
            if response.status_code >= 400:
                raise ValueError(f"LinkedIn profile fetch failed with status {response.status_code}")
            profile = response.json()
            return {
                "email": profile.get("email"),
                "name": profile.get("name"),
                "provider_user_id": profile.get("sub"),
                "locale": profile.get("locale"),
            }
    raise ValueError("Unsupported external integration")


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
    return await ensure_google_access_token(
        db,
        settings,
        account=account,
        integration_label="Gmail",
        http_client_cls=http_client_cls,
    )


async def ensure_google_access_token(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    integration_label: str = "Google",
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
    refreshed_access_token = str(refreshed.get("access_token") or "").strip()
    if not refreshed_access_token:
        raise ValueError(f"{integration_label} must be reconnected before this action.")
    return refreshed_access_token


def _require_google_scopes(account: UserIntegrationAccount, required_scopes: tuple[str, ...]) -> None:
    granted_scopes = set(_scope_list((account.scopes_json or {}).get("scopes")))
    missing = [scope for scope in required_scopes if scope not in granted_scopes]
    if missing:
        raise ValueError("Reconnect Google with the required permissions before this action.")


async def _google_headers(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    integration_label: str,
    required_scopes: tuple[str, ...],
    http_client_cls=httpx.AsyncClient,
) -> dict[str, str]:
    _require_google_scopes(account, required_scopes)
    access_token = await ensure_google_access_token(
        db,
        settings,
        account=account,
        integration_label=integration_label,
        http_client_cls=http_client_cls,
    )
    return {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}


def get_external_access_token(settings: Settings, *, account: UserIntegrationAccount, integration_label: str) -> str:
    tokens = decrypt_token_payload(settings, account.encrypted_token_json)
    access_token = str(tokens.get("access_token") or "").strip()
    expires_at = int(tokens.get("expires_at") or 0)
    if expires_at and expires_at <= int((utc_now() + timedelta(seconds=60)).timestamp()):
        raise ValueError(f"{integration_label} must be reconnected before this action.")
    if not access_token:
        raise ValueError(f"{integration_label} must be connected before this action.")
    return access_token


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


async def create_google_doc(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: GoogleDocCreateRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    headers = await _google_headers(
        db,
        settings,
        account=account,
        integration_label="Google Docs",
        required_scopes=GOOGLE_INTEGRATION_SCOPES["google-docs"],
        http_client_cls=http_client_cls,
    )
    async with http_client_cls(timeout=20) as client:
        create_response = await client.post(
            "https://docs.googleapis.com/v1/documents",
            headers=headers,
            json={"title": payload.title},
        )
        if create_response.status_code >= 400:
            raise ValueError(f"Google Docs create failed with status {create_response.status_code}")
        document = create_response.json()
        document_id = str(document.get("documentId") or "").strip()
        if not document_id:
            raise ValueError("Google Docs did not return a document id.")
        update_response = await client.post(
            f"https://docs.googleapis.com/v1/documents/{document_id}:batchUpdate",
            headers=headers,
            json={
                "requests": [
                    {
                        "insertText": {
                            "location": {"index": 1},
                            "text": payload.body_text,
                        }
                    }
                ]
            },
        )
        if update_response.status_code >= 400:
            raise ValueError(f"Google Docs update failed with status {update_response.status_code}")
    account.last_used_at = utc_now()
    db.flush()
    return {
        "document_id": document_id,
        "document_url": f"https://docs.google.com/document/d/{document_id}/edit",
    }


async def create_google_sheet(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: GoogleSheetCreateRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    headers = await _google_headers(
        db,
        settings,
        account=account,
        integration_label="Google Sheets",
        required_scopes=GOOGLE_INTEGRATION_SCOPES["google-sheets"],
        http_client_cls=http_client_cls,
    )
    async with http_client_cls(timeout=20) as client:
        create_response = await client.post(
            "https://sheets.googleapis.com/v4/spreadsheets",
            headers=headers,
            json={
                "properties": {"title": payload.title},
                "sheets": [{"properties": {"title": payload.sheet_name}}],
            },
        )
        if create_response.status_code >= 400:
            raise ValueError(f"Google Sheets create failed with status {create_response.status_code}")
        spreadsheet = create_response.json()
        spreadsheet_id = str(spreadsheet.get("spreadsheetId") or "").strip()
        if not spreadsheet_id:
            raise ValueError("Google Sheets did not return a spreadsheet id.")
        updated_rows = 0
        if payload.values:
            append_response = await client.post(
                f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{payload.sheet_name}!A1:append",
                headers=headers,
                params={"valueInputOption": "USER_ENTERED", "insertDataOption": "INSERT_ROWS"},
                json={"values": payload.values},
            )
            if append_response.status_code >= 400:
                raise ValueError(f"Google Sheets append failed with status {append_response.status_code}")
            updated_rows = int(((append_response.json() or {}).get("updates") or {}).get("updatedRows") or 0)
    account.last_used_at = utc_now()
    db.flush()
    return {
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_url": spreadsheet.get("spreadsheetUrl"),
        "updated_rows": updated_rows,
    }


async def create_google_calendar_event(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: GoogleCalendarEventCreateRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    headers = await _google_headers(
        db,
        settings,
        account=account,
        integration_label="Google Calendar",
        required_scopes=GOOGLE_INTEGRATION_SCOPES["google-calendar"],
        http_client_cls=http_client_cls,
    )
    event_body: dict[str, Any] = {
        "summary": payload.summary,
        "start": {"dateTime": payload.start_at.isoformat(), "timeZone": payload.timezone},
        "end": {"dateTime": payload.end_at.isoformat(), "timeZone": payload.timezone},
    }
    if payload.description:
        event_body["description"] = payload.description
    if payload.location:
        event_body["location"] = payload.location
    if payload.attendees:
        event_body["attendees"] = [{"email": str(email)} for email in payload.attendees]
    async with http_client_cls(timeout=20) as client:
        response = await client.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers=headers,
            json=event_body,
        )
        if response.status_code >= 400:
            raise ValueError(f"Google Calendar event create failed with status {response.status_code}")
        event = response.json()
    account.last_used_at = utc_now()
    db.flush()
    return {
        "event_id": str(event.get("id") or ""),
        "html_link": event.get("htmlLink"),
    }


async def query_google_search_console(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: GoogleSearchConsoleQueryRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    headers = await _google_headers(
        db,
        settings,
        account=account,
        integration_label="Google Search Console",
        required_scopes=GOOGLE_INTEGRATION_SCOPES["google-search-console"],
        http_client_cls=http_client_cls,
    )
    encoded_site = quote(payload.site_url, safe="")
    async with http_client_cls(timeout=20) as client:
        response = await client.post(
            f"https://searchconsole.googleapis.com/webmasters/v3/sites/{encoded_site}/searchAnalytics/query",
            headers=headers,
            json={
                "startDate": payload.start_date,
                "endDate": payload.end_date,
                "dimensions": payload.dimensions,
                "rowLimit": payload.row_limit,
            },
        )
        if response.status_code >= 400:
            raise ValueError(f"Search Console query failed with status {response.status_code}")
        result = response.json()
    account.last_used_at = utc_now()
    db.flush()
    return {"rows": result.get("rows") or []}


async def run_google_analytics_report(
    db: Session,
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: GoogleAnalyticsRunReportRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    headers = await _google_headers(
        db,
        settings,
        account=account,
        integration_label="Google Analytics",
        required_scopes=GOOGLE_INTEGRATION_SCOPES["google-analytics-4"],
        http_client_cls=http_client_cls,
    )
    async with http_client_cls(timeout=20) as client:
        response = await client.post(
            f"https://analyticsdata.googleapis.com/v1beta/properties/{payload.property_id}:runReport",
            headers=headers,
            json={
                "dateRanges": [{"startDate": payload.start_date, "endDate": payload.end_date}],
                "metrics": [{"name": metric} for metric in payload.metrics],
                "dimensions": [{"name": dimension} for dimension in payload.dimensions],
            },
        )
        if response.status_code >= 400:
            raise ValueError(f"Google Analytics report failed with status {response.status_code}")
        result = response.json()
    account.last_used_at = utc_now()
    db.flush()
    return {"rows": result.get("rows") or []}


async def list_razorpay_payments(
    settings: Settings,
    *,
    payload: RazorpayPaymentsListRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise ValueError("Razorpay credentials are not configured.")
    params: dict[str, Any] = {"count": payload.count, "skip": payload.skip}
    if payload.from_timestamp is not None:
        params["from"] = payload.from_timestamp
    if payload.to_timestamp is not None:
        params["to"] = payload.to_timestamp
    async with http_client_cls(timeout=20) as client:
        response = await client.get(
            "https://api.razorpay.com/v1/payments",
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
            params=params,
            headers={"Accept": "application/json"},
        )
        if response.status_code >= 400:
            raise ValueError(f"Razorpay payments list failed with status {response.status_code}")
        result = response.json()
    return {
        "items": result.get("items") or [],
        "count": int(result.get("count") or len(result.get("items") or [])),
    }


async def create_github_issue(
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: GithubIssueCreateRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    access_token = get_external_access_token(settings, account=account, integration_label="GitHub")
    body: dict[str, Any] = {"title": payload.title}
    if payload.body_text:
        body["body"] = payload.body_text
    if payload.labels:
        body["labels"] = payload.labels
    async with http_client_cls(timeout=20) as client:
        response = await client.post(
            f"https://api.github.com/repos/{payload.repo}/issues",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            json=body,
        )
        if response.status_code >= 400:
            raise ValueError(f"GitHub issue create failed with status {response.status_code}")
        result = response.json()
    account.last_used_at = utc_now()
    return {
        "issue_id": result.get("id"),
        "issue_number": result.get("number"),
        "issue_url": result.get("html_url"),
    }


async def create_hubspot_contact(
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: HubSpotContactCreateRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    access_token = get_external_access_token(settings, account=account, integration_label="HubSpot")
    properties = {"email": str(payload.email)}
    if payload.first_name:
        properties["firstname"] = payload.first_name
    if payload.last_name:
        properties["lastname"] = payload.last_name
    if payload.company:
        properties["company"] = payload.company
    if payload.phone:
        properties["phone"] = payload.phone
    async with http_client_cls(timeout=20) as client:
        response = await client.post(
            "https://api.hubapi.com/crm/v3/objects/contacts",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            json={"properties": properties},
        )
        if response.status_code >= 400:
            raise ValueError(f"HubSpot contact create failed with status {response.status_code}")
        result = response.json()
    account.last_used_at = utc_now()
    portal_id = (account.metadata_json or {}).get("hub_id")
    contact_id = str(result.get("id") or "")
    return {
        "contact_id": contact_id or None,
        "contact_url": f"https://app.hubspot.com/contacts/{portal_id}/contact/{contact_id}" if portal_id and contact_id else None,
    }


async def list_mailchimp_campaigns(
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: MailchimpCampaignsListRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    access_token = get_external_access_token(settings, account=account, integration_label="Mailchimp")
    api_endpoint = str((account.metadata_json or {}).get("api_endpoint") or "").rstrip("/")
    dc = str((account.metadata_json or {}).get("dc") or "").strip()
    if not api_endpoint and dc:
        api_endpoint = f"https://{dc}.api.mailchimp.com/3.0"
    if not api_endpoint:
        raise ValueError("Reconnect Mailchimp before reading campaigns.")
    params: dict[str, Any] = {"count": payload.count}
    if payload.status:
        params["status"] = payload.status
    async with http_client_cls(timeout=20) as client:
        response = await client.get(
            f"{api_endpoint}/campaigns",
            headers={"Authorization": f"OAuth {access_token}", "Accept": "application/json"},
            params=params,
        )
        if response.status_code >= 400:
            raise ValueError(f"Mailchimp campaigns list failed with status {response.status_code}")
        result = response.json()
    account.last_used_at = utc_now()
    campaigns = result.get("campaigns") if isinstance(result, dict) else []
    return {"campaigns": campaigns or [], "count": int(result.get("total_items") or len(campaigns or []))}


async def read_meta_ads_insights(
    settings: Settings,
    *,
    account: UserIntegrationAccount,
    payload: MetaAdsInsightsRequest,
    http_client_cls=httpx.AsyncClient,
) -> dict[str, Any]:
    access_token = get_external_access_token(settings, account=account, integration_label="Meta Ads")
    ad_account_id = payload.ad_account_id
    if not ad_account_id.startswith("act_"):
        ad_account_id = f"act_{ad_account_id}"
    async with http_client_cls(timeout=20) as client:
        response = await client.get(
            f"https://graph.facebook.com/{settings.meta_graph_version}/{ad_account_id}/insights",
            params={
                "access_token": access_token,
                "fields": "campaign_name,spend,impressions,clicks,cpc,ctr",
                "date_preset": payload.date_preset,
                "level": payload.level,
                "limit": payload.limit,
            },
            headers={"Accept": "application/json"},
        )
        if response.status_code >= 400:
            raise ValueError(f"Meta Ads insights failed with status {response.status_code}")
        result = response.json()
    account.last_used_at = utc_now()
    rows = result.get("data") if isinstance(result, dict) else []
    return {"rows": rows or []}
