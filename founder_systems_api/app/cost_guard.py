from __future__ import annotations

from datetime import timedelta
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .models import (
    AiModelPolicy,
    AiUsageEvent,
    AiUsageReservation,
    CreditWallet,
    Entitlement,
    Product,
    TelegramLink,
    User,
    UserAccessBlock,
    Workspace,
    utc_now,
)
from .schemas import (
    AiModelPolicyPatchRequest,
    AiUsageFinalizeRequest,
    AiUsageGuardResponse,
    AiUsageReleaseRequest,
    AiUsageReserveRequest,
    CostGuardEventResponse,
    CostGuardSummaryResponse,
    CostGuardUserRow,
)
from .services import (
    consume_wallet_usage_units,
    get_or_create_credit_wallet,
    get_or_create_workspace,
    get_wallet_available_usage_units,
    is_admin_email,
)


DEFAULT_MODEL_POLICIES: tuple[dict[str, Any], ...] = (
    {
        "provider": "bedrock",
        "model_id": "amazon.nova-lite-v1:0",
        "status": "enabled",
        "max_input_chars": 25000000,
        "max_output_tokens": 500,
        "daily_global_limit": 1000,
    },
    {
        "provider": "google",
        "model_id": "gemini-2.5-flash",
        "status": "enabled",
        "max_input_chars": 25000000,
        "max_output_tokens": 500,
        "daily_global_limit": 1000,
    },
    {
        "provider": "openai",
        "model_id": "gpt-4.1-mini",
        "status": "enabled",
        "max_input_chars": 25000000,
        "max_output_tokens": 1200,
        "daily_global_limit": 500,
    },
    {
        "provider": "litellm",
        "model_id": "action",
        "status": "enabled",
        "max_input_chars": 25000000,
        "max_output_tokens": 1200,
        "daily_global_limit": 500,
    },
    {
        "provider": "bedrock",
        "model_id": "deepseek.v3.1",
        "status": "disabled",
        "max_input_chars": 25000000,
        "max_output_tokens": 400,
        "daily_global_limit": 0,
    },
    {
        "provider": "bedrock",
        "model_id": "deepseek-v3.1",
        "status": "disabled",
        "max_input_chars": 25000000,
        "max_output_tokens": 400,
        "daily_global_limit": 0,
    },
)


def normalize_provider(value: str | None) -> str:
    return str(value or "unknown").strip().lower() or "unknown"


def normalize_model_id(value: str | None) -> str:
    return str(value or "unknown").strip().lower() or "unknown"


def _is_deepseek_v31(provider: str, model_id: str) -> bool:
    blob = f"{provider}/{model_id}".lower()
    return "deepseek" in blob and ("v3.1" in blob or "v3-1" in blob)


def ensure_default_ai_model_policies(db: Session, settings: Settings) -> None:
    for row in DEFAULT_MODEL_POLICIES:
        provider = normalize_provider(row["provider"])
        model_id = normalize_model_id(row["model_id"])
        existing = db.scalar(
            select(AiModelPolicy).where(
                AiModelPolicy.provider == provider,
                AiModelPolicy.model_id == model_id,
            )
        )
        if existing is not None:
            default_max = int(row.get("max_input_chars") or 25000000)
            if existing.max_input_chars < default_max:
                existing.max_input_chars = default_max
                db.flush()
            continue
        status = str(row.get("status") or "enabled")
        if _is_deepseek_v31(provider, model_id) and settings.ai_guard_deepseek_enabled:
            status = "enabled"
        db.add(
            AiModelPolicy(
                provider=provider,
                model_id=model_id,
                status=status,
                max_input_chars=int(row.get("max_input_chars") or 12000),
                max_output_tokens=int(row.get("max_output_tokens") or 800),
                daily_global_limit=int(row.get("daily_global_limit") or settings.ai_guard_global_daily_limit),
                metadata_json={"source": "default_seed"},
            )
        )
    db.commit()


def _resolve_policy(db: Session, settings: Settings, *, provider: str, model_id: str) -> AiModelPolicy:
    ensure_default_ai_model_policies(db, settings)
    normalized_provider = normalize_provider(provider)
    normalized_model = normalize_model_id(model_id)
    policy = db.scalar(
        select(AiModelPolicy).where(
            AiModelPolicy.provider == normalized_provider,
            AiModelPolicy.model_id == normalized_model,
        )
    )
    if policy is not None:
        return policy
    status = "disabled" if _is_deepseek_v31(normalized_provider, normalized_model) and not settings.ai_guard_deepseek_enabled else "enabled"
    policy = AiModelPolicy(
        provider=normalized_provider,
        model_id=normalized_model,
        status=status,
        max_input_chars=25000000,
        max_output_tokens=800,
        daily_global_limit=settings.ai_guard_global_daily_limit,
        metadata_json={"source": "auto_created"},
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def _record_event(
    db: Session,
    *,
    reservation: AiUsageReservation | None = None,
    reference_id: str,
    user_id: str | None,
    workspace_id: str | None,
    product_slug: str,
    action: str,
    provider: str,
    model_id: str,
    phase: str,
    decision: str,
    reason: str = "",
    credits: int = 0,
    estimated_input_chars: int = 0,
    estimated_output_tokens: int = 0,
    actual_input_tokens: int = 0,
    actual_output_tokens: int = 0,
    metadata: dict[str, Any] | None = None,
) -> AiUsageEvent:
    event = AiUsageEvent(
        reservation_id=reservation.id if reservation else None,
        reference_id=reference_id,
        user_id=user_id,
        workspace_id=workspace_id,
        product_slug=product_slug,
        action=action,
        provider=normalize_provider(provider),
        model_id=normalize_model_id(model_id),
        phase=phase,
        decision=decision,
        reason=reason,
        credits=int(credits or 0),
        estimated_input_chars=int(estimated_input_chars or 0),
        estimated_output_tokens=int(estimated_output_tokens or 0),
        actual_input_tokens=int(actual_input_tokens or 0),
        actual_output_tokens=int(actual_output_tokens or 0),
        metadata_json=metadata or {},
    )
    db.add(event)
    db.flush()
    return event


def _response(
    *,
    ok: bool,
    state: str,
    reference_id: str,
    reason: str | None = None,
    reservation: AiUsageReservation | None = None,
    credits: int = 0,
    wallet: CreditWallet | None = None,
    policy: AiModelPolicy | None = None,
) -> AiUsageGuardResponse:
    return AiUsageGuardResponse(
        ok=ok,
        state=state,
        reference_id=reference_id,
        reason=reason,
        reservation_id=reservation.id if reservation else None,
        credits=int(credits or 0),
        wallet_balance=int(wallet.balance) if wallet is not None else None,
        policy_status=policy.status if policy is not None else None,
    )


def _deny(
    db: Session,
    *,
    payload: AiUsageReserveRequest,
    reason: str,
    provider: str,
    model_id: str,
    user_id: str | None = None,
    workspace_id: str | None = None,
    policy: AiModelPolicy | None = None,
    wallet: CreditWallet | None = None,
) -> AiUsageGuardResponse:
    _record_event(
        db,
        reference_id=payload.reference_id,
        user_id=user_id,
        workspace_id=workspace_id,
        product_slug=payload.product_slug,
        action=payload.action,
        provider=provider,
        model_id=model_id,
        phase="reserve",
        decision="denied",
        reason=reason,
        credits=int(payload.credits or payload.amount or 0),
        estimated_input_chars=payload.estimated_input_chars,
        estimated_output_tokens=payload.estimated_output_tokens,
        metadata=payload.metadata,
    )
    db.commit()
    return _response(
        ok=False,
        state="denied",
        reference_id=payload.reference_id,
        reason=reason,
        credits=int(payload.credits or payload.amount or 0),
        wallet=wallet,
        policy=policy,
    )


def _resolve_user_workspace(
    db: Session,
    *,
    payload: AiUsageReserveRequest,
    authorized_user: User | None,
) -> tuple[User | None, Workspace | None]:
    if payload.telegram_user_id:
        link = db.scalar(
            select(TelegramLink).where(
                TelegramLink.product_slug == payload.product_slug,
                TelegramLink.telegram_user_id == payload.telegram_user_id,
                TelegramLink.status == "linked",
            )
        )
        if link is None:
            return None, None
        user = db.get(User, link.user_id)
        if user is None:
            return None, None
        workspace, _membership = get_or_create_workspace(db, user=user)
        return user, workspace

    if payload.user_id:
        user = db.get(User, payload.user_id)
    else:
        user = authorized_user
    if user is None:
        return None, None

    if payload.workspace_id:
        workspace = db.get(Workspace, payload.workspace_id)
        if workspace is not None:
            return user, workspace
    workspace, _membership = get_or_create_workspace(db, user=user)
    return user, workspace


def _has_active_entitlement(db: Session, *, user_id: str, product_slug: str) -> bool:
    now = utc_now()
    entitlement = db.scalar(
        select(Entitlement).where(
            Entitlement.user_id == user_id,
            Entitlement.product_slug == product_slug,
            Entitlement.status == "active",
            or_(Entitlement.ends_at.is_(None), Entitlement.ends_at > now),
        )
    )
    return entitlement is not None


def _is_user_blocked(db: Session, user_id: str) -> bool:
    return db.scalar(
        select(UserAccessBlock).where(
            UserAccessBlock.user_id == user_id,
            UserAccessBlock.status == "active",
        )
    ) is not None


def _event_count_since(
    db: Session,
    *,
    since,
    decision: str,
    user_id: str | None = None,
    product_slug: str | None = None,
    provider: str | None = None,
    model_id: str | None = None,
    actions: set[str] | None = None,
) -> int:
    query = select(func.count(AiUsageEvent.id)).where(
        AiUsageEvent.created_at >= since,
        AiUsageEvent.decision == decision,
    )
    if user_id:
        query = query.where(AiUsageEvent.user_id == user_id)
    if product_slug:
        query = query.where(AiUsageEvent.product_slug == product_slug)
    if provider:
        query = query.where(AiUsageEvent.provider == normalize_provider(provider))
    if model_id:
        query = query.where(AiUsageEvent.model_id == normalize_model_id(model_id))
    if actions:
        query = query.where(AiUsageEvent.action.in_(sorted(actions)))
    return int(db.scalar(query) or 0)


def reserve_ai_usage(
    db: Session,
    settings: Settings,
    *,
    payload: AiUsageReserveRequest,
    authorized_user: User | None = None,
) -> AiUsageGuardResponse:
    provider = normalize_provider(payload.provider)
    model_id = normalize_model_id(payload.model_id)
    policy = _resolve_policy(db, settings, provider=provider, model_id=model_id)
    credits = int(payload.credits or payload.amount or settings.ai_guard_default_credit_cost)
    usage_units_per_credit = max(1, int(settings.wallet_usage_units_per_credit or 1))

    existing = db.scalar(
        select(AiUsageReservation).where(AiUsageReservation.reference_id == payload.reference_id)
    )
    if existing is not None:
        wallet = db.scalar(select(CreditWallet).where(CreditWallet.workspace_id == existing.workspace_id))
        return _response(
            ok=existing.status in {"reserved", "finalized"},
            state=existing.status,
            reference_id=payload.reference_id,
            reservation=existing,
            credits=existing.credits_reserved,
            wallet=wallet,
            policy=policy,
        )

    user, workspace = _resolve_user_workspace(db, payload=payload, authorized_user=authorized_user)
    if user is None or workspace is None:
        return _deny(db, payload=payload, reason="user_not_found", provider=provider, model_id=model_id, policy=policy)

    wallet = get_or_create_credit_wallet(db, workspace_id=workspace.id, user_id=user.id)
    product = db.scalar(select(Product).where(Product.slug == payload.product_slug))
    if product is None or product.status != "active":
        return _deny(db, payload=payload, reason="product_disabled", provider=provider, model_id=model_id, user_id=user.id, workspace_id=workspace.id, policy=policy, wallet=wallet)
    if _is_user_blocked(db, user.id):
        return _deny(db, payload=payload, reason="user_blocked", provider=provider, model_id=model_id, user_id=user.id, workspace_id=workspace.id, policy=policy, wallet=wallet)
    if policy.status != "enabled":
        return _deny(db, payload=payload, reason="model_disabled", provider=provider, model_id=model_id, user_id=user.id, workspace_id=workspace.id, policy=policy, wallet=wallet)
    if payload.estimated_input_chars > policy.max_input_chars:
        return _deny(db, payload=payload, reason="input_too_large", provider=provider, model_id=model_id, user_id=user.id, workspace_id=workspace.id, policy=policy, wallet=wallet)
    if payload.estimated_output_tokens > policy.max_output_tokens:
        return _deny(db, payload=payload, reason="output_too_large", provider=provider, model_id=model_id, user_id=user.id, workspace_id=workspace.id, policy=policy, wallet=wallet)

    admin_bypass = is_admin_email(settings, user.email)
    if not admin_bypass and not _has_active_entitlement(db, user_id=user.id, product_slug=payload.product_slug):
        return _deny(db, payload=payload, reason="product_access_required", provider=provider, model_id=model_id, user_id=user.id, workspace_id=workspace.id, policy=policy, wallet=wallet)
    if not admin_bypass and get_wallet_available_usage_units(db, wallet=wallet, usage_units_per_credit=usage_units_per_credit) < credits:
        return _deny(db, payload=payload, reason="wallet_empty", provider=provider, model_id=model_id, user_id=user.id, workspace_id=workspace.id, policy=policy, wallet=wallet)

    since = utc_now() - timedelta(days=1)
    heavy_actions = {"import", "rebuild", "generate_deck", "generate-description", "file_import"}
    action_limit = settings.ai_guard_heavy_daily_limit if payload.action in heavy_actions else settings.ai_guard_user_daily_limit
    if not admin_bypass and _event_count_since(db, since=since, decision="allowed", user_id=user.id, product_slug=payload.product_slug) >= action_limit:
        return _deny(db, payload=payload, reason="user_daily_limit", provider=provider, model_id=model_id, user_id=user.id, workspace_id=workspace.id, policy=policy, wallet=wallet)
    if policy.daily_global_limit <= 0 or _event_count_since(db, since=since, decision="allowed", provider=provider, model_id=model_id) >= policy.daily_global_limit:
        return _deny(db, payload=payload, reason="model_daily_limit", provider=provider, model_id=model_id, user_id=user.id, workspace_id=workspace.id, policy=policy, wallet=wallet)

    reservation = AiUsageReservation(
        reference_id=payload.reference_id,
        user_id=user.id,
        workspace_id=workspace.id,
        product_slug=payload.product_slug,
        action=payload.action,
        provider=provider,
        model_id=model_id,
        status="reserved",
        credits_reserved=credits,
        estimated_input_chars=payload.estimated_input_chars,
        estimated_output_tokens=payload.estimated_output_tokens,
        metadata_json={
            "usage_units": credits,
            "usage_units_per_credit": usage_units_per_credit,
            **(payload.metadata or {}),
        },
    )
    db.add(reservation)
    db.flush()
    _record_event(
        db,
        reservation=reservation,
        reference_id=payload.reference_id,
        user_id=user.id,
        workspace_id=workspace.id,
        product_slug=payload.product_slug,
        action=payload.action,
        provider=provider,
        model_id=model_id,
        phase="reserve",
        decision="allowed",
        reason="reserved",
        credits=credits,
        estimated_input_chars=payload.estimated_input_chars,
        estimated_output_tokens=payload.estimated_output_tokens,
        metadata={
            "usage_units": credits,
            "usage_units_per_credit": usage_units_per_credit,
            **(payload.metadata or {}),
        },
    )
    db.commit()
    db.refresh(reservation)
    db.refresh(wallet)
    return _response(
        ok=True,
        state="reserved",
        reference_id=payload.reference_id,
        reservation=reservation,
        credits=credits,
        wallet=wallet,
        policy=policy,
    )


def finalize_ai_usage(
    db: Session,
    *,
    payload: AiUsageFinalizeRequest,
) -> AiUsageGuardResponse:
    reservation = db.scalar(
        select(AiUsageReservation).where(AiUsageReservation.reference_id == payload.reference_id)
    )
    if reservation is None:
        _record_event(
            db,
            reference_id=payload.reference_id,
            user_id=None,
            workspace_id=None,
            product_slug="unknown",
            action="unknown",
            provider="unknown",
            model_id="unknown",
            phase="finalize",
            decision="denied",
            reason="reservation_not_found",
            metadata=payload.metadata,
        )
        db.commit()
        return _response(ok=False, state="denied", reference_id=payload.reference_id, reason="reservation_not_found")

    wallet = db.scalar(select(CreditWallet).where(CreditWallet.workspace_id == reservation.workspace_id))
    if reservation.status == "finalized":
        return _response(ok=True, state="finalized", reference_id=payload.reference_id, reservation=reservation, credits=reservation.credits_finalized, wallet=wallet)
    if reservation.status != "reserved":
        return _response(ok=False, state=reservation.status, reference_id=payload.reference_id, reason=f"reservation_{reservation.status}", reservation=reservation, wallet=wallet)

    credits = int(payload.credits if payload.credits is not None else reservation.credits_reserved)
    active_settings = get_settings()
    usage_units_per_credit = max(1, int(active_settings.wallet_usage_units_per_credit or 1))
    wallet, _usage_event = consume_wallet_usage_units(
        db,
        workspace_id=reservation.workspace_id,
        user_id=reservation.user_id,
        product_slug=reservation.product_slug,
        action=reservation.action,
        usage_units=credits,
        usage_units_per_credit=usage_units_per_credit,
        metadata={
            "ai_reference_id": reservation.reference_id,
            "provider": reservation.provider,
            "model_id": reservation.model_id,
            "usage_units": credits,
            "usage_units_per_credit": usage_units_per_credit,
            **(reservation.metadata_json or {}),
            **payload.metadata,
        },
    )
    reservation.status = "finalized"
    reservation.credits_finalized = credits
    reservation.actual_input_tokens = payload.actual_input_tokens
    reservation.actual_output_tokens = payload.actual_output_tokens
    reservation.metadata_json = {**(reservation.metadata_json or {}), **payload.metadata}
    _record_event(
        db,
        reservation=reservation,
        reference_id=reservation.reference_id,
        user_id=reservation.user_id,
        workspace_id=reservation.workspace_id,
        product_slug=reservation.product_slug,
        action=reservation.action,
        provider=reservation.provider,
        model_id=reservation.model_id,
        phase="finalize",
        decision="allowed",
        reason="finalized",
        credits=credits,
        estimated_input_chars=reservation.estimated_input_chars,
        estimated_output_tokens=reservation.estimated_output_tokens,
        actual_input_tokens=payload.actual_input_tokens,
        actual_output_tokens=payload.actual_output_tokens,
        metadata=payload.metadata,
    )
    db.commit()
    db.refresh(reservation)
    db.refresh(wallet)
    return _response(ok=True, state="finalized", reference_id=payload.reference_id, reservation=reservation, credits=credits, wallet=wallet)


def release_ai_usage(
    db: Session,
    *,
    payload: AiUsageReleaseRequest,
) -> AiUsageGuardResponse:
    reservation = db.scalar(
        select(AiUsageReservation).where(AiUsageReservation.reference_id == payload.reference_id)
    )
    if reservation is None:
        _record_event(
            db,
            reference_id=payload.reference_id,
            user_id=None,
            workspace_id=None,
            product_slug="unknown",
            action="unknown",
            provider="unknown",
            model_id="unknown",
            phase="release",
            decision="denied",
            reason="reservation_not_found",
            metadata=payload.metadata,
        )
        db.commit()
        return _response(ok=False, state="denied", reference_id=payload.reference_id, reason="reservation_not_found")
    wallet = db.scalar(select(CreditWallet).where(CreditWallet.workspace_id == reservation.workspace_id))
    if reservation.status == "reserved":
        reservation.status = "released"
        reservation.metadata_json = {**(reservation.metadata_json or {}), **payload.metadata}
    _record_event(
        db,
        reservation=reservation,
        reference_id=reservation.reference_id,
        user_id=reservation.user_id,
        workspace_id=reservation.workspace_id,
        product_slug=reservation.product_slug,
        action=reservation.action,
        provider=reservation.provider,
        model_id=reservation.model_id,
        phase="release",
        decision="allowed",
        reason=payload.reason,
        credits=0,
        metadata=payload.metadata,
    )
    db.commit()
    db.refresh(reservation)
    if wallet is not None:
        db.refresh(wallet)
    return _response(ok=True, state=reservation.status, reference_id=payload.reference_id, reason=payload.reason, reservation=reservation, wallet=wallet)


def block_user_access(
    db: Session,
    *,
    user_id: str,
    reason: str,
    created_by_user_id: str | None,
    metadata: dict[str, Any] | None = None,
) -> UserAccessBlock:
    existing = db.scalar(
        select(UserAccessBlock).where(
            UserAccessBlock.user_id == user_id,
            UserAccessBlock.status == "active",
        )
    )
    if existing is not None:
        existing.reason = reason or existing.reason
        existing.metadata_json = {**(existing.metadata_json or {}), **(metadata or {})}
        db.commit()
        db.refresh(existing)
        return existing
    block = UserAccessBlock(
        user_id=user_id,
        reason=reason,
        created_by_user_id=created_by_user_id,
        metadata_json=metadata or {},
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block


def unblock_user_access(db: Session, *, user_id: str) -> bool:
    blocks = db.scalars(
        select(UserAccessBlock).where(
            UserAccessBlock.user_id == user_id,
            UserAccessBlock.status == "active",
        )
    ).all()
    for block in blocks:
        block.status = "revoked"
    db.commit()
    return bool(blocks)


def update_model_policy(
    db: Session,
    *,
    policy_id: str,
    payload: AiModelPolicyPatchRequest,
) -> AiModelPolicy | None:
    policy = db.get(AiModelPolicy, policy_id)
    if policy is None:
        return None
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if value is not None:
            setattr(policy, field, value)
    db.commit()
    db.refresh(policy)
    return policy


def cost_guard_summary(db: Session) -> CostGuardSummaryResponse:
    since = utc_now() - timedelta(days=1)
    allowed_24h = _event_count_since(db, since=since, decision="allowed")
    denied_24h = _event_count_since(db, since=since, decision="denied")
    finalized_24h = int(
        db.scalar(
            select(func.count(AiUsageEvent.id)).where(
                AiUsageEvent.created_at >= since,
                AiUsageEvent.phase == "finalize",
                AiUsageEvent.decision == "allowed",
            )
        )
        or 0
    )
    credits_spent_24h = int(
        db.scalar(
            select(func.coalesce(func.sum(AiUsageEvent.credits), 0)).where(
                AiUsageEvent.created_at >= since,
                AiUsageEvent.phase == "finalize",
                AiUsageEvent.decision == "allowed",
            )
        )
        or 0
    )
    active_blocks = int(db.scalar(select(func.count(UserAccessBlock.id)).where(UserAccessBlock.status == "active")) or 0)
    disabled_models = int(db.scalar(select(func.count(AiModelPolicy.id)).where(AiModelPolicy.status != "enabled")) or 0)
    return CostGuardSummaryResponse(
        allowed_24h=allowed_24h,
        denied_24h=denied_24h,
        finalized_24h=finalized_24h,
        credits_spent_24h=credits_spent_24h,
        active_blocks=active_blocks,
        disabled_models=disabled_models,
    )


def cost_guard_users(db: Session) -> list[CostGuardUserRow]:
    since = utc_now() - timedelta(days=1)
    users = db.scalars(select(User).order_by(User.created_at.desc()).limit(200)).all()
    rows: list[CostGuardUserRow] = []
    for user in users:
        workspace = db.scalar(select(Workspace).where(Workspace.owner_user_id == user.id).order_by(Workspace.created_at.desc()))
        wallet = db.scalar(select(CreditWallet).where(CreditWallet.user_id == user.id).order_by(CreditWallet.created_at.desc()))
        allowed = _event_count_since(db, since=since, decision="allowed", user_id=user.id)
        denied = _event_count_since(db, since=since, decision="denied", user_id=user.id)
        credits_spent = int(
            db.scalar(
                select(func.coalesce(func.sum(AiUsageEvent.credits), 0)).where(
                    AiUsageEvent.created_at >= since,
                    AiUsageEvent.user_id == user.id,
                    AiUsageEvent.phase == "finalize",
                    AiUsageEvent.decision == "allowed",
                )
            )
            or 0
        )
        last_event_at = db.scalar(
            select(func.max(AiUsageEvent.created_at)).where(AiUsageEvent.user_id == user.id)
        )
        rows.append(
            CostGuardUserRow(
                user_id=user.id,
                email=user.email,
                wallet_balance=int(wallet.balance) if wallet else 0,
                allowed_24h=allowed,
                denied_24h=denied,
                credits_spent_24h=credits_spent,
                blocked=_is_user_blocked(db, user.id),
                last_event_at=last_event_at,
            )
        )
    return rows


def cost_guard_events(db: Session, *, limit: int = 100) -> list[CostGuardEventResponse]:
    events = db.scalars(select(AiUsageEvent).order_by(AiUsageEvent.created_at.desc()).limit(limit)).all()
    return [
        CostGuardEventResponse(
            id=event.id,
            reference_id=event.reference_id,
            user_id=event.user_id,
            product_slug=event.product_slug,
            action=event.action,
            provider=event.provider,
            model_id=event.model_id,
            phase=event.phase,
            decision=event.decision,
            reason=event.reason,
            credits=event.credits,
            metadata=event.metadata_json or {},
            created_at=event.created_at,
        )
        for event in events
    ]
