from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import Settings
from .models import (
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
    User,
    WebhookEvent,
    Workspace,
    WorkspaceMember,
    WorkspaceMemoryItem,
    WorkspaceMemoryVersion,
    WorkspaceProductPreference,
    utc_now,
)
from .security import hash_token


PROMPTDECK_SLUG = "promptdeck-ai"
DEFAULT_WORKSPACE_SLUG = "founder-workspace"
DEFAULT_WORKSPACE_NAME = "Founder Workspace"
WORKSPACE_WALLET_UNIT = "credits"

CREDIT_PACKS = {
    "starter": {
        "slug": "starter",
        "name": "Starter",
        "currency": "INR",
        "amount_minor": 200000,
        "credits": 10,
        "bonus_credits": 0,
    },
    "builder": {
        "slug": "builder",
        "name": "Builder",
        "currency": "INR",
        "amount_minor": 450000,
        "credits": 25,
        "bonus_credits": 0,
    },
    "scale": {
        "slug": "scale",
        "name": "Scale",
        "currency": "INR",
        "amount_minor": 1000000,
        "credits": 60,
        "bonus_credits": 0,
    },
}


def get_credit_pack(pack_slug: str) -> dict[str, Any] | None:
    return CREDIT_PACKS.get(str(pack_slug or "").strip().lower())


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


def load_product_seed_catalog(settings: Settings) -> list[dict]:
    catalog_path = _catalog_index_path()
    try:
        rows = json.loads(catalog_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        rows = []
    except json.JSONDecodeError:
        rows = []

    normalized: list[dict] = []
    for row in rows if isinstance(rows, list) else []:
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
        }
        if "creditPrice" in row:
            metadata["credit_price"] = int(row.get("creditPrice") or 0)
        elif row.get("priceInr"):
            metadata["credit_price"] = derive_credit_price(int(row.get("priceInr") or 0))
        credits_granted = settings.promptdeck_credit_grant if slug == PROMPTDECK_SLUG else 0
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


def grant_credit_pack_purchase(
    db: Session,
    *,
    purchase: Purchase,
    workspace_id: str,
    user_id: str,
) -> CreditWallet:
    pack_slug = str((purchase.metadata_json or {}).get("pack_slug") or "").strip().lower()
    pack = get_credit_pack(pack_slug)
    if pack is None:
        raise ValueError("Unknown credit pack")

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
            delta=int(pack["credits"]),
            reason="credit_pack_purchase",
            purchase_id=purchase.id,
            metadata={"pack_slug": pack["slug"], "pack_name": pack["name"]},
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
