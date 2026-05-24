from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .agents import AGENT_PASS_DURATION_DAYS, AGENT_PRODUCT_SLUGS, get_agent_shared_wallet_credits, is_agent_product_slug
from .config import Settings
from .models import (
    AgentWorkspace,
    AuthMagicLink,
    CreditLedger,
    CreditLedgerEntry,
    CreditWallet,
    Entitlement,
    Price,
    Product,
    ProductProject,
    ProductUsageEvent,
    Purchase,
    PurchaseItem,
    RequestThrottle,
    TelegramLink,
    User,
    WebhookEvent,
    Workspace,
    WorkspaceMember,
    WorkspaceMemoryItem,
    WorkspaceMemoryVersion,
    WorkspaceProductPreference,
    utc_now,
)
from .schemas import AgentAccountStatusResponse, AgentProductStatusResponse, SharedWalletResponse
from .security import hash_token, new_magic_token
from .telegram import TELEGRAM_LINK_TOKEN_EXPIRES_AT_KEY, telegram_link_to_status


PROMPTDECK_SLUG = "promptdeck-ai"
DEFAULT_WORKSPACE_SLUG = "founder-workspace"
DEFAULT_WORKSPACE_NAME = "Founder Workspace"
WORKSPACE_WALLET_UNIT = "credits"
TELEGRAM_LINK_TOKEN_TTL_SECONDS = 15 * 60
TELEGRAM_LINK_TOKEN_HASH_KEY = "link_token_hash"
TELEGRAM_LINK_TOKEN_ISSUED_AT_KEY = "link_token_issued_at"

CREDIT_PACKS = {
    "starter": {
        "slug": "starter",
        "name": "Starter",
        "prices_minor": {
            "INR": 200000,
            "USD": 3000,
        },
        "credits": 10,
        "bonus_credits": 0,
    },
    "builder": {
        "slug": "builder",
        "name": "Builder",
        "prices_minor": {
            "INR": 450000,
            "USD": 6500,
        },
        "credits": 25,
        "bonus_credits": 0,
    },
    "scale": {
        "slug": "scale",
        "name": "Scale",
        "prices_minor": {
            "INR": 1000000,
            "USD": 14500,
        },
        "credits": 60,
        "bonus_credits": 0,
    },
}

WALLET_CREDIT_UNIT_AMOUNTS_MINOR = {
    "INR": 20000,
    "USD": 300,
}


class TelegramLinkConflictError(RuntimeError):
    pass


def get_credit_pack(pack_slug: str) -> dict[str, Any] | None:
    return CREDIT_PACKS.get(str(pack_slug or "").strip().lower())


def get_credit_unit_amount_minor(currency: str) -> int:
    return int(WALLET_CREDIT_UNIT_AMOUNTS_MINOR.get(str(currency or "").strip().upper()) or 0)


def derive_credit_price(inr_price: int) -> int:
    if inr_price <= 0:
        return 0
    mapped = {
        1499: 8,
        1999: 10,
        2499: 13,
    }
    if inr_price in mapped:
        return mapped[inr_price]
    return max(1, round(inr_price / 200))


def _catalog_index_path() -> Path:
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "public" / "products" / "index.json"
        if candidate.exists():
            return candidate
    return current.parents[2] / "public" / "products" / "index.json"


def _embedded_catalog_path() -> Path:
    return Path(__file__).with_name("default_product_catalog.json")


def _load_catalog_rows(path: Path) -> list[dict]:
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        rows = []
    except json.JSONDecodeError:
        rows = []
    return rows if isinstance(rows, list) else []


def load_product_seed_catalog(settings: Settings) -> list[dict]:
    rows = _load_catalog_rows(_catalog_index_path())
    if not rows:
        rows = _load_catalog_rows(_embedded_catalog_path())

    normalized: list[dict] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        slug = str(row.get("id") or row.get("slug") or "").strip()
        name = str(row.get("name") or row.get("title") or slug).strip()
        if not slug or not name:
            continue
        metadata = {
            "product_id": row.get("productId") or slug,
            "category": row.get("category"),
            "thumbnail": row.get("thumbnail"),
            "launch_url": row.get("launchUrl"),
            "is_bundle": bool(row.get("isBundle")),
            "is_coming_soon": bool(row.get("isComingSoon")),
            "access_kind": row.get("accessKind"),
            "telegram_bot_username": row.get("telegramBotUsername"),
        }
        if is_agent_product_slug(slug):
            metadata["pass_duration_days"] = int(row.get("passDurationDays") or AGENT_PASS_DURATION_DAYS)
            metadata["shared_wallet_credits_granted"] = int(row.get("sharedWalletCredits") or get_agent_shared_wallet_credits(slug))
        elif "creditPrice" in row:
            metadata["credit_price"] = int(row.get("creditPrice") or 0)
        elif row.get("priceInr"):
            metadata["credit_price"] = derive_credit_price(int(row.get("priceInr") or 0))
        credits_granted = settings.promptdeck_credit_grant if slug == PROMPTDECK_SLUG else 0
        if is_agent_product_slug(slug):
            credits_granted = int(metadata.get("shared_wallet_credits_granted") or 0)
        normalized.append(
            {
                "slug": slug,
                "name": name,
                "status": "coming_soon" if metadata["is_coming_soon"] else "active",
                "metadata": {k: v for k, v in metadata.items() if v not in (None, "", False)},
                "prices": {
                    ("INR", "one-time"): int(row.get("priceInr", 0) or 0) * 100,
                    ("USD", "one-time"): int(row.get("priceUsd", 0) or 0) * 100,
                },
                "credits_granted": credits_granted,
            }
        )
    return normalized


def normalize_email(email: str | None) -> str:
    return (email or "").strip().lower()


def is_admin_email(settings: Settings, email: str | None) -> bool:
    normalized_email = normalize_email(email)
    return bool(normalized_email) and normalized_email in settings.admin_email_set


def user_has_promptdeck_admin_bypass(settings: Settings, user: User | None) -> bool:
    if user is None:
        return False
    return is_admin_email(settings, user.email)


def _coerce_utc(value):
    if value is None:
        return None
    if getattr(value, "tzinfo", None) is None:
        return value.replace(tzinfo=utc_now().tzinfo)
    return value


def ensure_seed_data(db: Session, settings: Settings) -> None:
    catalog = load_product_seed_catalog(settings)
    promptdeck_seeded = any(row.get("slug") == PROMPTDECK_SLUG for row in catalog)
    if not promptdeck_seeded:
        catalog.append(
            {
                "slug": PROMPTDECK_SLUG,
                "name": "PromptDeck AI",
                "status": "active",
                "metadata": {},
                "prices": {
                    ("INR", "one-time"): settings.promptdeck_price_inr_minor,
                    ("USD", "one-time"): settings.promptdeck_price_usd_minor,
                },
                "credits_granted": settings.promptdeck_credit_grant,
            }
        )

    for row in catalog:
        product = db.scalar(select(Product).where(Product.slug == row["slug"]))
        existing_metadata = (product.metadata_json or {}) if product is not None else {}
        metadata_json = {
            **existing_metadata,
            **(row.get("metadata") or {}),
        }
        credits_granted = int(row.get("credits_granted") or 0)
        if credits_granted:
            metadata_json["credits_granted"] = credits_granted
        if product is None:
            product = Product(
                slug=row["slug"],
                name=row["name"],
                status=row["status"],
                metadata_json=metadata_json,
            )
            db.add(product)
            db.flush()
        else:
            product.name = row["name"]
            product.status = row["status"]
            product.metadata_json = metadata_json

        expected_prices = row.get("prices") or {}
        if row["slug"] == PROMPTDECK_SLUG:
            expected_prices = {
                **expected_prices,
                ("INR", "one-time"): int(expected_prices.get(("INR", "one-time")) or settings.promptdeck_price_inr_minor),
                ("USD", "one-time"): int(expected_prices.get(("USD", "one-time")) or settings.promptdeck_price_usd_minor),
            }
        for (currency, plan_type), amount in expected_prices.items():
            if not amount:
                continue
            existing = db.scalar(
                select(Price).where(
                    Price.product_id == product.id,
                    Price.currency == currency,
                    Price.plan_type == plan_type,
                )
            )
            price_metadata = {}
            if credits_granted:
                price_metadata["credits_granted"] = credits_granted
            if is_agent_product_slug(row["slug"]):
                price_metadata["pass_duration_days"] = int((row.get("metadata") or {}).get("pass_duration_days") or AGENT_PASS_DURATION_DAYS)
            if existing is None:
                db.add(
                    Price(
                        product_id=product.id,
                        currency=currency,
                        amount_minor=amount,
                        plan_type=plan_type,
                        metadata_json=price_metadata,
                    )
                )
            else:
                existing.amount_minor = amount
                existing.metadata_json = {
                    **(existing.metadata_json or {}),
                    **price_metadata,
                }
    db.commit()


def get_or_create_workspace(db: Session, *, user: User) -> tuple[Workspace, WorkspaceMember]:
    membership = db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.user_id == user.id,
            WorkspaceMember.status == "active",
        )
    )
    if membership is not None:
        workspace = db.get(Workspace, membership.workspace_id)
        if workspace is not None:
            return workspace, membership

    workspace = Workspace(
        owner_user_id=user.id,
        slug=DEFAULT_WORKSPACE_SLUG,
        name=DEFAULT_WORKSPACE_NAME,
        metadata_json={"default": True},
    )
    db.add(workspace)
    db.flush()

    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role="owner",
        status="active",
    )
    db.add(membership)
    db.flush()
    get_or_create_credit_wallet(db, workspace_id=workspace.id, user_id=user.id)
    db.commit()
    db.refresh(workspace)
    db.refresh(membership)
    return workspace, membership


def get_or_create_credit_wallet(db: Session, *, workspace_id: str, user_id: str) -> CreditWallet:
    wallet = db.scalar(select(CreditWallet).where(CreditWallet.workspace_id == workspace_id))
    if wallet is None:
        wallet = CreditWallet(
            workspace_id=workspace_id,
            user_id=user_id,
            currency_unit=WORKSPACE_WALLET_UNIT,
            balance=0,
        )
        db.add(wallet)
        db.flush()
    return wallet


def _selected_products_payload(selected_products: list[str] | None = None) -> dict[str, Any]:
    cleaned = [str(item).strip() for item in (selected_products or []) if str(item).strip()]
    return {"items": cleaned}


def selected_products_from_item(item: WorkspaceMemoryItem | None) -> list[str]:
    if item is None:
        return []
    payload = item.selected_products_json or {}
    if isinstance(payload, dict):
        raw = payload.get("items", [])
        if isinstance(raw, list):
            return [str(entry).strip() for entry in raw if str(entry).strip()]
    return []


def record_memory_version(db: Session, *, item: WorkspaceMemoryItem, user_id: str | None = None) -> WorkspaceMemoryVersion:
    version_number = len(item.versions) + 1
    version = WorkspaceMemoryVersion(
        memory_item_id=item.id,
        workspace_id=item.workspace_id,
        version_number=version_number,
        snapshot_json={
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
            "last_used_at": item.last_used_at.isoformat() if item.last_used_at else None,
        },
        created_by=user_id,
    )
    db.add(version)
    return version


def create_workspace_memory_item(
    db: Session,
    *,
    workspace_id: str,
    user_id: str,
    memory_scope: str,
    type: str,
    label: str,
    value_json: dict[str, Any] | None,
    summary_text: str,
    source_product: str,
    source_session_id: str | None = None,
    confidence: str = "draft",
    visibility: str = "private",
    selected_products: list[str] | None = None,
    editable: bool = True,
) -> WorkspaceMemoryItem:
    item = WorkspaceMemoryItem(
        workspace_id=workspace_id,
        memory_scope=memory_scope,
        type=type,
        label=label,
        value_json=value_json or {},
        summary_text=summary_text,
        source_product=source_product,
        source_session_id=source_session_id,
        updated_by=user_id,
        confidence=confidence,
        status="active",
        visibility=visibility,
        selected_products_json=_selected_products_payload(selected_products),
        editable=editable,
    )
    db.add(item)
    db.flush()
    record_memory_version(db, item=item, user_id=user_id)
    db.commit()
    db.refresh(item)
    return item


def update_workspace_memory_item(
    db: Session,
    *,
    item: WorkspaceMemoryItem,
    user_id: str,
    updates: dict[str, Any],
) -> WorkspaceMemoryItem:
    for field in ("label", "value_json", "summary_text", "confidence", "status", "visibility", "editable", "last_used_at"):
        if field in updates and updates[field] is not None:
            setattr(item, field, updates[field])
    if "selected_products" in updates and updates["selected_products"] is not None:
        item.selected_products_json = _selected_products_payload(updates["selected_products"])
    item.updated_by = user_id
    item.updated_at = utc_now()
    record_memory_version(db, item=item, user_id=user_id)
    db.commit()
    db.refresh(item)
    return item


def promote_workspace_memory_item(
    db: Session,
    *,
    item: WorkspaceMemoryItem,
    user_id: str,
    updates: dict[str, Any],
) -> WorkspaceMemoryItem:
    item.memory_scope = "canonical"
    if updates.get("type"):
        item.type = str(updates["type"]).strip()
    if updates.get("label"):
        item.label = str(updates["label"]).strip()
    if updates.get("summary_text") is not None:
        item.summary_text = str(updates["summary_text"] or "")
    item.visibility = str(updates.get("visibility") or "workspace_shared")
    item.selected_products_json = _selected_products_payload(updates.get("selected_products"))
    item.updated_by = user_id
    item.updated_at = utc_now()
    record_memory_version(db, item=item, user_id=user_id)
    db.commit()
    db.refresh(item)
    return item


def get_or_create_workspace_product_preference(
    db: Session,
    *,
    workspace_id: str,
    product_slug: str,
) -> WorkspaceProductPreference:
    preference = db.scalar(
        select(WorkspaceProductPreference).where(
            WorkspaceProductPreference.workspace_id == workspace_id,
            WorkspaceProductPreference.product_slug == product_slug,
        )
    )
    if preference is None:
        preference = WorkspaceProductPreference(
            workspace_id=workspace_id,
            product_slug=product_slug,
        )
        db.add(preference)
        db.flush()
    return preference


def update_workspace_product_preference(
    db: Session,
    *,
    workspace_id: str,
    product_slug: str,
    updates: dict[str, Any],
) -> WorkspaceProductPreference:
    preference = get_or_create_workspace_product_preference(
        db,
        workspace_id=workspace_id,
        product_slug=product_slug,
    )
    for field in (
        "import_mode",
        "allow_product_read",
        "allow_product_write",
        "allow_inferred_suggestions",
        "allow_save_to_workspace",
        "start_fresh_by_default",
    ):
        if field in updates and updates[field] is not None:
            setattr(preference, field, updates[field])
    preference.updated_at = utc_now()
    db.commit()
    db.refresh(preference)
    return preference


def get_wallet_balance(db: Session, *, workspace_id: str, user_id: str) -> CreditWallet:
    wallet = get_or_create_credit_wallet(db, workspace_id=workspace_id, user_id=user_id)
    db.commit()
    db.refresh(wallet)
    return wallet


def record_wallet_entry(
    db: Session,
    *,
    wallet: CreditWallet,
    user_id: str,
    workspace_id: str,
    delta: int,
    reason: str,
    product_slug: str | None = None,
    purchase_id: str | None = None,
    usage_event_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> CreditLedgerEntry:
    wallet.balance = int(wallet.balance or 0) + int(delta)
    wallet.updated_at = utc_now()
    entry = CreditLedgerEntry(
        wallet_id=wallet.id,
        user_id=user_id,
        workspace_id=workspace_id,
        delta=int(delta),
        reason=reason,
        product_slug=product_slug,
        purchase_id=purchase_id,
        usage_event_id=usage_event_id,
        metadata_json=metadata or {},
    )
    db.add(entry)
    db.flush()
    return entry


def get_product_credit_price(product: Product | None) -> int:
    if product is None:
        return 0
    metadata = product.metadata_json or {}
    explicit = int(metadata.get("credit_price") or 0)
    if explicit > 0:
        return explicit
    return 0


USAGE_CREDIT_COSTS: dict[tuple[str, str], int] = {
    ("founder-update-generator", "generate"): 2,
    ("founder-outreach-kit", "generate"): 2,
    ("linkedin-candidate-screener", "screen"): 1,
    ("founder-pdf-summarizer", "generate"): 3,
    ("founder-pdf-summarizer", "analyze_document"): 3,
    ("founder-pdf-summarizer", "analyze_workspace"): 4,
    ("founder-pdf-summarizer", "safe_explain"): 4,
}

PRODUCT_DEFAULT_USAGE_CREDIT_COSTS: dict[str, int] = {
    "founder-update-generator": 2,
    "founder-outreach-kit": 2,
    "linkedin-candidate-screener": 1,
    "founder-pdf-summarizer": 3,
}


def resolve_usage_credit_cost(product_slug: str, action: str) -> int:
    normalized_product_slug = str(product_slug or "").strip().lower()
    normalized_action = str(action or "generate").strip().lower() or "generate"

    exact = USAGE_CREDIT_COSTS.get((normalized_product_slug, normalized_action))
    if exact is not None and exact > 0:
        return exact

    fallback = PRODUCT_DEFAULT_USAGE_CREDIT_COSTS.get(normalized_product_slug)
    if fallback is not None and fallback > 0:
        return fallback

    raise ValueError("Product usage policy is not configured")


def enforce_request_window(db: Session, *, key: str, limit: int, window_seconds: int) -> None:
    now = utc_now()
    throttle = db.get(RequestThrottle, key)

    if throttle is None:
        throttle = RequestThrottle(
            key=key,
            count=1,
            window_started_at=now,
        )
        db.add(throttle)
        db.commit()
        return

    elapsed_seconds = (now - _coerce_utc(throttle.window_started_at)).total_seconds()
    if elapsed_seconds >= window_seconds:
        throttle.count = 1
        throttle.window_started_at = now
        db.commit()
        return

    if int(throttle.count or 0) >= int(limit):
        raise ValueError("Too many requests, please try again later")

    throttle.count = int(throttle.count or 0) + 1
    db.commit()


def quote_wallet_credit_checkout(*, currency: str, pack_slug: str | None = None, credits: int | None = None) -> dict[str, Any]:
    normalized_currency = str(currency or "").strip().upper() or "INR"
    if normalized_currency not in WALLET_CREDIT_UNIT_AMOUNTS_MINOR:
        raise ValueError("Unsupported currency for credit pack")

    if pack_slug:
        pack = get_credit_pack(pack_slug)
        if pack is None:
            raise ValueError("Credit pack not found")
        amount_minor = int((pack.get("prices_minor") or {}).get(normalized_currency) or 0)
        if amount_minor <= 0:
            raise ValueError("Unsupported currency for credit pack")
        return {
            "pack_slug": pack["slug"],
            "pack_name": pack["name"],
            "credits_granted": int(pack["credits"]),
            "amount_minor": amount_minor,
            "currency": normalized_currency,
            "bonus_credits": int(pack.get("bonus_credits") or 0),
            "unit_amount_minor": get_credit_unit_amount_minor(normalized_currency),
        }

    requested_credits = int(credits or 0)
    if requested_credits <= 0:
        raise ValueError("Credits must be greater than zero")

    unit_amount_minor = get_credit_unit_amount_minor(normalized_currency)
    if unit_amount_minor <= 0:
        raise ValueError("Unsupported currency for credit pack")

    return {
        "pack_slug": "custom",
        "pack_name": f"{requested_credits} Credits",
        "credits_granted": requested_credits,
        "amount_minor": requested_credits * unit_amount_minor,
        "currency": normalized_currency,
        "bonus_credits": 0,
        "unit_amount_minor": unit_amount_minor,
    }


def grant_credit_pack_purchase(
    db: Session,
    *,
    purchase: Purchase,
    workspace_id: str,
    user_id: str,
) -> CreditWallet:
    pack_slug = str((purchase.metadata_json or {}).get("pack_slug") or "").strip().lower()
    pack = get_credit_pack(pack_slug)
    granted_credits = int((purchase.metadata_json or {}).get("credits_granted") or (pack or {}).get("credits") or 0)
    if granted_credits <= 0:
        raise ValueError("Unknown credit pack")
    pack_name = str((purchase.metadata_json or {}).get("pack_name") or (pack or {}).get("name") or "Credits").strip()

    wallet = get_or_create_credit_wallet(db, workspace_id=workspace_id, user_id=user_id)
    existing = db.scalar(
        select(CreditLedgerEntry).where(
            CreditLedgerEntry.wallet_id == wallet.id,
            CreditLedgerEntry.purchase_id == purchase.id,
            CreditLedgerEntry.reason == "credit_pack_purchase",
        )
    )
    if existing is None:
        record_wallet_entry(
            db,
            wallet=wallet,
            user_id=user_id,
            workspace_id=workspace_id,
            delta=granted_credits,
            reason="credit_pack_purchase",
            purchase_id=purchase.id,
            metadata={
                "pack_slug": pack_slug or "custom",
                "pack_name": pack_name,
                "currency": str((purchase.metadata_json or {}).get("currency") or purchase.currency or "").upper(),
            },
        )
    db.commit()
    db.refresh(wallet)
    return wallet


def unlock_product_with_wallet_credits(
    db: Session,
    *,
    purchase: Purchase | None,
    workspace_id: str,
    user_id: str,
    product: Product,
) -> tuple[Entitlement, CreditWallet]:
    credit_price = get_product_credit_price(product)
    if credit_price <= 0:
        raise ValueError("Product is not eligible for credit unlock")
    wallet = get_or_create_credit_wallet(db, workspace_id=workspace_id, user_id=user_id)
    if int(wallet.balance or 0) < credit_price:
        raise ValueError("Insufficient wallet credits")

    entitlement = db.scalar(
        select(Entitlement).where(
            Entitlement.user_id == user_id,
            Entitlement.product_slug == product.slug,
        )
    )
    if entitlement is None:
        entitlement = Entitlement(
            user_id=user_id,
            product_slug=product.slug,
            status="active",
            metadata_json={"source": "credit_wallet"},
        )
        db.add(entitlement)
        db.flush()
    else:
        entitlement.status = "active"
        entitlement.metadata_json = {**(entitlement.metadata_json or {}), "source": "credit_wallet"}

    record_wallet_entry(
        db,
        wallet=wallet,
        user_id=user_id,
        workspace_id=workspace_id,
        delta=-credit_price,
        reason="product_unlock",
        product_slug=product.slug,
        purchase_id=purchase.id if purchase else None,
        metadata={"credit_price": credit_price},
    )
    db.commit()
    db.refresh(entitlement)
    db.refresh(wallet)
    return entitlement, wallet


def consume_wallet_credits(
    db: Session,
    *,
    workspace_id: str,
    user_id: str,
    product_slug: str,
    action: str,
    credits: int,
    metadata: dict[str, Any] | None = None,
) -> tuple[CreditWallet, ProductUsageEvent]:
    wallet = get_or_create_credit_wallet(db, workspace_id=workspace_id, user_id=user_id)
    if int(wallet.balance or 0) < int(credits):
        raise ValueError("Insufficient wallet credits")
    usage_event = ProductUsageEvent(
        user_id=user_id,
        workspace_id=workspace_id,
        product_slug=product_slug,
        action=action,
        credits_spent=int(credits),
        metadata_json=metadata or {},
    )
    db.add(usage_event)
    db.flush()
    record_wallet_entry(
        db,
        wallet=wallet,
        user_id=user_id,
        workspace_id=workspace_id,
        delta=-int(credits),
        reason="usage_spend",
        product_slug=product_slug,
        usage_event_id=usage_event.id,
        metadata={"action": action, **(metadata or {})},
    )
    db.commit()
    db.refresh(wallet)
    db.refresh(usage_event)
    return wallet, usage_event


def _usage_units_from_entry(entry: CreditLedgerEntry, key: str) -> int:
    metadata = entry.metadata_json or {}
    try:
        return max(0, int(metadata.get(key) or 0))
    except (TypeError, ValueError):
        return 0


def get_wallet_pending_usage_units(db: Session, *, wallet_id: str) -> int:
    entries = db.scalars(select(CreditLedgerEntry).where(CreditLedgerEntry.wallet_id == wallet_id)).all()
    spent_units = sum(
        _usage_units_from_entry(entry, "usage_units")
        for entry in entries
        if entry.reason == "usage_units_spend"
    )
    covered_units = sum(
        _usage_units_from_entry(entry, "usage_units_covered")
        for entry in entries
        if entry.reason == "usage_credit_debit"
    )
    return max(0, spent_units - covered_units)


def get_wallet_available_usage_units(db: Session, *, wallet: CreditWallet, usage_units_per_credit: int) -> int:
    units_per_credit = max(1, int(usage_units_per_credit or 1))
    pending_units = get_wallet_pending_usage_units(db, wallet_id=wallet.id)
    return max(0, int(wallet.balance or 0) * units_per_credit - pending_units)


def consume_wallet_usage_units(
    db: Session,
    *,
    workspace_id: str,
    user_id: str,
    product_slug: str,
    action: str,
    usage_units: int,
    usage_units_per_credit: int,
    metadata: dict[str, Any] | None = None,
) -> tuple[CreditWallet, ProductUsageEvent]:
    units = max(0, int(usage_units or 0))
    units_per_credit = max(1, int(usage_units_per_credit or 1))
    wallet = get_or_create_credit_wallet(db, workspace_id=workspace_id, user_id=user_id)
    if get_wallet_available_usage_units(db, wallet=wallet, usage_units_per_credit=units_per_credit) < units:
        raise ValueError("Insufficient wallet credits")

    usage_metadata = {
        "usage_units": units,
        "usage_units_per_credit": units_per_credit,
        **(metadata or {}),
    }
    usage_event = ProductUsageEvent(
        user_id=user_id,
        workspace_id=workspace_id,
        product_slug=product_slug,
        action=action,
        credits_spent=units,
        metadata_json=usage_metadata,
    )
    db.add(usage_event)
    db.flush()
    record_wallet_entry(
        db,
        wallet=wallet,
        user_id=user_id,
        workspace_id=workspace_id,
        delta=0,
        reason="usage_units_spend",
        product_slug=product_slug,
        usage_event_id=usage_event.id,
        metadata={"action": action, **usage_metadata},
    )

    pending_units = get_wallet_pending_usage_units(db, wallet_id=wallet.id)
    credits_to_debit = pending_units // units_per_credit
    if credits_to_debit > 0:
        if int(wallet.balance or 0) < credits_to_debit:
            raise ValueError("Insufficient wallet credits")
        record_wallet_entry(
            db,
            wallet=wallet,
            user_id=user_id,
            workspace_id=workspace_id,
            delta=-credits_to_debit,
            reason="usage_credit_debit",
            product_slug=product_slug,
            usage_event_id=usage_event.id,
            metadata={
                "action": action,
                "usage_units_covered": credits_to_debit * units_per_credit,
                "usage_units_per_credit": units_per_credit,
            },
        )

    db.commit()
    db.refresh(wallet)
    db.refresh(usage_event)
    return wallet, usage_event


def recommend_products_for_workspace(
    db: Session,
    *,
    workspace_id: str,
    current_product_slug: str,
) -> list[dict[str, Any]]:
    items = db.scalars(
        select(WorkspaceMemoryItem).where(
            WorkspaceMemoryItem.workspace_id == workspace_id,
            WorkspaceMemoryItem.status == "active",
        )
    ).all()
    active_types = {item.type for item in items if item.memory_scope == "canonical"}
    recommendations: list[dict[str, Any]] = []

    if current_product_slug != "founder-outreach-kit" and {"target_customer", "offer"} & active_types:
        recommendations.append(
            {
                "product_slug": "founder-outreach-kit",
                "reason": "You already have enough workspace signal to turn the strategy into outreach.",
                "use_workspace_memory": True,
                "suggested_memory_types": sorted(active_types & {"target_customer", "offer", "proof_point", "brand_tone"}),
            }
        )

    if current_product_slug != "founder-spec-generator" and not {"proof_point", "pricing_hypothesis"} <= active_types:
        recommendations.append(
            {
                "product_slug": "founder-spec-generator",
                "reason": "Your workspace still needs stronger proof, pricing, or strategic structure before the next move.",
                "use_workspace_memory": True,
                "suggested_memory_types": sorted(active_types & {"target_customer", "offer", "problem_statement"}),
            }
        )

    if current_product_slug != PROMPTDECK_SLUG and {"venture_summary", "target_customer", "offer"} <= active_types:
        recommendations.append(
            {
                "product_slug": PROMPTDECK_SLUG,
                "reason": "The workspace now has enough shared story, customer, and offer context to seed PromptDeck.",
                "use_workspace_memory": True,
                "suggested_memory_types": ["venture_summary", "target_customer", "offer"],
            }
        )

    seen: set[str] = set()
    deduped: list[dict[str, Any]] = []
    for item in recommendations:
        slug = str(item.get("product_slug") or "").strip()
        if not slug or slug in seen:
            continue
        seen.add(slug)
        deduped.append(item)
    return deduped[:3]


def get_or_create_user(db: Session, *, email: str, name: str | None = None) -> User:
    normalized_email = normalize_email(email)
    user = db.scalar(select(User).where(User.email == normalized_email))
    if user is None:
        user = User(email=normalized_email, name=name)
        db.add(user)
        db.flush()
    elif name and not user.name:
        user.name = name
    user.last_seen_at = utc_now()
    db.commit()
    db.refresh(user)
    return user


def create_magic_link(db: Session, *, user_id: str, token: str, settings: Settings, next_url: str | None = None) -> AuthMagicLink:
    link = AuthMagicLink(
        user_id=user_id,
        token_hash=hash_token(token),
        next_url=next_url,
        expires_at=utc_now() + timedelta(minutes=settings.magic_link_ttl_minutes),
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def consume_magic_link(db: Session, *, token: str) -> tuple[User | None, AuthMagicLink | None]:
    token_hash = hash_token(token)
    link = db.scalar(select(AuthMagicLink).where(AuthMagicLink.token_hash == token_hash))
    if link is None:
        return None, None
    now = utc_now()
    if _coerce_utc(link.used_at) is not None or _coerce_utc(link.expires_at) < now:
        return None, link
    link.used_at = now
    user = db.get(User, link.user_id)
    if user:
        user.last_seen_at = now
    db.commit()
    return user, link


def get_credit_balance(db: Session, *, user_id: str, product_slug: str, credit_type: str = "generation") -> int:
    balance = db.scalar(
        select(func.coalesce(func.sum(CreditLedger.delta), 0)).where(
            CreditLedger.user_id == user_id,
            CreditLedger.product_slug == product_slug,
            CreditLedger.credit_type == credit_type,
        )
    )
    return int(balance or 0)


def get_shared_wallet_balance(db: Session, *, user_id: str) -> int:
    user = db.get(User, user_id)
    if user is None:
        return 0
    workspace, _membership = get_or_create_workspace(db, user=user)
    wallet = get_or_create_credit_wallet(db, workspace_id=workspace.id, user_id=user.id)
    return int(wallet.balance or 0)


def user_has_active_product_pass(db: Session, *, user_id: str, product_slug: str) -> bool:
    entitlement = db.scalar(
        select(Entitlement).where(
            Entitlement.user_id == user_id,
            Entitlement.product_slug == product_slug,
        )
    )
    if entitlement is None or str(entitlement.status or "").strip() != "active":
        return False
    if entitlement.ends_at is None:
        return True
    ends_at = _coerce_utc(entitlement.ends_at)
    return bool(ends_at and ends_at > utc_now())


def _clear_telegram_link_token_metadata(metadata_json: dict[str, Any] | None) -> dict[str, Any]:
    payload = dict(metadata_json or {})
    payload.pop(TELEGRAM_LINK_TOKEN_HASH_KEY, None)
    payload.pop(TELEGRAM_LINK_TOKEN_ISSUED_AT_KEY, None)
    payload.pop(TELEGRAM_LINK_TOKEN_EXPIRES_AT_KEY, None)
    return payload


def issue_telegram_link_token(
    db: Session,
    *,
    user_id: str,
    product_slug: str,
) -> tuple[TelegramLink, str, int]:
    normalized_slug = str(product_slug or "").strip()
    if not is_agent_product_slug(normalized_slug):
        raise ValueError("Unsupported agent product")
    if not user_has_active_product_pass(db, user_id=user_id, product_slug=normalized_slug):
        raise PermissionError("Active product pass required before linking Telegram")

    link = db.scalar(
        select(TelegramLink).where(
            TelegramLink.user_id == user_id,
            TelegramLink.product_slug == normalized_slug,
        )
    )
    raw_token = new_magic_token()
    now = utc_now()
    expires_at = int((now + timedelta(seconds=TELEGRAM_LINK_TOKEN_TTL_SECONDS)).timestamp())
    metadata_json = {
        **_clear_telegram_link_token_metadata(link.metadata_json if link is not None else None),
        TELEGRAM_LINK_TOKEN_HASH_KEY: hash_token(raw_token),
        TELEGRAM_LINK_TOKEN_ISSUED_AT_KEY: int(now.timestamp()),
        TELEGRAM_LINK_TOKEN_EXPIRES_AT_KEY: expires_at,
    }

    if link is None:
        link = TelegramLink(
            user_id=user_id,
            product_slug=normalized_slug,
            status="pending",
            metadata_json=metadata_json,
        )
        db.add(link)
    else:
        link.status = "pending"
        link.metadata_json = metadata_json
    db.commit()
    db.refresh(link)
    return link, raw_token, TELEGRAM_LINK_TOKEN_TTL_SECONDS


def verify_telegram_link_token(
    db: Session,
    *,
    token: str,
    telegram_user_id: str,
    telegram_chat_id: str,
    telegram_username: str | None = None,
) -> TelegramLink:
    token_hash = hash_token(token)
    now = utc_now()

    candidate = None
    for link in db.scalars(select(TelegramLink).where(TelegramLink.status == "pending")).all():
        metadata_json = link.metadata_json or {}
        if metadata_json.get(TELEGRAM_LINK_TOKEN_HASH_KEY) == token_hash:
            candidate = link
            break

    if candidate is None:
        raise ValueError("Telegram link token is invalid or expired")

    try:
        expires_at = int((candidate.metadata_json or {}).get(TELEGRAM_LINK_TOKEN_EXPIRES_AT_KEY) or 0)
    except (TypeError, ValueError):
        expires_at = 0
    if expires_at <= int(now.timestamp()):
        candidate.status = "expired"
        candidate.metadata_json = _clear_telegram_link_token_metadata(candidate.metadata_json)
        db.commit()
        raise ValueError("Telegram link token is invalid or expired")

    candidate.telegram_user_id = telegram_user_id
    candidate.telegram_chat_id = telegram_chat_id
    candidate.telegram_username = telegram_username or None
    candidate.status = "linked"
    candidate.linked_at = now
    candidate.metadata_json = _clear_telegram_link_token_metadata(candidate.metadata_json)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise TelegramLinkConflictError("Telegram account is already linked to this product") from exc

    db.refresh(candidate)
    return candidate


def get_public_credit_milestone_total(db: Session) -> int:
    total = 0
    paid_purchases = db.scalars(select(Purchase).where(Purchase.status == "paid")).all()

    for purchase in paid_purchases:
        metadata = purchase.metadata_json or {}
        purchase_kind = str(metadata.get("kind") or "").strip().lower()

        if purchase_kind == "credit_pack":
            total += int(metadata.get("credits_granted") or 0)
            continue

        for item in purchase.items:
            item_metadata = item.metadata_json or {}
            product = item.product or (db.get(Product, item.product_id) if item.product_id else None)
            quantity = max(int(item.quantity or 1), 1)
            credit_equivalent = 0

            if product is not None:
                credit_equivalent = get_product_credit_price(product)

            if credit_equivalent <= 0:
                credit_equivalent = int(item_metadata.get("credits_granted") or 0)

            total += credit_equivalent * quantity

    return int(total)


def grant_promptdeck_purchase(db: Session, *, user_id: str, purchase: Purchase, settings: Settings) -> Entitlement:
    return grant_product_purchase(
        db,
        user_id=user_id,
        purchase=purchase,
        product_slug=PROMPTDECK_SLUG,
        credits_granted=settings.promptdeck_credit_grant,
    )


def grant_product_purchase(
    db: Session,
    *,
    user_id: str,
    purchase: Purchase,
    product_slug: str,
    credits_granted: int = 0,
) -> Entitlement:
    entitlement = db.scalar(
        select(Entitlement).where(
            Entitlement.user_id == user_id,
            Entitlement.product_slug == product_slug,
        )
    )
    if entitlement is None:
        entitlement = Entitlement(
            user_id=user_id,
            product_slug=product_slug,
            status="active",
            metadata_json={"source_purchase_id": purchase.id},
        )
        db.add(entitlement)
        db.flush()
    else:
        entitlement.status = "active"

    grant_exists = None
    if credits_granted > 0:
        grant_exists = db.scalar(
            select(CreditLedger).where(
                CreditLedger.user_id == user_id,
                CreditLedger.product_slug == product_slug,
                CreditLedger.purchase_id == purchase.id,
                CreditLedger.reason == "purchase_grant",
            )
        )
    if credits_granted > 0 and grant_exists is None:
        db.add(
            CreditLedger(
                user_id=user_id,
                product_slug=product_slug,
                credit_type="generation",
                delta=credits_granted,
                reason="purchase_grant",
                purchase_id=purchase.id,
                metadata_json={"purchase_status": purchase.status},
            )
        )
    db.commit()
    db.refresh(entitlement)
    return entitlement


def grant_product_pass(
    db: Session,
    *,
    user_id: str,
    purchase: Purchase,
    product_slug: str,
    duration_days: int = AGENT_PASS_DURATION_DAYS,
) -> Entitlement:
    now = utc_now()
    entitlement = db.scalar(
        select(Entitlement).where(
            Entitlement.user_id == user_id,
            Entitlement.product_slug == product_slug,
        )
    )
    existing_ends_at = _coerce_utc(entitlement.ends_at) if entitlement is not None else None
    starts_at = _coerce_utc(entitlement.starts_at) if entitlement is not None and entitlement.starts_at is not None else now
    extension_anchor = existing_ends_at if existing_ends_at is not None and existing_ends_at > now else now
    ends_at = extension_anchor + timedelta(days=duration_days)
    metadata_json = {
        **((entitlement.metadata_json if entitlement is not None else {}) or {}),
        "source_purchase_id": purchase.id,
        "pass_duration_days": duration_days,
        "source": "operator_pass",
    }
    if entitlement is None:
        entitlement = Entitlement(
            user_id=user_id,
            product_slug=product_slug,
            status="active",
            starts_at=starts_at,
            ends_at=ends_at,
            metadata_json=metadata_json,
        )
        db.add(entitlement)
    else:
        entitlement.status = "active"
        entitlement.starts_at = starts_at
        entitlement.ends_at = ends_at
        entitlement.metadata_json = metadata_json
    db.flush()
    db.refresh(entitlement)
    return entitlement


def grant_shared_wallet_credits(
    db: Session,
    *,
    user_id: str,
    purchase: Purchase,
    credits_granted: int,
) -> CreditWallet | None:
    if credits_granted <= 0:
        return None
    user = db.get(User, user_id)
    if user is None:
        return None
    workspace, _membership = get_or_create_workspace(db, user=user)
    wallet = get_or_create_credit_wallet(db, workspace_id=workspace.id, user_id=user.id)
    existing_entry = db.scalar(
        select(CreditLedgerEntry).where(
            CreditLedgerEntry.wallet_id == wallet.id,
            CreditLedgerEntry.purchase_id == purchase.id,
            CreditLedgerEntry.reason == "agent_pass_grant",
        )
    )
    if existing_entry is None:
        record_wallet_entry(
            db,
            wallet=wallet,
            user_id=user.id,
            workspace_id=workspace.id,
            delta=int(credits_granted),
            reason="agent_pass_grant",
            product_slug=None,
            purchase_id=purchase.id,
            metadata={"credits_granted": int(credits_granted)},
        )
    db.flush()
    return wallet


def build_agent_account_status(db: Session, *, user_id: str) -> AgentAccountStatusResponse:
    entitlements = {
        item.product_slug: item
        for item in db.scalars(select(Entitlement).where(Entitlement.user_id == user_id)).all()
    }
    telegram_links = {
        item.product_slug: item
        for item in db.scalars(select(TelegramLink).where(TelegramLink.user_id == user_id)).all()
    }
    workspaces = {
        item.product_slug: item
        for item in db.scalars(select(AgentWorkspace).where(AgentWorkspace.user_id == user_id)).all()
    }
    balance = get_shared_wallet_balance(db, user_id=user_id)
    products = []
    for product_slug in AGENT_PRODUCT_SLUGS:
        entitlement = entitlements.get(product_slug)
        telegram_link = telegram_links.get(product_slug)
        workspace = workspaces.get(product_slug)
        products.append(
            AgentProductStatusResponse(
                product_slug=product_slug,
                has_active_pass=user_has_active_product_pass(db, user_id=user_id, product_slug=product_slug),
                entitlement_status=entitlement.status if entitlement is not None else None,
                telegram_link=telegram_link_to_status(product_slug, telegram_link),
                workspace_status=workspace.status if workspace is not None else None,
                bot_username=telegram_link_to_status(product_slug, telegram_link).bot_username,
            )
        )
    return AgentAccountStatusResponse(
        shared_wallet=SharedWalletResponse(
            balance=balance,
            available_balance=balance,
            reserved_balance=0,
            exhausted=balance <= 0,
        ),
        products=products,
    )


def build_agent_runtime_access_state(
    db: Session,
    *,
    product_slug: str,
    telegram_user_id: str,
) -> dict[str, object]:
    normalized_slug = str(product_slug or "").strip()
    if not is_agent_product_slug(normalized_slug):
        raise ValueError("Unsupported agent product")
    normalized_telegram_user_id = str(telegram_user_id or "").strip()
    if not normalized_telegram_user_id:
        raise ValueError("telegram_user_id is required")

    link = db.scalar(
        select(TelegramLink).where(
            TelegramLink.product_slug == normalized_slug,
            TelegramLink.telegram_user_id == normalized_telegram_user_id,
        )
    )
    link_status = str(link.status or "").strip() if link is not None else "unlinked"
    linked = link is not None and link_status == "linked"
    linked_user_id = str(link.user_id or "").strip() if link is not None else ""
    has_active_pass = user_has_active_product_pass(db, user_id=linked_user_id, product_slug=normalized_slug) if linked_user_id else False
    shared_wallet_balance = get_shared_wallet_balance(db, user_id=linked_user_id) if linked_user_id else None

    reasons: list[str] = []
    if not linked:
        reasons.append(
            "telegram_pending"
            if link_status == "pending"
            else "telegram_expired"
            if link_status == "expired"
            else "telegram_not_linked"
        )
    if linked_user_id and not has_active_pass:
        reasons.append("pass_inactive")
    if shared_wallet_balance is not None and shared_wallet_balance <= 0:
        reasons.append("shared_wallet_empty")

    return {
        "product_slug": normalized_slug,
        "telegram_user_id": normalized_telegram_user_id,
        "should_respond": linked and has_active_pass and (shared_wallet_balance or 0) > 0,
        "reasons": reasons,
        "linked": linked,
        "telegram_link_status": link_status,
        "has_active_pass": has_active_pass,
        "shared_wallet_balance": shared_wallet_balance,
    }


def record_product_project(
    db: Session,
    *,
    user_id: str,
    product_slug: str,
    external_project_id: str,
    metadata: dict | None = None,
) -> ProductProject:
    project = db.scalar(
        select(ProductProject).where(
            ProductProject.product_slug == product_slug,
            ProductProject.external_project_id == external_project_id,
        )
    )
    if project is None:
        project = ProductProject(
            user_id=user_id,
            product_slug=product_slug,
            external_project_id=external_project_id,
            metadata_json=metadata or {},
        )
        db.add(project)
    else:
        project.metadata_json = {**(project.metadata_json or {}), **(metadata or {})}
    db.commit()
    db.refresh(project)
    return project


def save_webhook_event(
    db: Session,
    *,
    provider: str,
    external_id: str,
    event_type: str,
    payload: dict,
) -> tuple[WebhookEvent, bool]:
    existing = db.scalar(select(WebhookEvent).where(WebhookEvent.external_id == external_id))
    if existing is not None:
        return existing, False
    event = WebhookEvent(
        provider=provider,
        external_id=external_id,
        event_type=event_type,
        payload=payload,
        processed=False,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event, True
