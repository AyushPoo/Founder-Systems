from __future__ import annotations

import json
from typing import Any
from urllib.parse import urlparse

from fastapi import Body, Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import httpx
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from .agents import AGENT_PASS_DURATION_DAYS, get_agent_shared_wallet_credits, is_agent_product_slug
from .config import Settings, get_settings
from .cost_guard import (
    block_user_access,
    cost_guard_events,
    cost_guard_summary,
    cost_guard_users,
    ensure_default_ai_model_policies,
    finalize_ai_usage,
    release_ai_usage,
    reserve_ai_usage,
    unblock_user_access,
    update_model_policy,
)
from .db import Base, engine, get_db
from .integrations import (
    build_external_authorization_url,
    build_external_integration_state,
    build_google_integration_state,
    create_github_issue,
    create_google_calendar_event,
    create_google_doc,
    create_google_sheet,
    create_hubspot_contact,
    decode_external_integration_state,
    decode_google_gmail_state,
    exchange_external_code_for_tokens,
    exchange_google_code_for_tokens,
    external_integration_credentials,
    fetch_external_profile,
    fetch_google_profile,
    get_external_integration_scopes,
    get_google_integration_scopes,
    get_user_integration_account,
    get_user_google_account,
    get_user_gmail_account,
    integration_to_response,
    list_mailchimp_campaigns,
    list_razorpay_payments,
    query_google_search_console,
    read_meta_ads_insights,
    resolve_action_user,
    run_google_analytics_report,
    send_gmail_message,
    upsert_external_integration_account,
    upsert_google_integration_account,
)
from .mailer import send_magic_link_email
from .models import (
    AgentWorkspace,
    AiModelPolicy,
    CreditLedger,
    CreditLedgerEntry,
    CreditWallet,
    Entitlement,
    Price,
    Product,
    ProductUsageEvent,
    Purchase,
    PurchaseItem,
    TelegramLink,
    User,
    UserIntegrationAccount,
    Workspace,
    WorkspaceMember,
    WorkspaceMemoryItem,
    WorkspaceProductPreference,
)
from .payments import create_razorpay_order, verify_razorpay_signature
from .schemas import (
    AccessResponse,
    AgentAccountStatusResponse,
    AgentRuntimeAccessCheckRequest,
    AgentRuntimeMemoryContextRequest,
    AgentRuntimeMemoryFactsRequest,
    AiModelPolicyPatchRequest,
    AiModelPolicyResponse,
    AiUsageFinalizeRequest,
    AiUsageGuardResponse,
    AiUsageReleaseRequest,
    AiUsageReserveRequest,
    CheckoutOrderRequest,
    CheckoutOrderResponse,
    CreditLedgerEntryResponse,
    CreditBalanceResponse,
    CreditPackCheckoutRequest,
    CreditPackCheckoutResponse,
    CreditPackResponse,
    PublicCreditMilestoneResponse,
    CreditUnlockResponse,
    CreditWalletEnvelope,
    CreditWalletLedgerEnvelope,
    CreditWalletResponse,
    ClientCheckoutConfirmRequest,
    CreditConsumeRequest,
    CreditPurchaseRequest,
    CostGuardEventResponse,
    CostGuardSummaryResponse,
    CostGuardUserRow,
    EntitlementResponse,
    GmailSendRequest,
    GmailSendResponse,
    GithubIssueCreateRequest,
    GithubIssueCreateResponse,
    GoogleAnalyticsRunReportRequest,
    GoogleCalendarEventCreateRequest,
    GoogleCalendarEventCreateResponse,
    GoogleDocCreateRequest,
    GoogleDocCreateResponse,
    GoogleRowsResponse,
    GoogleSearchConsoleQueryRequest,
    GoogleSheetCreateRequest,
    GoogleSheetCreateResponse,
    HubSpotContactCreateRequest,
    HubSpotContactCreateResponse,
    IntegrationAccountResponse,
    IntegrationStatusEnvelope,
    MagicLinkStartRequest,
    MagicLinkStartResponse,
    MagicLinkVerifyRequest,
    MailchimpCampaignsListRequest,
    MailchimpCampaignsListResponse,
    MetaAdsInsightsRequest,
    MetaAdsInsightsResponse,
    PriceResponse,
    ProductProjectRequest,
    ProductProjectResponse,
    ProductUsageSpendRequest,
    ProductStatusResponse,
    PurchaseItemResponse,
    PurchaseResponse,
    RazorpayPaymentsListRequest,
    RazorpayPaymentsListResponse,
    RazorpayWebhookAck,
    SessionResponse,
    TelegramLinkStartRequest,
    TelegramLinkStartResponse,
    TelegramLinkVerifyRequest,
    TelegramLinkVerifyResponse,
    UserAccessBlockRequest,
    UserResponse,
    WorkspaceBootstrapResponse,
    WorkspaceMemberResponse,
    WorkspaceMemoryItemCreateRequest,
    WorkspaceMemoryItemResponse,
    WorkspaceMemoryItemUpdateRequest,
    WorkspaceMemoryListResponse,
    WorkspaceMemoryPromoteRequest,
    WorkspaceProductPreferenceRequest,
    WorkspaceProductPreferenceResponse,
    WorkspaceRecommendationResponse,
    WorkspaceRecommendationsEnvelope,
    WorkspaceResponse,
)
from .security import build_session_token, decode_session_token, new_magic_token, utc_now
from .services import (
    CREDIT_PACKS,
    PROMPTDECK_SLUG,
    TelegramLinkConflictError,
    build_agent_account_status,
    build_agent_runtime_access_state,
    consume_magic_link,
    create_magic_link,
    ensure_seed_data,
    get_credit_pack,
    grant_product_purchase,
    get_or_create_credit_wallet,
    get_or_create_workspace,
    get_credit_balance,
    get_public_credit_milestone_total,
    get_product_credit_price,
    grant_product_pass,
    grant_shared_wallet_credits,
    get_or_create_user,
    get_wallet_pending_usage_units,
    grant_promptdeck_purchase,
    grant_credit_pack_purchase,
    issue_telegram_link_token,
    is_admin_email,
    enforce_request_window,
    promote_workspace_memory_item,
    record_product_project,
    record_wallet_entry,
    recommend_products_for_workspace,
    resolve_usage_credit_cost,
    save_webhook_event,
    selected_products_from_item,
    unlock_product_with_wallet_credits,
    update_workspace_memory_item,
    update_workspace_product_preference,
    user_has_promptdeck_admin_bypass,
    verify_telegram_link_token,
    create_workspace_memory_item,
    consume_wallet_credits,
    get_credit_unit_amount_minor,
    quote_wallet_credit_checkout,
    WALLET_CREDIT_UNIT_AMOUNTS_MINOR,
)
from .telegram import build_agent_bot_deep_link, build_agent_bot_url, get_agent_bot_username


def user_to_schema(user: User) -> UserResponse:
    return UserResponse.model_validate(
        {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at,
            "last_seen_at": user.last_seen_at,
            "is_admin": is_admin_email(settings, user.email),
        }
    )


def entitlement_to_schema(entitlement: Entitlement) -> EntitlementResponse:
    return EntitlementResponse.model_validate(
        {
            "id": entitlement.id,
            "product_slug": entitlement.product_slug,
            "status": entitlement.status,
            "starts_at": entitlement.starts_at,
            "ends_at": entitlement.ends_at,
            "metadata": entitlement.metadata_json or {},
        }
    )


def admin_bypass_payload(user: User | None) -> dict[str, bool]:
    return {"promptdeck": user_has_promptdeck_admin_bypass(settings, user)}


def session_to_schema(user: User | None) -> SessionResponse:
    is_admin = is_admin_email(settings, user.email) if user else False
    return SessionResponse(
        authenticated=user is not None,
        user=user_to_schema(user) if user else None,
        is_admin=is_admin,
        admin_bypass=admin_bypass_payload(user),
    )


def purchase_to_schema(purchase: Purchase) -> PurchaseResponse:
    return PurchaseResponse.model_validate(
        {
            "id": purchase.id,
            "razorpay_order_id": purchase.razorpay_order_id,
            "razorpay_payment_id": purchase.razorpay_payment_id,
            "status": purchase.status,
            "currency": purchase.currency,
            "amount_minor": purchase.amount_minor,
            "metadata": purchase.metadata_json or {},
            "created_at": purchase.created_at,
            "updated_at": purchase.updated_at,
            "items": [
                PurchaseItemResponse.model_validate(
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "price_id": item.price_id,
                        "quantity": item.quantity,
                        "product_slug": (item.product.slug if item.product else None) or (item.metadata_json or {}).get("product_slug") or (purchase.metadata_json or {}).get("product_slug"),
                        "product_name": (item.product.name if item.product else None) or (item.metadata_json or {}).get("product_name"),
                        "metadata": item.metadata_json or {},
                    }
                )
                for item in purchase.items
            ],
        }
    )


def workspace_to_schema(workspace: Workspace) -> WorkspaceResponse:
    return WorkspaceResponse.model_validate(
        {
            "id": workspace.id,
            "slug": workspace.slug,
            "name": workspace.name,
            "status": workspace.status,
            "metadata": workspace.metadata_json or {},
            "created_at": workspace.created_at,
            "updated_at": workspace.updated_at,
        }
    )


def workspace_member_to_schema(member: WorkspaceMember) -> WorkspaceMemberResponse:
    return WorkspaceMemberResponse.model_validate(
        {
            "id": member.id,
            "workspace_id": member.workspace_id,
            "user_id": member.user_id,
            "role": member.role,
            "status": member.status,
            "created_at": member.created_at,
        }
    )


def workspace_memory_to_schema(item: WorkspaceMemoryItem) -> WorkspaceMemoryItemResponse:
    return WorkspaceMemoryItemResponse.model_validate(
        {
            "id": item.id,
            "workspace_id": item.workspace_id,
            "memory_scope": item.memory_scope,
            "type": item.type,
            "label": item.label,
            "value_json": item.value_json or {},
            "summary_text": item.summary_text,
            "source_product": item.source_product,
            "source_session_id": item.source_session_id,
            "updated_by": item.updated_by,
            "confidence": item.confidence,
            "status": item.status,
            "visibility": item.visibility,
            "selected_products": selected_products_from_item(item),
            "editable": item.editable,
            "last_used_at": item.last_used_at,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
    )


def workspace_preference_to_schema(preference: WorkspaceProductPreference) -> WorkspaceProductPreferenceResponse:
    return WorkspaceProductPreferenceResponse.model_validate(
        {
            "id": preference.id,
            "workspace_id": preference.workspace_id,
            "product_slug": preference.product_slug,
            "import_mode": preference.import_mode,
            "allow_product_read": preference.allow_product_read,
            "allow_product_write": preference.allow_product_write,
            "allow_inferred_suggestions": preference.allow_inferred_suggestions,
            "allow_save_to_workspace": preference.allow_save_to_workspace,
            "start_fresh_by_default": preference.start_fresh_by_default,
            "created_at": preference.created_at,
            "updated_at": preference.updated_at,
        }
    )


def credit_wallet_to_schema(wallet: CreditWallet) -> CreditWalletResponse:
    return CreditWalletResponse.model_validate(
        {
            "id": wallet.id,
            "workspace_id": wallet.workspace_id,
            "user_id": wallet.user_id,
            "currency_unit": wallet.currency_unit,
            "balance": wallet.balance,
            "created_at": wallet.created_at,
            "updated_at": wallet.updated_at,
        }
    )


def credit_ledger_entry_to_schema(entry: CreditLedgerEntry) -> CreditLedgerEntryResponse:
    return CreditLedgerEntryResponse.model_validate(
        {
            "id": entry.id,
            "wallet_id": entry.wallet_id,
            "workspace_id": entry.workspace_id,
            "user_id": entry.user_id,
            "delta": entry.delta,
            "reason": entry.reason,
            "product_slug": entry.product_slug,
            "purchase_id": entry.purchase_id,
            "usage_event_id": entry.usage_event_id,
            "metadata": entry.metadata_json or {},
            "created_at": entry.created_at,
        }
    )


def ai_model_policy_to_schema(policy: AiModelPolicy) -> AiModelPolicyResponse:
    return AiModelPolicyResponse.model_validate(
        {
            "id": policy.id,
            "provider": policy.provider,
            "model_id": policy.model_id,
            "status": policy.status,
            "max_input_chars": policy.max_input_chars,
            "max_output_tokens": policy.max_output_tokens,
            "daily_global_limit": policy.daily_global_limit,
            "cost_per_1k_input_minor": policy.cost_per_1k_input_minor,
            "cost_per_1k_output_minor": policy.cost_per_1k_output_minor,
            "metadata": policy.metadata_json or {},
            "created_at": policy.created_at,
            "updated_at": policy.updated_at,
        }
    )


settings = get_settings()
settings.validate_production_settings()
app = FastAPI(
    title=settings.app_name,
    docs_url=None if settings.env == "production" else "/docs",
    openapi_url=None if settings.env == "production" else "/openapi.json",
    redoc_url=None if settings.env == "production" else "/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    return response


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with Session(bind=engine) as db:
        ensure_seed_data(db, settings)
        ensure_default_ai_model_policies(db, settings)


def _set_session_cookie(response: Response, token: str, *, remember_me: bool = False) -> None:
    max_age = settings.session_max_age_seconds if remember_me else settings.session_short_max_age_seconds
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        domain=settings.session_cookie_domain,
        max_age=max_age,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        domain=settings.session_cookie_domain,
        path="/",
    )


def _read_session_token(request: Request) -> str | None:
    cookie_token = request.cookies.get(settings.session_cookie_name)
    if cookie_token:
        return cookie_token
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip() or None
    return None


def _safe_return_url(candidate: str | None) -> str:
    fallback = f"{settings.site_app_url.rstrip('/')}/account"
    if not candidate:
        return fallback
    cleaned = candidate.strip()
    parsed = urlparse(cleaned)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return fallback

    def _origin(url: str) -> tuple[str, str, int | None]:
        base = urlparse(url)
        return base.scheme, (base.hostname or "").lower(), base.port

    allowed_origins = {
        _origin(settings.site_app_url),
        _origin(settings.account_app_url),
        _origin(settings.promptdeck_app_url),
    }
    if _origin(cleaned) in allowed_origins:
        return cleaned
    return fallback


def _sign_in_redirect_url(error_code: str, next_url: str | None = None) -> str:
    sign_in_target = f"{settings.site_app_url.rstrip('/')}/sign-in?error={error_code}"
    safe_next = _safe_return_url(next_url)
    if safe_next.startswith(settings.site_app_url.rstrip("/")):
        relative_next = safe_next.removeprefix(settings.site_app_url.rstrip("/")) or "/account"
        separator = "&" if "?" in sign_in_target else "?"
        sign_in_target = f"{sign_in_target}{separator}returnTo={relative_next}"
    return sign_in_target


def _append_url_params(url: str, params: dict[str, str]) -> str:
    return str(httpx.URL(url).copy_merge_params(params))


def _build_google_state(next_url: str | None, remember_me: bool) -> str:
    now = utc_now()
    token = jwt.encode(
        {
            "iss": settings.session_issuer,
            "aud": "google-oauth-state",
            "next": _safe_return_url(next_url),
            "remember": bool(remember_me),
            "iat": int(now.timestamp()),
            "exp": int((now.replace(microsecond=0)).timestamp()) + (60 * 20),
        },
        settings.session_secret,
        algorithm="HS256",
    )
    return token if isinstance(token, str) else str(token)


def _decode_google_state(state_token: str) -> dict[str, Any]:
    payload = jwt.decode(
        state_token,
        settings.session_secret,
        algorithms=["HS256"],
        issuer=settings.session_issuer,
        audience="google-oauth-state",
    )
    return payload if isinstance(payload, dict) else {}


async def _complete_google_gmail_integration(
    *,
    code: str | None,
    error: str | None,
    state_payload: dict[str, Any],
    db: Session,
) -> Response:
    integration_slug = str(state_payload.get("integration_slug") or "gmail").strip()
    next_url = _safe_return_url(str(state_payload.get("next") or f"{settings.site_app_url.rstrip('/')}/account?tab=connections"))
    user_id = str(state_payload.get("sub") or "").strip()
    if get_google_integration_scopes(integration_slug) is None:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": "google-unsupported"}),
            status_code=303,
        )
    user = db.get(User, user_id)
    if user is None or error or not code:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": f"{integration_slug}-failed"}),
            status_code=303,
        )
    if not settings.google_client_id or not settings.google_client_secret:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": f"{integration_slug}-unavailable"}),
            status_code=303,
        )

    redirect_uri = f"{settings.public_api_url.rstrip('/')}/auth/google/callback"
    try:
        token_payload = await exchange_google_code_for_tokens(
            settings,
            code=code,
            redirect_uri=redirect_uri,
            http_client_cls=httpx.AsyncClient,
        )
        access_token = str(token_payload.get("access_token") or "").strip()
        if not access_token:
            raise ValueError("Missing Google access token")
        profile = await fetch_google_profile(access_token, http_client_cls=httpx.AsyncClient)
        if not profile.get("email_verified"):
            return RedirectResponse(
                url=_append_url_params(next_url, {"integration": f"{integration_slug}-unverified"}),
                status_code=303,
            )
        upsert_google_integration_account(
            db,
            settings,
            user=user,
            integration_slug=integration_slug,
            token_payload=token_payload,
            profile=profile,
        )
        db.commit()
    except Exception:
        db.rollback()
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": f"{integration_slug}-failed"}),
            status_code=303,
        )

    return RedirectResponse(
        url=_append_url_params(next_url, {"integration": f"{integration_slug}-connected"}),
        status_code=303,
    )


async def _complete_external_integration(
    *,
    code: str | None,
    error: str | None,
    state_payload: dict[str, Any],
    db: Session,
) -> Response:
    integration_slug = str(state_payload.get("integration_slug") or "").strip()
    next_url = _safe_return_url(str(state_payload.get("next") or f"{settings.site_app_url.rstrip('/')}/account?tab=connections"))
    user_id = str(state_payload.get("sub") or "").strip()
    if get_external_integration_scopes(integration_slug) is None:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": "external-unsupported"}),
            status_code=303,
        )
    user = db.get(User, user_id)
    if user is None or error or not code:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": f"{integration_slug}-failed"}),
            status_code=303,
        )
    client_id, client_secret = external_integration_credentials(settings, integration_slug)
    if not client_id or not client_secret:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": f"{integration_slug}-unavailable"}),
            status_code=303,
        )

    redirect_uri = f"{settings.public_api_url.rstrip('/')}/integrations/oauth/callback"
    try:
        token_payload = await exchange_external_code_for_tokens(
            settings,
            integration_slug=integration_slug,
            code=code,
            redirect_uri=redirect_uri,
            http_client_cls=httpx.AsyncClient,
        )
        access_token = str(token_payload.get("access_token") or "").strip()
        if not access_token:
            raise ValueError("Missing external access token")
        profile = await fetch_external_profile(
            integration_slug,
            access_token,
            settings=settings,
            http_client_cls=httpx.AsyncClient,
        )
        upsert_external_integration_account(
            db,
            settings,
            user=user,
            integration_slug=integration_slug,
            token_payload=token_payload,
            profile=profile,
        )
        db.commit()
    except Exception:
        db.rollback()
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": f"{integration_slug}-failed"}),
            status_code=303,
        )

    return RedirectResponse(
        url=_append_url_params(next_url, {"integration": f"{integration_slug}-connected"}),
        status_code=303,
    )


def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = _read_session_token(request)
    if not token:
        return None
    try:
        payload = decode_session_token(settings, token)
    except Exception:
        return None
    user_id = str(payload.get("sub") or "").strip()
    if not user_id:
        return None
    return db.get(User, user_id)


def require_current_user(user: User | None = Depends(get_optional_current_user)) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def require_admin_or_internal(
    request: Request,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    user: User | None = Depends(get_optional_current_user),
) -> User | None:
    if x_api_key and settings.api_key_internal and x_api_key == settings.api_key_internal:
        return user
    if user is not None and is_admin_email(settings, user.email):
        return user
    raise HTTPException(status_code=403, detail="Forbidden")


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": settings.app_name, "env": settings.env}


@app.get("/public/credits/milestone", response_model=PublicCreditMilestoneResponse)
def public_credit_milestone(db: Session = Depends(get_db)) -> PublicCreditMilestoneResponse:
    return PublicCreditMilestoneResponse(
        current_credits=get_public_credit_milestone_total(db),
        goal_credits=10000,
    )


def _request_client_identifier(request: Request) -> str:
    forwarded_for = str(request.headers.get("x-forwarded-for") or "").strip()
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return str(request.client.host).strip()
    return "unknown"


@app.post("/auth/magic-link/start", response_model=MagicLinkStartResponse)
async def auth_magic_link_start(
    payload: MagicLinkStartRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MagicLinkStartResponse:
    normalized_email = str(payload.email or "").strip().lower()
    client_key = _request_client_identifier(request)
    try:
        enforce_request_window(
            db,
            key=f"magic-link:email:{normalized_email}",
            limit=3,
            window_seconds=15 * 60,
        )
        enforce_request_window(
            db,
            key=f"magic-link:ip:{client_key}",
            limit=10,
            window_seconds=15 * 60,
        )
    except ValueError as error:
        raise HTTPException(status_code=429, detail=str(error)) from error

    user = get_or_create_user(db, email=payload.email, name=payload.name)
    raw_token = new_magic_token()
    link = create_magic_link(db, user_id=user.id, token=raw_token, settings=settings, next_url=payload.next_url)
    magic_link_url = f"{settings.public_api_url.rstrip('/')}/auth/magic-link/verify?token={raw_token}"
    if link.next_url:
        separator = "&" if "?" in magic_link_url else "?"
        magic_link_url = f"{magic_link_url}{separator}next={link.next_url}"
    if payload.remember_me:
        separator = "&" if "?" in magic_link_url else "?"
        magic_link_url = f"{magic_link_url}{separator}remember=1"
    await send_magic_link_email(settings, to_email=user.email, magic_link_url=magic_link_url)
    return MagicLinkStartResponse(
        message="Magic link sent",
        magic_link_url=magic_link_url if settings.env != "production" else None,
    )


@app.post("/auth/magic-link/verify", response_model=SessionResponse)
def auth_magic_link_verify(
    payload: MagicLinkVerifyRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> SessionResponse:
    user, _link = consume_magic_link(db, token=payload.token)
    if user is None:
        raise HTTPException(status_code=400, detail="Magic link is invalid or expired")
    session_token = build_session_token(settings, user.id, user.email)
    _set_session_cookie(response, session_token, remember_me=payload.remember_me)
    return session_to_schema(user)


@app.get("/auth/google/start")
def auth_google_start(
    next: str | None = Query(default=None),
    remember: int | None = Query(default=None),
) -> Response:
    if not settings.google_client_id or not settings.google_client_secret:
        return RedirectResponse(
            url=_sign_in_redirect_url("google-auth-unavailable", next),
            status_code=303,
        )

    redirect_uri = f"{settings.public_api_url.rstrip('/')}/auth/google/callback"
    state = _build_google_state(next, bool(remember))
    google_url = httpx.URL("https://accounts.google.com/o/oauth2/v2/auth").copy_merge_params(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "online",
            "include_granted_scopes": "true",
            "prompt": "select_account",
            "state": state,
        }
    )
    return RedirectResponse(url=str(google_url), status_code=303)


@app.get("/auth/magic-link/verify")
def auth_magic_link_verify_redirect(
    token: str,
    next: str | None = None,
    remember: int | None = None,
    db: Session = Depends(get_db),
) -> Response:
    user, link = consume_magic_link(db, token=token)
    if user is None:
        sign_in_target = f"{settings.site_app_url.rstrip('/')}/sign-in?error=magic-link-expired"
        if next and next.startswith(settings.site_app_url):
            separator = "&" if "?" in sign_in_target else "?"
            sign_in_target = f"{sign_in_target}{separator}returnTo={next.removeprefix(settings.site_app_url.rstrip('/'))}"
        return RedirectResponse(url=sign_in_target, status_code=303)
    redirect_target = next or link.next_url or settings.site_app_url
    response = RedirectResponse(url=redirect_target, status_code=303)
    session_token = build_session_token(settings, user.id, user.email)
    _set_session_cookie(response, session_token, remember_me=bool(remember))
    return response


@app.get("/auth/google/callback")
async def auth_google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: Session = Depends(get_db),
) -> Response:
    next_url: str | None = None
    remember_me = False

    if state:
        try:
            integration_state_payload = decode_google_gmail_state(settings, state)
            return await _complete_google_gmail_integration(
                code=code,
                error=error,
                state_payload=integration_state_payload,
                db=db,
            )
        except Exception:
            pass
        try:
            state_payload = _decode_google_state(state)
            next_url = state_payload.get("next")
            remember_me = bool(state_payload.get("remember"))
        except Exception:
            return RedirectResponse(
                url=_sign_in_redirect_url("google-auth-expired"),
                status_code=303,
            )

    if error or not code:
        return RedirectResponse(
            url=_sign_in_redirect_url("google-auth-failed", next_url),
            status_code=303,
        )

    if not settings.google_client_id or not settings.google_client_secret:
        return RedirectResponse(
            url=_sign_in_redirect_url("google-auth-unavailable", next_url),
            status_code=303,
        )

    redirect_uri = f"{settings.public_api_url.rstrip('/')}/auth/google/callback"

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            token_response = await client.post(
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
            token_response.raise_for_status()
            token_payload = token_response.json()
            access_token = str(token_payload.get("access_token") or "").strip()
            if not access_token:
                raise ValueError("Missing Google access token")

            profile_response = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                },
            )
            profile_response.raise_for_status()
            profile = profile_response.json()
    except Exception:
        return RedirectResponse(
            url=_sign_in_redirect_url("google-auth-failed", next_url),
            status_code=303,
        )

    email = str(profile.get("email") or "").strip().lower()
    name = str(profile.get("name") or "").strip() or None
    email_verified = bool(profile.get("email_verified"))

    if not email or not email_verified:
        return RedirectResponse(
            url=_sign_in_redirect_url("google-email-unverified", next_url),
            status_code=303,
        )

    user = get_or_create_user(db, email=email, name=name)
    session_token = build_session_token(settings, user.id, user.email)
    response = RedirectResponse(url=_safe_return_url(next_url), status_code=303)
    _set_session_cookie(response, session_token, remember_me=remember_me)
    return response


@app.get("/integrations/google/{integration_slug}/start")
@app.get("/v1/integrations/google/{integration_slug}/start")
@app.get("/integrations/google/gmail/start")
@app.get("/v1/integrations/google/gmail/start")
def google_integration_start(
    integration_slug: str = "gmail",
    next: str | None = Query(default=None),
    user: User = Depends(require_current_user),
) -> Response:
    scopes = get_google_integration_scopes(integration_slug)
    safe_next = _safe_return_url(next or f"{settings.site_app_url.rstrip('/')}/account?tab=connections")
    if scopes is None:
        raise HTTPException(status_code=404, detail="Unsupported Google integration")
    if not settings.google_client_id or not settings.google_client_secret:
        return RedirectResponse(
            url=_append_url_params(safe_next, {"integration": f"{integration_slug}-unavailable"}),
            status_code=303,
        )
    redirect_uri = f"{settings.public_api_url.rstrip('/')}/auth/google/callback"
    state = build_google_integration_state(
        settings,
        user_id=user.id,
        next_url=safe_next,
        integration_slug=integration_slug,
    )
    google_url = httpx.URL("https://accounts.google.com/o/oauth2/v2/auth").copy_merge_params(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(scopes),
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "consent",
            "state": state,
        }
    )
    return RedirectResponse(url=str(google_url), status_code=303)


@app.get("/integrations/google/gmail/callback")
@app.get("/v1/integrations/google/gmail/callback")
async def google_gmail_integration_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
) -> Response:
    next_url = f"{settings.site_app_url.rstrip('/')}/account?tab=settings"
    try:
        state_payload = decode_google_gmail_state(settings, state or "")
        next_url = _safe_return_url(str(state_payload.get("next") or next_url))
        user_id = str(state_payload.get("sub") or "").strip()
    except Exception:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": "gmail-expired"}),
            status_code=303,
        )

    user = db.get(User, user_id)
    if user is None or error or not code:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": "gmail-failed"}),
            status_code=303,
        )
    if not settings.google_client_id or not settings.google_client_secret:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": "gmail-unavailable"}),
            status_code=303,
        )

    return await _complete_google_gmail_integration(
        code=code,
        error=error,
        state_payload={"sub": user.id, "next": next_url},
        db=db,
    )


@app.get("/integrations/{integration_slug}/start")
@app.get("/v1/integrations/{integration_slug}/start")
def external_integration_start(
    integration_slug: str,
    next: str | None = Query(default=None),
    user: User = Depends(require_current_user),
) -> Response:
    safe_next = _safe_return_url(next or f"{settings.site_app_url.rstrip('/')}/account?tab=connections")
    if get_external_integration_scopes(integration_slug) is None:
        raise HTTPException(status_code=404, detail="Unsupported integration")
    client_id, client_secret = external_integration_credentials(settings, integration_slug)
    if not client_id or not client_secret:
        return RedirectResponse(
            url=_append_url_params(safe_next, {"integration": f"{integration_slug}-unavailable"}),
            status_code=303,
        )
    redirect_uri = f"{settings.public_api_url.rstrip('/')}/integrations/oauth/callback"
    state = build_external_integration_state(
        settings,
        user_id=user.id,
        next_url=safe_next,
        integration_slug=integration_slug,
    )
    return RedirectResponse(
        url=build_external_authorization_url(
            settings,
            integration_slug=integration_slug,
            redirect_uri=redirect_uri,
            state=state,
        ),
        status_code=303,
    )


@app.get("/integrations/oauth/callback")
@app.get("/v1/integrations/oauth/callback")
async def external_integration_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
) -> Response:
    next_url = f"{settings.site_app_url.rstrip('/')}/account?tab=connections"
    try:
        state_payload = decode_external_integration_state(settings, state or "")
        next_url = _safe_return_url(str(state_payload.get("next") or next_url))
    except Exception:
        return RedirectResponse(
            url=_append_url_params(next_url, {"integration": "external-expired"}),
            status_code=303,
        )
    return await _complete_external_integration(
        code=code,
        error=error,
        state_payload=state_payload,
        db=db,
    )


@app.get("/integrations", response_model=IntegrationStatusEnvelope)
@app.get("/v1/integrations", response_model=IntegrationStatusEnvelope)
def integration_status(
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> IntegrationStatusEnvelope:
    accounts = db.scalars(
        select(UserIntegrationAccount).where(
            UserIntegrationAccount.user_id == user.id,
        )
    ).all()
    integrations = [integration_to_response(account) for account in accounts]
    if settings.razorpay_key_id and settings.razorpay_key_secret:
        integrations.append(
            IntegrationAccountResponse(
                provider="razorpay",
                integration_slug="razorpay",
                status="connected",
                display_name="Founder Systems Razorpay",
                scopes=["payments:read", "settlements:read"],
                can_send=False,
            )
        )
    return IntegrationStatusEnvelope(integrations=integrations)


@app.post("/internal/runtime/actions/email/send", response_model=GmailSendResponse)
@app.post("/v1/internal/runtime/actions/email/send", response_model=GmailSendResponse)
async def internal_runtime_email_send(
    payload: GmailSendRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> GmailSendResponse:
    user = resolve_action_user(
        db,
        product_slug=payload.product_slug,
        user_id=payload.user_id,
        telegram_user_id=payload.telegram_user_id,
    )
    if user is None:
        raise HTTPException(status_code=404, detail="Action user not found")

    reserve_payload = AiUsageReserveRequest(
        product_slug=payload.product_slug,
        action="gmail_send",
        reference_id=payload.reference_id,
        credits=settings.gmail_send_credit_cost,
        provider="google",
        model_id="gmail.send",
        user_id=user.id,
        telegram_user_id=payload.telegram_user_id,
        estimated_input_chars=len(payload.body_text) + len(payload.subject),
        estimated_output_tokens=0,
        metadata={
            **(payload.metadata or {}),
            "channel": "gmail",
            "approval_text": payload.approval_text,
            "recipient_count": len(payload.to) + len(payload.cc) + len(payload.bcc),
        },
    )
    guard = reserve_ai_usage(db, settings, payload=reserve_payload, authorized_user=authorized)
    if not guard.ok:
        raise HTTPException(status_code=403, detail=guard.reason or "Action denied")

    account = get_user_gmail_account(db, user_id=user.id)
    if account is None:
        release_ai_usage(
            db,
            payload=AiUsageReleaseRequest(
                reference_id=payload.reference_id,
                reason="gmail_not_connected",
                metadata={"channel": "gmail"},
            ),
        )
        raise HTTPException(status_code=403, detail="Connect Gmail in Founder Systems before sending email.")

    try:
        sent = await send_gmail_message(
            db,
            settings,
            account=account,
            payload=payload,
            http_client_cls=httpx.AsyncClient,
        )
        final = finalize_ai_usage(
            db,
            payload=AiUsageFinalizeRequest(
                reference_id=payload.reference_id,
                credits=settings.gmail_send_credit_cost,
                metadata={
                    "channel": "gmail",
                    "provider_message_id": sent.get("id"),
                    "thread_id": sent.get("threadId"),
                },
            ),
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        error_detail = str(exc)[:240]
        release_ai_usage(
            db,
            payload=AiUsageReleaseRequest(
                reference_id=payload.reference_id,
                reason="gmail_send_failed",
                metadata={"channel": "gmail", "error": error_detail},
            ),
        )
        raise HTTPException(status_code=502, detail=f"Gmail send failed: {error_detail}") from exc

    return GmailSendResponse(
        ok=True,
        provider_message_id=str(sent.get("id") or "") or None,
        thread_id=str(sent.get("threadId") or "") or None,
        credits_spent=final.credits,
        from_email=account.account_email,
    )


def _resolve_internal_action_user_or_404(db: Session, payload: Any) -> User:
    user = resolve_action_user(
        db,
        product_slug=payload.product_slug,
        user_id=payload.user_id,
        telegram_user_id=payload.telegram_user_id,
    )
    if user is None:
        raise HTTPException(status_code=404, detail="Action user not found")
    return user


def _reserve_internal_connector_action(
    db: Session,
    settings: Settings,
    *,
    payload: Any,
    user: User,
    authorized: User | None,
    action: str,
    provider: str,
    model_id: str,
    credits: int = 1,
    estimated_input_chars: int = 0,
    metadata: dict[str, Any] | None = None,
) -> AiUsageGuardResponse:
    guard = reserve_ai_usage(
        db,
        settings,
        payload=AiUsageReserveRequest(
            product_slug=payload.product_slug,
            action=action,
            reference_id=payload.reference_id,
            credits=credits,
            provider=provider,
            model_id=model_id,
            user_id=user.id,
            telegram_user_id=payload.telegram_user_id,
            estimated_input_chars=estimated_input_chars,
            estimated_output_tokens=0,
            metadata={**(payload.metadata or {}), **(metadata or {})},
        ),
        authorized_user=authorized,
    )
    if not guard.ok:
        raise HTTPException(status_code=403, detail=guard.reason or "Action denied")
    return guard


def _release_internal_connector_action(db: Session, *, payload: Any, reason: str, metadata: dict[str, Any] | None = None) -> None:
    release_ai_usage(
        db,
        payload=AiUsageReleaseRequest(
            reference_id=payload.reference_id,
            reason=reason,
            metadata=metadata or {},
        ),
    )


def _finalize_internal_connector_action(db: Session, *, payload: Any, credits: int, metadata: dict[str, Any] | None = None) -> AiUsageGuardResponse:
    return finalize_ai_usage(
        db,
        payload=AiUsageFinalizeRequest(
            reference_id=payload.reference_id,
            credits=credits,
            metadata=metadata or {},
        ),
    )


@app.post("/internal/runtime/actions/google/docs/create", response_model=GoogleDocCreateResponse)
@app.post("/v1/internal/runtime/actions/google/docs/create", response_model=GoogleDocCreateResponse)
async def internal_runtime_google_docs_create(
    payload: GoogleDocCreateRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> GoogleDocCreateResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="google_docs_create",
        provider="google",
        model_id="docs.create",
        credits=credits,
        estimated_input_chars=len(payload.title) + len(payload.body_text),
        metadata={"approval_text": payload.approval_text, "integration_slug": "google-docs"},
    )
    account = get_user_google_account(db, user_id=user.id, integration_slug="google-docs")
    if account is None:
        _release_internal_connector_action(db, payload=payload, reason="google_docs_not_connected", metadata={"integration_slug": "google-docs"})
        raise HTTPException(status_code=403, detail="Connect Google Docs in Founder Systems before creating documents.")
    try:
        result = await create_google_doc(db, settings, account=account, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(
            db,
            payload=payload,
            credits=credits,
            metadata={"integration_slug": "google-docs", **result},
        )
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="google_docs_create_failed", metadata={"integration_slug": "google-docs", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="Google Docs action failed. Please try again.") from exc
    return GoogleDocCreateResponse(ok=True, credits_spent=final.credits, **result)


@app.post("/internal/runtime/actions/google/sheets/create", response_model=GoogleSheetCreateResponse)
@app.post("/v1/internal/runtime/actions/google/sheets/create", response_model=GoogleSheetCreateResponse)
async def internal_runtime_google_sheets_create(
    payload: GoogleSheetCreateRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> GoogleSheetCreateResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="google_sheets_create",
        provider="google",
        model_id="sheets.create",
        credits=credits,
        estimated_input_chars=len(payload.title) + len(str(payload.values)),
        metadata={"approval_text": payload.approval_text, "integration_slug": "google-sheets"},
    )
    account = get_user_google_account(db, user_id=user.id, integration_slug="google-sheets")
    if account is None:
        _release_internal_connector_action(db, payload=payload, reason="google_sheets_not_connected", metadata={"integration_slug": "google-sheets"})
        raise HTTPException(status_code=403, detail="Connect Google Sheets in Founder Systems before creating spreadsheets.")
    try:
        result = await create_google_sheet(db, settings, account=account, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(
            db,
            payload=payload,
            credits=credits,
            metadata={"integration_slug": "google-sheets", **result},
        )
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="google_sheets_create_failed", metadata={"integration_slug": "google-sheets", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="Google Sheets action failed. Please try again.") from exc
    return GoogleSheetCreateResponse(ok=True, credits_spent=final.credits, **result)


@app.post("/internal/runtime/actions/google/calendar/events/create", response_model=GoogleCalendarEventCreateResponse)
@app.post("/v1/internal/runtime/actions/google/calendar/events/create", response_model=GoogleCalendarEventCreateResponse)
async def internal_runtime_google_calendar_event_create(
    payload: GoogleCalendarEventCreateRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> GoogleCalendarEventCreateResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="google_calendar_event_create",
        provider="google",
        model_id="calendar.events.create",
        credits=credits,
        estimated_input_chars=len(payload.summary) + len(payload.description or ""),
        metadata={"approval_text": payload.approval_text, "integration_slug": "google-calendar"},
    )
    account = get_user_google_account(db, user_id=user.id, integration_slug="google-calendar")
    if account is None:
        _release_internal_connector_action(db, payload=payload, reason="google_calendar_not_connected", metadata={"integration_slug": "google-calendar"})
        raise HTTPException(status_code=403, detail="Connect Google Calendar in Founder Systems before creating events.")
    try:
        result = await create_google_calendar_event(db, settings, account=account, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(
            db,
            payload=payload,
            credits=credits,
            metadata={"integration_slug": "google-calendar", **result},
        )
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="google_calendar_create_failed", metadata={"integration_slug": "google-calendar", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="Google Calendar action failed. Please try again.") from exc
    return GoogleCalendarEventCreateResponse(ok=True, credits_spent=final.credits, **result)


@app.post("/internal/runtime/actions/google/search-console/query", response_model=GoogleRowsResponse)
@app.post("/v1/internal/runtime/actions/google/search-console/query", response_model=GoogleRowsResponse)
async def internal_runtime_google_search_console_query(
    payload: GoogleSearchConsoleQueryRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> GoogleRowsResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="google_search_console_query",
        provider="google",
        model_id="search-console.query",
        credits=credits,
        estimated_input_chars=len(payload.site_url) + len(",".join(payload.dimensions)),
        metadata={"integration_slug": "google-search-console", "site_url": payload.site_url},
    )
    account = get_user_google_account(db, user_id=user.id, integration_slug="google-search-console")
    if account is None:
        _release_internal_connector_action(db, payload=payload, reason="google_search_console_not_connected", metadata={"integration_slug": "google-search-console"})
        raise HTTPException(status_code=403, detail="Connect Google Search Console in Founder Systems before reading search data.")
    try:
        result = await query_google_search_console(db, settings, account=account, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(
            db,
            payload=payload,
            credits=credits,
            metadata={"integration_slug": "google-search-console", "row_count": len(result.get("rows") or [])},
        )
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="google_search_console_query_failed", metadata={"integration_slug": "google-search-console", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="Google Search Console action failed. Please try again.") from exc
    return GoogleRowsResponse(ok=True, integration_slug="google-search-console", rows=result.get("rows") or [], credits_spent=final.credits)


@app.post("/internal/runtime/actions/google/analytics/run-report", response_model=GoogleRowsResponse)
@app.post("/v1/internal/runtime/actions/google/analytics/run-report", response_model=GoogleRowsResponse)
async def internal_runtime_google_analytics_run_report(
    payload: GoogleAnalyticsRunReportRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> GoogleRowsResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="google_analytics_run_report",
        provider="google",
        model_id="analytics.run-report",
        credits=credits,
        estimated_input_chars=len(payload.property_id) + len(",".join(payload.metrics)) + len(",".join(payload.dimensions)),
        metadata={"integration_slug": "google-analytics-4", "property_id": payload.property_id},
    )
    account = get_user_google_account(db, user_id=user.id, integration_slug="google-analytics-4")
    if account is None:
        _release_internal_connector_action(db, payload=payload, reason="google_analytics_not_connected", metadata={"integration_slug": "google-analytics-4"})
        raise HTTPException(status_code=403, detail="Connect Google Analytics in Founder Systems before reading analytics data.")
    try:
        result = await run_google_analytics_report(db, settings, account=account, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(
            db,
            payload=payload,
            credits=credits,
            metadata={"integration_slug": "google-analytics-4", "row_count": len(result.get("rows") or [])},
        )
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="google_analytics_report_failed", metadata={"integration_slug": "google-analytics-4", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="Google Analytics action failed. Please try again.") from exc
    return GoogleRowsResponse(ok=True, integration_slug="google-analytics-4", rows=result.get("rows") or [], credits_spent=final.credits)


@app.post("/internal/runtime/actions/razorpay/payments/list", response_model=RazorpayPaymentsListResponse)
@app.post("/v1/internal/runtime/actions/razorpay/payments/list", response_model=RazorpayPaymentsListResponse)
async def internal_runtime_razorpay_payments_list(
    payload: RazorpayPaymentsListRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> RazorpayPaymentsListResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="razorpay_payments_list",
        provider="razorpay",
        model_id="payments.list",
        credits=credits,
        estimated_input_chars=0,
        metadata={"integration_slug": "razorpay"},
    )
    try:
        result = await list_razorpay_payments(settings, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(
            db,
            payload=payload,
            credits=credits,
            metadata={"integration_slug": "razorpay", "count": result.get("count")},
        )
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="razorpay_payments_list_failed", metadata={"integration_slug": "razorpay", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="Razorpay action failed. Please try again.") from exc
    return RazorpayPaymentsListResponse(ok=True, items=result.get("items") or [], count=int(result.get("count") or 0), credits_spent=final.credits)


def _require_connected_external_account(db: Session, *, user: User, integration_slug: str, label: str, payload: Any) -> UserIntegrationAccount:
    account = get_user_integration_account(db, user_id=user.id, integration_slug=integration_slug)
    if account is None:
        _release_internal_connector_action(
            db,
            payload=payload,
            reason=f"{integration_slug}_not_connected",
            metadata={"integration_slug": integration_slug},
        )
        raise HTTPException(status_code=403, detail=f"Connect {label} in Founder Systems before using this action.")
    return account


@app.post("/internal/runtime/actions/github/issues/create", response_model=GithubIssueCreateResponse)
@app.post("/v1/internal/runtime/actions/github/issues/create", response_model=GithubIssueCreateResponse)
async def internal_runtime_github_issue_create(
    payload: GithubIssueCreateRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> GithubIssueCreateResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="github_issue_create",
        provider="github",
        model_id="issues.create",
        credits=credits,
        estimated_input_chars=len(payload.repo) + len(payload.title) + len(payload.body_text),
        metadata={"approval_text": payload.approval_text, "integration_slug": "github"},
    )
    account = _require_connected_external_account(db, user=user, integration_slug="github", label="GitHub", payload=payload)
    try:
        result = await create_github_issue(settings, account=account, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(
            db,
            payload=payload,
            credits=credits,
            metadata={"integration_slug": "github", **result},
        )
        db.commit()
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="github_issue_create_failed", metadata={"integration_slug": "github", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="GitHub action failed. Please try again.") from exc
    return GithubIssueCreateResponse(ok=True, credits_spent=final.credits, **result)


@app.post("/internal/runtime/actions/hubspot/contacts/create", response_model=HubSpotContactCreateResponse)
@app.post("/v1/internal/runtime/actions/hubspot/contacts/create", response_model=HubSpotContactCreateResponse)
async def internal_runtime_hubspot_contact_create(
    payload: HubSpotContactCreateRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> HubSpotContactCreateResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="hubspot_contact_create",
        provider="hubspot",
        model_id="contacts.create",
        credits=credits,
        estimated_input_chars=len(str(payload.email)) + len(payload.first_name or "") + len(payload.last_name or ""),
        metadata={"approval_text": payload.approval_text, "integration_slug": "hubspot"},
    )
    account = _require_connected_external_account(db, user=user, integration_slug="hubspot", label="HubSpot", payload=payload)
    try:
        result = await create_hubspot_contact(settings, account=account, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(db, payload=payload, credits=credits, metadata={"integration_slug": "hubspot", **result})
        db.commit()
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="hubspot_contact_create_failed", metadata={"integration_slug": "hubspot", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="HubSpot action failed. Please try again.") from exc
    return HubSpotContactCreateResponse(ok=True, credits_spent=final.credits, **result)


@app.post("/internal/runtime/actions/mailchimp/campaigns/list", response_model=MailchimpCampaignsListResponse)
@app.post("/v1/internal/runtime/actions/mailchimp/campaigns/list", response_model=MailchimpCampaignsListResponse)
async def internal_runtime_mailchimp_campaigns_list(
    payload: MailchimpCampaignsListRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> MailchimpCampaignsListResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="mailchimp_campaigns_list",
        provider="mailchimp",
        model_id="campaigns.list",
        credits=credits,
        metadata={"integration_slug": "mailchimp"},
    )
    account = _require_connected_external_account(db, user=user, integration_slug="mailchimp", label="Mailchimp", payload=payload)
    try:
        result = await list_mailchimp_campaigns(settings, account=account, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(db, payload=payload, credits=credits, metadata={"integration_slug": "mailchimp", "count": result.get("count")})
        db.commit()
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="mailchimp_campaigns_list_failed", metadata={"integration_slug": "mailchimp", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="Mailchimp action failed. Please try again.") from exc
    return MailchimpCampaignsListResponse(ok=True, campaigns=result.get("campaigns") or [], count=int(result.get("count") or 0), credits_spent=final.credits)


@app.post("/internal/runtime/actions/meta-ads/insights/read", response_model=MetaAdsInsightsResponse)
@app.post("/v1/internal/runtime/actions/meta-ads/insights/read", response_model=MetaAdsInsightsResponse)
async def internal_runtime_meta_ads_insights_read(
    payload: MetaAdsInsightsRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> MetaAdsInsightsResponse:
    user = _resolve_internal_action_user_or_404(db, payload)
    credits = settings.ai_guard_default_credit_cost
    _reserve_internal_connector_action(
        db,
        settings,
        payload=payload,
        user=user,
        authorized=authorized,
        action="meta_ads_insights_read",
        provider="meta",
        model_id="ads.insights",
        credits=credits,
        estimated_input_chars=len(payload.ad_account_id),
        metadata={"integration_slug": "meta-ads", "ad_account_id": payload.ad_account_id},
    )
    account = _require_connected_external_account(db, user=user, integration_slug="meta-ads", label="Meta Ads", payload=payload)
    try:
        result = await read_meta_ads_insights(settings, account=account, payload=payload, http_client_cls=httpx.AsyncClient)
        final = _finalize_internal_connector_action(db, payload=payload, credits=credits, metadata={"integration_slug": "meta-ads", "row_count": len(result.get("rows") or [])})
        db.commit()
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        _release_internal_connector_action(db, payload=payload, reason="meta_ads_insights_failed", metadata={"integration_slug": "meta-ads", "error": str(exc)[:240]})
        raise HTTPException(status_code=502, detail="Meta Ads action failed. Please try again.") from exc
    return MetaAdsInsightsResponse(ok=True, rows=result.get("rows") or [], credits_spent=final.credits)


@app.post("/auth/logout", response_model=SessionResponse)
def auth_logout(response: Response) -> SessionResponse:
    _clear_session_cookie(response)
    return session_to_schema(None)


@app.get("/me", response_model=SessionResponse)
def me(user: User | None = Depends(get_optional_current_user)) -> SessionResponse:
    return session_to_schema(user)


@app.get("/auth/session")
@app.get("/v1/auth/session")
@app.get("/session")
def auth_session(user: User | None = Depends(get_optional_current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    admin_bypass = admin_bypass_payload(user)
    session_snapshot = session_to_schema(user).model_dump(mode="json")

    if user is None:
        return {
            "authenticated": False,
            "session": {
                "authenticated": False,
                "user": None,
                "entitlements": [],
                "is_admin": False,
                "admin_bypass": admin_bypass,
            },
            "user": None,
            "entitlements": [],
            "is_admin": False,
            "admin_bypass": admin_bypass,
        }

    entitlements = db.scalars(select(Entitlement).where(Entitlement.user_id == user.id)).all()
    serialized = [entitlement_to_schema(item).model_dump(mode="json") for item in entitlements]
    return {
        "authenticated": True,
        "session": {
            **session_snapshot,
            "entitlements": serialized,
        },
        "user": user_to_schema(user).model_dump(mode="json"),
        "entitlements": serialized,
        "is_admin": session_snapshot["is_admin"],
        "admin_bypass": admin_bypass,
    }


@app.get("/sign-in")
@app.get("/v1/sign-in")
def sign_in_redirect(returnTo: str | None = None) -> Response:
    destination = f"{settings.site_app_url.rstrip('/')}/sign-in"
    if returnTo:
        destination = f"{destination}?returnTo={returnTo}"
    return RedirectResponse(url=destination, status_code=303)


@app.get("/entitlements", response_model=list[EntitlementResponse])
def entitlements(user: User = Depends(require_current_user), db: Session = Depends(get_db)) -> list[EntitlementResponse]:
    rows = db.scalars(select(Entitlement).where(Entitlement.user_id == user.id)).all()
    return [entitlement_to_schema(row) for row in rows]


@app.get("/purchases", response_model=list[PurchaseResponse])
def purchases(user: User = Depends(require_current_user), db: Session = Depends(get_db)) -> list[PurchaseResponse]:
    rows = db.scalars(
        select(Purchase).where(Purchase.user_id == user.id).order_by(Purchase.created_at.desc())
    ).all()
    return [purchase_to_schema(row) for row in rows]


@app.get("/workspace", response_model=WorkspaceBootstrapResponse)
def workspace_bootstrap(user: User = Depends(require_current_user), db: Session = Depends(get_db)) -> WorkspaceBootstrapResponse:
    workspace, membership = get_or_create_workspace(db, user=user)
    return WorkspaceBootstrapResponse(
        workspace=workspace_to_schema(workspace),
        membership=workspace_member_to_schema(membership),
    )


@app.get("/workspace/memory", response_model=WorkspaceMemoryListResponse)
def list_workspace_memory(
    include_archived: int | None = Query(default=None),
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceMemoryListResponse:
    workspace, _membership = get_or_create_workspace(db, user=user)
    query = select(WorkspaceMemoryItem).where(WorkspaceMemoryItem.workspace_id == workspace.id)
    if not include_archived:
        query = query.where(WorkspaceMemoryItem.status != "archived")
    items = db.scalars(query.order_by(WorkspaceMemoryItem.updated_at.desc())).all()
    return WorkspaceMemoryListResponse(items=[workspace_memory_to_schema(item) for item in items])


@app.post("/workspace/memory", response_model=WorkspaceMemoryItemResponse)
def create_workspace_memory(
    payload: WorkspaceMemoryItemCreateRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceMemoryItemResponse:
    workspace, _membership = get_or_create_workspace(db, user=user)
    item = create_workspace_memory_item(
        db,
        workspace_id=workspace.id,
        user_id=user.id,
        memory_scope=payload.memory_scope,
        type=payload.type,
        label=payload.label,
        value_json=payload.value_json,
        summary_text=payload.summary_text,
        source_product=payload.source_product,
        source_session_id=payload.source_session_id,
        confidence=payload.confidence,
        visibility=payload.visibility,
        selected_products=payload.selected_products,
        editable=payload.editable,
    )
    return workspace_memory_to_schema(item)


@app.patch("/workspace/memory/{item_id}", response_model=WorkspaceMemoryItemResponse)
def patch_workspace_memory(
    item_id: str,
    payload: WorkspaceMemoryItemUpdateRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceMemoryItemResponse:
    workspace, _membership = get_or_create_workspace(db, user=user)
    item = db.get(WorkspaceMemoryItem, item_id)
    if item is None or item.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Memory item not found")
    updated = update_workspace_memory_item(
        db,
        item=item,
        user_id=user.id,
        updates=payload.model_dump(exclude_unset=True),
    )
    return workspace_memory_to_schema(updated)


@app.post("/workspace/memory/{item_id}/promote", response_model=WorkspaceMemoryItemResponse)
def promote_workspace_memory(
    item_id: str,
    payload: WorkspaceMemoryPromoteRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceMemoryItemResponse:
    workspace, _membership = get_or_create_workspace(db, user=user)
    item = db.get(WorkspaceMemoryItem, item_id)
    if item is None or item.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Memory item not found")
    updated = promote_workspace_memory_item(
        db,
        item=item,
        user_id=user.id,
        updates=payload.model_dump(exclude_unset=True),
    )
    return workspace_memory_to_schema(updated)


@app.get("/workspace/preferences", response_model=list[WorkspaceProductPreferenceResponse])
def list_workspace_preferences(
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> list[WorkspaceProductPreferenceResponse]:
    workspace, _membership = get_or_create_workspace(db, user=user)
    preferences = db.scalars(
        select(WorkspaceProductPreference)
        .where(WorkspaceProductPreference.workspace_id == workspace.id)
        .order_by(WorkspaceProductPreference.product_slug.asc())
    ).all()
    return [workspace_preference_to_schema(item) for item in preferences]


@app.get("/workspace/preferences/{product_slug}", response_model=WorkspaceProductPreferenceResponse)
def get_workspace_preference(
    product_slug: str,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceProductPreferenceResponse:
    workspace, _membership = get_or_create_workspace(db, user=user)
    preference = update_workspace_product_preference(
        db,
        workspace_id=workspace.id,
        product_slug=product_slug,
        updates={},
    )
    return workspace_preference_to_schema(preference)


@app.put("/workspace/preferences/{product_slug}", response_model=WorkspaceProductPreferenceResponse)
def put_workspace_preference(
    product_slug: str,
    payload: WorkspaceProductPreferenceRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceProductPreferenceResponse:
    workspace, _membership = get_or_create_workspace(db, user=user)
    preference = update_workspace_product_preference(
        db,
        workspace_id=workspace.id,
        product_slug=product_slug,
        updates=payload.model_dump(exclude_unset=True),
    )
    return workspace_preference_to_schema(preference)


@app.get("/workspace/recommendations", response_model=WorkspaceRecommendationsEnvelope)
def workspace_recommendations(
    product_slug: str,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceRecommendationsEnvelope:
    workspace, _membership = get_or_create_workspace(db, user=user)
    recommendations = recommend_products_for_workspace(
        db,
        workspace_id=workspace.id,
        current_product_slug=product_slug,
    )
    return WorkspaceRecommendationsEnvelope(
        workspace_id=workspace.id,
        recommendations=[
            WorkspaceRecommendationResponse.model_validate(item)
            for item in recommendations
        ],
    )


@app.get("/wallet", response_model=CreditWalletEnvelope)
def wallet_summary(user: User = Depends(require_current_user), db: Session = Depends(get_db)) -> CreditWalletEnvelope:
    workspace, _membership = get_or_create_workspace(db, user=user)
    wallet = get_or_create_credit_wallet(db, workspace_id=workspace.id, user_id=user.id)
    db.commit()
    db.refresh(wallet)
    packs = [
        CreditPackResponse.model_validate(
            {
                "slug": pack["slug"],
                "name": pack["name"],
                "amount_minor": int((pack.get("prices_minor") or {}).get("INR") or 0),
                "currency": "INR",
                "credits": int(pack["credits"]),
                "bonus_credits": int(pack.get("bonus_credits") or 0),
                "price_options_minor": pack.get("prices_minor") or {},
            }
        )
        for pack in CREDIT_PACKS.values()
    ]
    return CreditWalletEnvelope(
        wallet=credit_wallet_to_schema(wallet),
        packs=packs,
        credit_unit_amounts_minor={currency: int(amount) for currency, amount in WALLET_CREDIT_UNIT_AMOUNTS_MINOR.items()},
        usage_units_per_credit=max(1, int(settings.wallet_usage_units_per_credit or 1)),
        pending_usage_units=get_wallet_pending_usage_units(db, wallet_id=wallet.id),
    )


@app.get("/wallet/ledger", response_model=CreditWalletLedgerEnvelope)
def wallet_ledger(user: User = Depends(require_current_user), db: Session = Depends(get_db)) -> CreditWalletLedgerEnvelope:
    workspace, _membership = get_or_create_workspace(db, user=user)
    wallet = get_or_create_credit_wallet(db, workspace_id=workspace.id, user_id=user.id)
    entries = db.scalars(
        select(CreditLedgerEntry)
        .where(CreditLedgerEntry.wallet_id == wallet.id)
        .order_by(CreditLedgerEntry.created_at.desc())
    ).all()
    return CreditWalletLedgerEnvelope(entries=[credit_ledger_entry_to_schema(entry) for entry in entries])


@app.get("/wallet/usage-events", response_model=list[dict[str, Any]])
def wallet_usage_events(user: User = Depends(require_current_user), db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    workspace, _membership = get_or_create_workspace(db, user=user)
    events = db.scalars(
        select(ProductUsageEvent)
        .where(ProductUsageEvent.workspace_id == workspace.id)
        .order_by(ProductUsageEvent.created_at.desc())
    ).all()
    return [
        {
            "id": event.id,
            "product_slug": event.product_slug,
            "action": event.action,
            "credits_spent": event.credits_spent,
            "metadata": event.metadata_json or {},
            "created_at": event.created_at,
        }
        for event in events
    ]


@app.post("/wallet/packs/checkout", response_model=CreditPackCheckoutResponse)
async def wallet_pack_checkout(
    payload: CreditPackCheckoutRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> CreditPackCheckoutResponse:
    workspace, _membership = get_or_create_workspace(db, user=user)
    try:
        quote = quote_wallet_credit_checkout(
            currency=payload.currency,
            pack_slug=payload.pack_slug,
            credits=payload.credits,
        )
    except ValueError as error:
        detail = str(error)
        status_code = 404 if detail == "Credit pack not found" else 400
        raise HTTPException(status_code=status_code, detail=detail) from error

    purchase = Purchase(
        user_id=user.id,
        status="pending",
        currency=quote["currency"],
        amount_minor=int(quote["amount_minor"]),
        metadata_json={
            "kind": "credit_pack",
            "pack_slug": quote["pack_slug"],
            "pack_name": quote["pack_name"],
            "credits_granted": int(quote["credits_granted"]),
            "currency": quote["currency"],
            "workspace_id": workspace.id,
        },
    )
    db.add(purchase)
    db.flush()

    order = await create_razorpay_order(
        settings,
        amount_minor=int(quote["amount_minor"]),
        currency=quote["currency"],
        receipt=purchase.id,
        notes={
            "purchase_id": purchase.id,
            "user_id": user.id,
            "workspace_id": workspace.id,
            "pack_slug": quote["pack_slug"],
            "kind": "credit_pack",
            "credits_granted": int(quote["credits_granted"]),
        },
    )
    purchase.razorpay_order_id = str(order.get("id"))
    purchase.metadata_json = {**(purchase.metadata_json or {}), "order": order}
    db.commit()
    db.refresh(purchase)
    return CreditPackCheckoutResponse(
        purchase_id=purchase.id,
        razorpay_order_id=purchase.razorpay_order_id or "",
        key_id=settings.razorpay_key_id or "rzp_mock",
        amount_minor=int(quote["amount_minor"]),
        currency=quote["currency"],
        pack_slug=quote["pack_slug"],
        pack_name=quote["pack_name"],
        credits_granted=int(quote["credits_granted"]),
        unit_amount_minor=get_credit_unit_amount_minor(quote["currency"]),
    )


@app.post("/products/{product_slug}/unlock-with-credits", response_model=CreditUnlockResponse)
def unlock_product_with_credits(
    product_slug: str,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> CreditUnlockResponse:
    workspace, _membership = get_or_create_workspace(db, user=user)
    product = db.scalar(select(Product).where(Product.slug == product_slug))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if get_product_credit_price(product) <= 0:
        raise HTTPException(status_code=400, detail="Product is not eligible for credit unlock")
    try:
        entitlement, wallet = unlock_product_with_wallet_credits(
            db,
            purchase=None,
            workspace_id=workspace.id,
            user_id=user.id,
            product=product,
        )
    except ValueError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return CreditUnlockResponse(
        entitlement=entitlement_to_schema(entitlement),
        wallet=credit_wallet_to_schema(wallet),
    )


@app.post("/products/{product_slug}/usage-spend", response_model=CreditWalletResponse)
def product_usage_spend(
    product_slug: str,
    payload: ProductUsageSpendRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> CreditWalletResponse:
    workspace, _membership = get_or_create_workspace(db, user=user)
    try:
        credits = resolve_usage_credit_cost(product_slug, payload.action)
        wallet, _usage_event = consume_wallet_credits(
            db,
            workspace_id=workspace.id,
            user_id=user.id,
            product_slug=product_slug,
            action=payload.action,
            credits=credits,
            metadata=payload.metadata,
        )
    except ValueError as error:
        detail = str(error)
        status_code = 400 if detail == "Product usage policy is not configured" else 403
        raise HTTPException(status_code=status_code, detail=detail) from error
    return credit_wallet_to_schema(wallet)


@app.get("/account/agent-status", response_model=AgentAccountStatusResponse)
def account_agent_status(
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> AgentAccountStatusResponse:
    return build_agent_account_status(db, user_id=user.id)


@app.get("/agents/diagnostics", response_model=AgentAccountStatusResponse)
@app.get("/v1/agents/diagnostics", response_model=AgentAccountStatusResponse)
def agent_diagnostics(
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> AgentAccountStatusResponse:
    return build_agent_account_status(db, user_id=user.id)


@app.get("/agents/runtime/access")
@app.get("/v1/agents/runtime/access")
def agent_runtime_access(
    product_slug: str = Query(..., min_length=1),
    telegram_user_id: str = Query(..., min_length=1),
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        return build_agent_runtime_access_state(
            db,
            product_slug=product_slug,
            telegram_user_id=telegram_user_id,
        )
    except ValueError as exc:
        detail = str(exc)
        raise HTTPException(status_code=404 if detail == "Unsupported agent product" else 400, detail=detail) from exc


@app.post("/internal/runtime/access-check")
@app.post("/v1/internal/runtime/access-check")
def internal_runtime_access_check(
    payload: AgentRuntimeAccessCheckRequest,
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        return build_agent_runtime_access_state(
            db,
            product_slug=payload.product_slug,
            telegram_user_id=payload.telegram_user_id,
        )
    except ValueError as exc:
        detail = str(exc)
        raise HTTPException(status_code=404 if detail == "Unsupported agent product" else 400, detail=detail) from exc


def _resolve_runtime_workspace(
    db: Session,
    *,
    product_slug: str,
    telegram_user_id: str,
) -> tuple[User, Workspace]:
    normalized_slug = str(product_slug or "").strip()
    normalized_telegram_user_id = str(telegram_user_id or "").strip()
    if not normalized_slug or not normalized_telegram_user_id:
        raise HTTPException(status_code=400, detail="product_slug and telegram_user_id are required")
    link = db.scalar(
        select(TelegramLink).where(
            TelegramLink.product_slug == normalized_slug,
            TelegramLink.telegram_user_id == normalized_telegram_user_id,
            TelegramLink.status == "linked",
        )
    )
    if link is None:
        raise HTTPException(status_code=404, detail="Linked Telegram account was not found")
    user = db.get(User, link.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Linked Founder Systems user was not found")
    workspace, _membership = get_or_create_workspace(db, user=user)
    return user, workspace


def _runtime_profile_facts_from_item(item: WorkspaceMemoryItem | None) -> dict[str, str]:
    if item is None or not isinstance(item.value_json, dict):
        return {}
    facts = item.value_json.get("facts", {})
    if not isinstance(facts, dict):
        return {}
    return {str(key): str(value) for key, value in facts.items() if str(value).strip()}


def _runtime_account_facts(user: User) -> dict[str, str]:
    facts: dict[str, str] = {}
    name = str(user.name or "").strip()
    email = str(user.email or "").strip()
    if name:
        facts["name"] = name
    if email:
        facts["account_email"] = email
    return facts


def _runtime_memory_profile_item(
    db: Session,
    *,
    workspace_id: str,
) -> WorkspaceMemoryItem | None:
    return db.scalar(
        select(WorkspaceMemoryItem).where(
            WorkspaceMemoryItem.workspace_id == workspace_id,
            WorkspaceMemoryItem.type == "telegram_profile",
            WorkspaceMemoryItem.status == "active",
        )
    )


@app.post("/internal/runtime/memory/context")
@app.post("/v1/internal/runtime/memory/context")
def internal_runtime_memory_context(
    payload: AgentRuntimeMemoryContextRequest,
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user, workspace = _resolve_runtime_workspace(
        db,
        product_slug=payload.product_slug,
        telegram_user_id=payload.telegram_user_id,
    )
    items = db.scalars(
        select(WorkspaceMemoryItem)
        .where(
            WorkspaceMemoryItem.workspace_id == workspace.id,
            WorkspaceMemoryItem.status == "active",
        )
        .order_by(WorkspaceMemoryItem.updated_at.desc())
        .limit(12)
    ).all()
    profile = next((item for item in items if item.type == "telegram_profile"), None)
    facts = {**_runtime_account_facts(user), **_runtime_profile_facts_from_item(profile)}
    return {
        "workspace_id": workspace.id,
        "facts": facts,
        "items": [workspace_memory_to_schema(item).model_dump(mode="json") for item in items],
    }


@app.post("/internal/runtime/memory/facts")
@app.post("/v1/internal/runtime/memory/facts")
def internal_runtime_memory_facts(
    payload: AgentRuntimeMemoryFactsRequest,
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    user, workspace = _resolve_runtime_workspace(
        db,
        product_slug=payload.product_slug,
        telegram_user_id=payload.telegram_user_id,
    )
    clean_facts = {
        str(key).strip(): str(value).strip()
        for key, value in (payload.facts or {}).items()
        if str(key).strip() and str(value).strip()
    }
    item = _runtime_memory_profile_item(db, workspace_id=workspace.id)
    existing_facts = _runtime_profile_facts_from_item(item)
    merged_facts = {**existing_facts, **clean_facts}
    summary = ", ".join(f"{key}: {value}" for key, value in sorted(merged_facts.items()))
    if item is None:
        item = create_workspace_memory_item(
            db,
            workspace_id=workspace.id,
            user_id=user.id,
            memory_scope="canonical",
            type="telegram_profile",
            label="Telegram profile",
            value_json={"facts": merged_facts},
            summary_text=summary,
            source_product=payload.product_slug,
            source_session_id=f"telegram:{payload.telegram_user_id}",
            confidence="confirmed",
            visibility="workspace_shared",
            selected_products=["marketing-agent", "finance-agent", "ops-agent"],
            editable=True,
        )
    else:
        item.value_json = {"facts": merged_facts}
        item.summary_text = summary
        item.memory_scope = "canonical"
        item.source_product = payload.product_slug
        item.source_session_id = f"telegram:{payload.telegram_user_id}"
        item.confidence = "confirmed"
        item.visibility = "workspace_shared"
        item.updated_by = user.id
        item.selected_products_json = {"items": ["marketing-agent", "finance-agent", "ops-agent"]}
        item.updated_at = utc_now()
        db.add(item)
        db.commit()
        db.refresh(item)
    return {
        "workspace_id": workspace.id,
        "facts": merged_facts,
        "item": workspace_memory_to_schema(item).model_dump(mode="json"),
    }


@app.post("/internal/runtime/actions/reserve", response_model=AiUsageGuardResponse)
@app.post("/v1/internal/runtime/actions/reserve", response_model=AiUsageGuardResponse)
def internal_runtime_action_reserve(
    payload: AiUsageReserveRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> AiUsageGuardResponse:
    return reserve_ai_usage(db, settings, payload=payload, authorized_user=authorized)


@app.post("/internal/runtime/actions/finalize", response_model=AiUsageGuardResponse)
@app.post("/v1/internal/runtime/actions/finalize", response_model=AiUsageGuardResponse)
def internal_runtime_action_finalize(
    payload: AiUsageFinalizeRequest,
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> AiUsageGuardResponse:
    try:
        return finalize_ai_usage(db, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@app.post("/internal/runtime/actions/release", response_model=AiUsageGuardResponse)
@app.post("/v1/internal/runtime/actions/release", response_model=AiUsageGuardResponse)
def internal_runtime_action_release(
    payload: AiUsageReleaseRequest,
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> AiUsageGuardResponse:
    return release_ai_usage(db, payload=payload)


@app.get("/v1/admin/cost-guard/summary", response_model=CostGuardSummaryResponse)
@app.get("/analytics/cost-guard/summary", response_model=CostGuardSummaryResponse)
def admin_cost_guard_summary(
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> CostGuardSummaryResponse:
    ensure_default_ai_model_policies(db, settings)
    return cost_guard_summary(db)


@app.get("/v1/admin/cost-guard/users", response_model=list[CostGuardUserRow])
@app.get("/analytics/cost-guard/users", response_model=list[CostGuardUserRow])
def admin_cost_guard_users(
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> list[CostGuardUserRow]:
    return cost_guard_users(db)


@app.get("/v1/admin/cost-guard/events", response_model=list[CostGuardEventResponse])
@app.get("/analytics/cost-guard/events", response_model=list[CostGuardEventResponse])
def admin_cost_guard_events(
    limit: int = Query(default=100, ge=1, le=500),
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> list[CostGuardEventResponse]:
    return cost_guard_events(db, limit=limit)


@app.get("/v1/admin/cost-guard/models", response_model=list[AiModelPolicyResponse])
@app.get("/analytics/cost-guard/models", response_model=list[AiModelPolicyResponse])
def admin_cost_guard_models(
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> list[AiModelPolicyResponse]:
    ensure_default_ai_model_policies(db, settings)
    policies = db.scalars(select(AiModelPolicy).order_by(AiModelPolicy.provider, AiModelPolicy.model_id)).all()
    return [ai_model_policy_to_schema(policy) for policy in policies]


@app.post("/v1/admin/cost-guard/users/{user_id}/block")
@app.post("/analytics/cost-guard/users/{user_id}/block")
def admin_block_cost_guard_user(
    user_id: str,
    payload: UserAccessBlockRequest,
    authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    block = block_user_access(
        db,
        user_id=user_id,
        reason=payload.reason,
        created_by_user_id=authorized.id if authorized else None,
        metadata=payload.metadata,
    )
    return {"ok": True, "user_id": user_id, "status": block.status, "reason": block.reason}


@app.post("/v1/admin/cost-guard/users/{user_id}/unblock")
@app.post("/analytics/cost-guard/users/{user_id}/unblock")
def admin_unblock_cost_guard_user(
    user_id: str,
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    return {"ok": True, "user_id": user_id, "changed": unblock_user_access(db, user_id=user_id)}


@app.patch("/v1/admin/cost-guard/models/{policy_id}", response_model=AiModelPolicyResponse)
@app.patch("/analytics/cost-guard/models/{policy_id}", response_model=AiModelPolicyResponse)
def admin_update_cost_guard_model(
    policy_id: str,
    payload: AiModelPolicyPatchRequest,
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> AiModelPolicyResponse:
    policy = update_model_policy(db, policy_id=policy_id, payload=payload)
    if policy is None:
        raise HTTPException(status_code=404, detail="Model policy not found")
    return ai_model_policy_to_schema(policy)


@app.post("/agents/telegram/link/start", response_model=TelegramLinkStartResponse)
@app.post("/v1/agents/telegram/link/start", response_model=TelegramLinkStartResponse)
def telegram_link_start(
    payload: TelegramLinkStartRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> TelegramLinkStartResponse:
    product_slug = str(payload.product_slug or "").strip()
    bot_username = get_agent_bot_username(product_slug)
    bot_url = build_agent_bot_url(product_slug)
    if bot_username is None or bot_url is None:
        raise HTTPException(status_code=503, detail="Telegram bot is not configured for this product yet")

    try:
        _link, token, expires_in_seconds = issue_telegram_link_token(
            db,
            user_id=user.id,
            product_slug=product_slug,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    deep_link_url = build_agent_bot_deep_link(product_slug, token)
    if deep_link_url is None:
        raise HTTPException(status_code=503, detail="Telegram bot is not configured for this product yet")
    return TelegramLinkStartResponse(
        product_slug=product_slug,
        bot_username=bot_username,
        bot_url=bot_url,
        deep_link_url=deep_link_url,
        token=token,
        expires_in_seconds=expires_in_seconds,
    )


@app.post("/agents/telegram/link/verify", response_model=TelegramLinkVerifyResponse)
@app.post("/v1/agents/telegram/link/verify", response_model=TelegramLinkVerifyResponse)
def telegram_link_verify(
    payload: TelegramLinkVerifyRequest,
    _authorized: User | None = Depends(require_admin_or_internal),
    db: Session = Depends(get_db),
) -> TelegramLinkVerifyResponse:
    try:
        link = verify_telegram_link_token(
            db,
            token=payload.token,
            telegram_user_id=payload.telegram_user_id,
            telegram_chat_id=payload.telegram_chat_id,
            telegram_username=payload.telegram_username,
        )
    except TelegramLinkConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return TelegramLinkVerifyResponse(
        product_slug=link.product_slug,
        linked=True,
        status=link.status,
        bot_username=get_agent_bot_username(link.product_slug),
        telegram_username=link.telegram_username,
        linked_at=link.linked_at,
    )


@app.get("/entitlements/{product_slug}", response_model=EntitlementResponse)
def entitlement_for_product(
    product_slug: str,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> EntitlementResponse:
    entitlement = db.scalar(
        select(Entitlement).where(
            Entitlement.user_id == user.id,
            Entitlement.product_slug == product_slug,
        )
    )
    if entitlement is None:
        raise HTTPException(status_code=404, detail="Entitlement not found")
    return entitlement_to_schema(entitlement)


@app.get("/products/promptdeck-ai/access-summary", response_model=AccessResponse)
def promptdeck_access(
    user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> AccessResponse:
    admin_bypass = user_has_promptdeck_admin_bypass(settings, user)

    if user is None:
        return AccessResponse(
            logged_in=False,
            entitled=False,
            product_slug=PROMPTDECK_SLUG,
            credits_remaining=0,
            entitlement=None,
            launch_url=settings.promptdeck_app_url,
            admin_bypass=False,
        )

    entitlement = db.scalar(
        select(Entitlement).where(
            Entitlement.user_id == user.id,
            Entitlement.product_slug == PROMPTDECK_SLUG,
            Entitlement.status == "active",
        )
    )
    credits_remaining = get_credit_balance(db, user_id=user.id, product_slug=PROMPTDECK_SLUG)
    return AccessResponse(
        logged_in=True,
        entitled=admin_bypass or entitlement is not None,
        product_slug=PROMPTDECK_SLUG,
        credits_remaining=credits_remaining,
        entitlement=entitlement_to_schema(entitlement) if entitlement else None,
        launch_url=settings.promptdeck_app_url,
        admin_bypass=admin_bypass,
    )


@app.get("/products/promptdeck-ai/access-state")
def promptdeck_access_state(
    capability: str | None = None,
    user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    access = promptdeck_access(user=user, db=db)
    admin_bypass = access.admin_bypass
    missing_credits = capability == "generate" and access.entitled and access.credits_remaining <= 0 and not admin_bypass
    state = (
        "allowed"
        if access.entitled and not missing_credits
        else "login_required"
        if not access.logged_in
        else "paywall"
    )
    message = (
        "Admin bypass active for PromptDeck."
        if admin_bypass
        else
        "Founder Systems access confirmed for PromptDeck."
        if state == "allowed"
        else "Sign in with your Founder Systems account before you use PromptDeck."
        if state == "login_required"
        else "Your PromptDeck launch access is active, but you need more generation credits before you create another first-pass deck."
        if missing_credits
        else "PromptDeck requires an active Founder Systems purchase before you can continue."
    )
    paywall = None
    if state != "allowed":
        paywall = {
            "title": "Sign in required" if state == "login_required" else "Refill PromptDeck credits" if missing_credits else "Unlock PromptDeck",
            "message": message,
            "ctaLabel": "Sign in" if state == "login_required" else "Buy more credits" if missing_credits else "Buy PromptDeck AI",
            "ctaUrl": f"{settings.site_app_url.rstrip('/')}/sign-in?returnTo=/products/promptdeck-ai"
            if state == "login_required"
            else f"{settings.site_app_url.rstrip('/')}/products/promptdeck-ai",
        }

    entitlements = [access.entitlement.model_dump(mode="json")] if access.entitlement else []
    return {
        "enabled": True,
        "authenticated": access.logged_in,
        "allowed": state == "allowed",
        "state": state,
        "product": PROMPTDECK_SLUG,
        "capability": capability,
        "message": message,
        "reason": (
            "admin_bypass"
            if admin_bypass
            else None
            if state == "allowed"
            else "missing_session"
            if state == "login_required"
            else "missing_credits"
            if missing_credits
            else "missing_entitlement"
        ),
        "user": user_to_schema(user).model_dump(mode="json") if user else None,
        "entitlements": entitlements,
        "paywall": paywall,
        "credits_remaining": access.credits_remaining,
        "launch_url": access.launch_url,
        "admin_bypass": admin_bypass,
    }


@app.get("/products/promptdeck-ai/access")
def promptdeck_access_state_alias(
    product: str | None = None,
    entitlement: str | None = None,
    capability: str | None = None,
    user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    _ = product, entitlement
    return promptdeck_access_state(capability=capability, user=user, db=db)


@app.get("/products/{product_slug}", response_model=ProductStatusResponse)
def product_status(product_slug: str, db: Session = Depends(get_db)) -> ProductStatusResponse:
    product = db.scalar(select(Product).where(Product.slug == product_slug))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    prices = db.scalars(select(Price).where(Price.product_id == product.id)).all()
    return ProductStatusResponse(
        slug=product.slug,
        name=product.name,
        status=product.status,
        prices=[
            PriceResponse(
                id=price.id,
                currency=price.currency,
                amount_minor=price.amount_minor,
                plan_type=price.plan_type,
                metadata=price.metadata_json or {},
            )
            for price in prices
        ],
    )


@app.post("/checkout/orders", response_model=CheckoutOrderResponse)
@app.post("/payments/orders", response_model=CheckoutOrderResponse)
@app.post("/payments/create-order", response_model=CheckoutOrderResponse)
@app.post("/v1/payments/orders", response_model=CheckoutOrderResponse)
async def checkout_orders(
    payload: CheckoutOrderRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> CheckoutOrderResponse:
    product = db.scalar(select(Product).where(Product.slug == payload.product_slug))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    price = None
    if payload.price_id:
        price = db.get(Price, payload.price_id)
    if price is None:
        price = db.scalar(
            select(Price).where(
                Price.product_id == product.id,
                Price.currency == payload.currency.upper(),
                Price.plan_type == "one-time",
            )
        )
    if price is None:
        raise HTTPException(status_code=404, detail="Price not found")

    purchase = Purchase(
        user_id=user.id,
        status="pending",
        currency=price.currency,
        amount_minor=price.amount_minor,
        metadata_json={"product_slug": product.slug},
    )
    db.add(purchase)
    db.flush()
    db.add(
        PurchaseItem(
            purchase_id=purchase.id,
            product_id=product.id,
            price_id=price.id,
            quantity=1,
            metadata_json={
                "plan_type": price.plan_type,
                "product_slug": product.slug,
                "product_name": product.name,
                "credits_granted": int((price.metadata_json or {}).get("credits_granted") or 0),
                "pass_duration_days": int((price.metadata_json or {}).get("pass_duration_days") or 0),
            },
        )
    )
    notes = {
        "purchase_id": purchase.id,
        "user_id": user.id,
        "product_slug": product.slug,
        "email": user.email,
    }
    order = await create_razorpay_order(
        settings,
        amount_minor=price.amount_minor,
        currency=price.currency,
        receipt=purchase.id,
        notes=notes,
    )
    purchase.razorpay_order_id = str(order.get("id"))
    purchase.metadata_json = {**(purchase.metadata_json or {}), "order": order}
    db.commit()
    db.refresh(purchase)

    return CheckoutOrderResponse(
        purchase_id=purchase.id,
        razorpay_order_id=purchase.razorpay_order_id or "",
        key_id=settings.razorpay_key_id or "rzp_mock",
        amount_minor=price.amount_minor,
        currency=price.currency,
        product_slug=product.slug,
        product_name=product.name,
        credits_granted=int((price.metadata_json or {}).get("credits_granted") or 0),
    )


@app.post("/checkout/confirm-client")
def checkout_confirm_client(
    payload: ClientCheckoutConfirmRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    purchase = db.get(Purchase, payload.purchase_id)
    if purchase is None or purchase.user_id != user.id:
        raise HTTPException(status_code=404, detail="Purchase not found")
    purchase.metadata_json = {
        **(purchase.metadata_json or {}),
        "client_confirmation": {
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "metadata": payload.metadata,
        },
    }
    db.commit()
    return {"ok": True, "purchase_status": purchase.status}


@app.post("/products/promptdeck-ai/credits/purchase", response_model=CheckoutOrderResponse)
async def purchase_promptdeck_credits(
    payload: CreditPurchaseRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> CheckoutOrderResponse:
    # v1 reuses the main PromptDeck SKU as the only buy flow.
    return await checkout_orders(
        CheckoutOrderRequest(product_slug=PROMPTDECK_SLUG, currency=payload.currency),
        user=user,
        db=db,
    )


@app.get("/products/promptdeck-ai/credits", response_model=CreditBalanceResponse)
def promptdeck_credit_balance(user: User = Depends(require_current_user), db: Session = Depends(get_db)) -> CreditBalanceResponse:
    balance = get_credit_balance(db, user_id=user.id, product_slug=PROMPTDECK_SLUG)
    return CreditBalanceResponse(product_slug=PROMPTDECK_SLUG, credit_type="generation", balance=balance)


@app.post("/products/promptdeck-ai/credits/consume", response_model=CreditBalanceResponse)
def consume_promptdeck_credit(
    payload: CreditConsumeRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> CreditBalanceResponse:
    admin_bypass = user_has_promptdeck_admin_bypass(settings, user)
    entitlement = db.scalar(
        select(Entitlement).where(
            Entitlement.user_id == user.id,
            Entitlement.product_slug == PROMPTDECK_SLUG,
            Entitlement.status == "active",
        )
    )
    if entitlement is None and not admin_bypass:
        raise HTTPException(status_code=403, detail="PromptDeck entitlement required")

    current_balance = get_credit_balance(db, user_id=user.id, product_slug=PROMPTDECK_SLUG)
    if current_balance < payload.amount and not admin_bypass:
        raise HTTPException(status_code=403, detail="No PromptDeck generation credits remaining")

    if admin_bypass:
        return CreditBalanceResponse(
            product_slug=PROMPTDECK_SLUG,
            credit_type="generation",
            balance=current_balance,
        )

    if payload.project_id:
        existing = db.scalar(
            select(CreditLedger).where(
                CreditLedger.user_id == user.id,
                CreditLedger.product_slug == PROMPTDECK_SLUG,
                CreditLedger.reason == "generation_consume",
                CreditLedger.project_id == payload.project_id,
            )
        )
        if existing is not None:
            return CreditBalanceResponse(
                product_slug=PROMPTDECK_SLUG,
                credit_type="generation",
                balance=current_balance,
            )

    db.add(
        CreditLedger(
            user_id=user.id,
            product_slug=PROMPTDECK_SLUG,
            credit_type="generation",
            delta=-payload.amount,
            reason="generation_consume",
            project_id=payload.project_id,
            metadata_json={"source_kind": payload.source_kind, **payload.metadata},
        )
    )
    db.commit()
    next_balance = get_credit_balance(db, user_id=user.id, product_slug=PROMPTDECK_SLUG)
    return CreditBalanceResponse(product_slug=PROMPTDECK_SLUG, credit_type="generation", balance=next_balance)


@app.post("/products/promptdeck-ai/projects/register", response_model=ProductProjectResponse)
def register_promptdeck_project(
    payload: ProductProjectRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> ProductProjectResponse:
    project = record_product_project(
        db,
        user_id=user.id,
        product_slug=PROMPTDECK_SLUG,
        external_project_id=payload.external_project_id,
        metadata=payload.metadata,
    )
    return ProductProjectResponse(
        id=project.id,
        product_slug=project.product_slug,
        external_project_id=project.external_project_id,
        metadata=project.metadata_json or {},
    )


@app.post("/webhooks/razorpay", response_model=RazorpayWebhookAck)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> RazorpayWebhookAck:
    raw_body = await request.body()
    if not verify_razorpay_signature(settings, raw_body, x_razorpay_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = json.loads(raw_body.decode("utf-8"))
    event_type = str(payload.get("event") or "unknown")
    payment_entity = (((payload.get("payload") or {}).get("payment") or {}).get("entity") or {})
    order_entity = (((payload.get("payload") or {}).get("order") or {}).get("entity") or {})

    purchase_order_id = str(payment_entity.get("order_id") or order_entity.get("id") or "").strip()
    payment_id = str(payment_entity.get("id") or "").strip()
    external_event_id = payment_id or f"{event_type}:{purchase_order_id}"

    webhook_event, created = save_webhook_event(
        db,
        provider="razorpay",
        external_id=external_event_id,
        event_type=event_type,
        payload=payload,
    )
    if not created:
        return RazorpayWebhookAck(processed=False)

    purchase = db.scalar(select(Purchase).where(Purchase.razorpay_order_id == purchase_order_id))
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase for webhook order not found")

    purchase.razorpay_payment_id = payment_id or purchase.razorpay_payment_id
    purchase.status = "paid"

    if str((purchase.metadata_json or {}).get("kind") or "") == "credit_pack":
        user = db.get(User, purchase.user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User for credit pack purchase not found")
        workspace, _membership = get_or_create_workspace(db, user=user)
        grant_credit_pack_purchase(
            db,
            purchase=purchase,
            workspace_id=workspace.id,
            user_id=user.id,
        )
        webhook_event.processed = True
        db.commit()
        return RazorpayWebhookAck(processed=True)

    product_slugs_granted: set[str] = set()
    for item in purchase.items:
        product = item.product or (db.get(Product, item.product_id) if item.product_id else None)
        product_slug = (product.slug if product else None) or (item.metadata_json or {}).get("product_slug")
        if not product_slug or product_slug in product_slugs_granted:
            continue
        credits_granted = int((item.metadata_json or {}).get("credits_granted") or 0)
        if is_agent_product_slug(product_slug):
            grant_product_pass(
                db,
                user_id=purchase.user_id,
                purchase=purchase,
                product_slug=product_slug,
                duration_days=int((item.metadata_json or {}).get("pass_duration_days") or AGENT_PASS_DURATION_DAYS),
            )
            grant_shared_wallet_credits(
                db,
                user_id=purchase.user_id,
                purchase=purchase,
                credits_granted=credits_granted or get_agent_shared_wallet_credits(product_slug),
            )
        else:
            grant_product_purchase(
                db,
                user_id=purchase.user_id,
                purchase=purchase,
                product_slug=product_slug,
                credits_granted=credits_granted,
            )
        product_slugs_granted.add(product_slug)

    webhook_event.processed = True
    db.commit()
    return RazorpayWebhookAck(processed=True)
