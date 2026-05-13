from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import AliasChoices, BaseModel, EmailStr, Field


class MagicLinkStartRequest(BaseModel):
    email: EmailStr
    name: str | None = Field(default=None, max_length=160)
    next_url: str | None = None
    remember_me: bool = False


class MagicLinkVerifyRequest(BaseModel):
    token: str
    remember_me: bool = False


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str | None
    created_at: datetime
    last_seen_at: datetime
    is_admin: bool = False


class SessionResponse(BaseModel):
    authenticated: bool
    user: UserResponse | None = None
    is_admin: bool = False
    admin_bypass: dict[str, bool] = Field(default_factory=dict)


class MagicLinkStartResponse(BaseModel):
    ok: bool = True
    message: str
    magic_link_url: str | None = None


class EntitlementResponse(BaseModel):
    id: str
    product_slug: str
    status: str
    starts_at: datetime
    ends_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AccessResponse(BaseModel):
    logged_in: bool
    entitled: bool
    product_slug: str
    credits_remaining: int
    entitlement: EntitlementResponse | None = None
    launch_url: str | None = None
    admin_bypass: bool = False


class CheckoutOrderRequest(BaseModel):
    product_slug: str = Field(validation_alias=AliasChoices("product_slug", "productSlug", "product", "productId"))
    currency: str = Field(default="INR", max_length=8)
    price_id: str | None = None


class CheckoutOrderResponse(BaseModel):
    purchase_id: str
    razorpay_order_id: str
    key_id: str
    amount_minor: int
    currency: str
    product_slug: str
    product_name: str
    credits_granted: int


class ClientCheckoutConfirmRequest(BaseModel):
    purchase_id: str
    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class CreditPurchaseRequest(BaseModel):
    currency: str = Field(default="INR", max_length=8)


class CreditConsumeRequest(BaseModel):
    amount: int = Field(default=1, ge=1)
    source_kind: str = Field(default="build", max_length=64)
    project_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class CreditBalanceResponse(BaseModel):
    product_slug: str
    credit_type: str
    balance: int


class ProductProjectRequest(BaseModel):
    external_project_id: str = Field(min_length=1, max_length=120)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProductProjectResponse(BaseModel):
    id: str
    product_slug: str
    external_project_id: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class RazorpayWebhookAck(BaseModel):
    ok: bool = True
    processed: bool


class PriceResponse(BaseModel):
    id: str
    currency: str
    amount_minor: int
    plan_type: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProductStatusResponse(BaseModel):
    slug: str
    name: str
    status: str
    prices: list[PriceResponse]


class PurchaseItemResponse(BaseModel):
    id: str
    product_id: str
    price_id: str
    quantity: int
    product_slug: str | None = None
    product_name: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class PurchaseResponse(BaseModel):
    id: str
    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None
    status: str
    currency: str
    amount_minor: int
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    items: list[PurchaseItemResponse] = Field(default_factory=list)


class WorkspaceResponse(BaseModel):
    id: str
    slug: str
    name: str
    status: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class WorkspaceMemberResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: str
    status: str
    created_at: datetime


class WorkspaceBootstrapResponse(BaseModel):
    workspace: WorkspaceResponse
    membership: WorkspaceMemberResponse


class WorkspaceMemoryItemCreateRequest(BaseModel):
    memory_scope: str = Field(default="product_native")
    type: str = Field(min_length=1, max_length=120)
    label: str = Field(min_length=1, max_length=160)
    value_json: dict[str, Any] = Field(default_factory=dict)
    summary_text: str = ""
    source_product: str = Field(min_length=1, max_length=120)
    source_session_id: str | None = Field(default=None, max_length=160)
    confidence: str = Field(default="draft", max_length=32)
    visibility: str = Field(default="private", max_length=32)
    selected_products: list[str] = Field(default_factory=list)
    editable: bool = True


class WorkspaceMemoryItemUpdateRequest(BaseModel):
    label: str | None = Field(default=None, max_length=160)
    value_json: dict[str, Any] | None = None
    summary_text: str | None = None
    confidence: str | None = Field(default=None, max_length=32)
    status: str | None = Field(default=None, max_length=32)
    visibility: str | None = Field(default=None, max_length=32)
    selected_products: list[str] | None = None
    editable: bool | None = None
    last_used_at: datetime | None = None


class WorkspaceMemoryPromoteRequest(BaseModel):
    type: str | None = Field(default=None, max_length=120)
    label: str | None = Field(default=None, max_length=160)
    summary_text: str | None = None
    visibility: str = Field(default="workspace_shared", max_length=32)
    selected_products: list[str] = Field(default_factory=list)


class WorkspaceMemoryItemResponse(BaseModel):
    id: str
    workspace_id: str
    memory_scope: str
    type: str
    label: str
    value_json: dict[str, Any] = Field(default_factory=dict)
    summary_text: str
    source_product: str
    source_session_id: str | None = None
    updated_by: str | None = None
    confidence: str
    status: str
    visibility: str
    selected_products: list[str] = Field(default_factory=list)
    editable: bool
    last_used_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class WorkspaceMemoryListResponse(BaseModel):
    items: list[WorkspaceMemoryItemResponse] = Field(default_factory=list)


class WorkspaceProductPreferenceRequest(BaseModel):
    import_mode: str = Field(default="ask", max_length=32)
    allow_product_read: bool = True
    allow_product_write: bool = True
    allow_inferred_suggestions: bool = True
    allow_save_to_workspace: bool = True
    start_fresh_by_default: bool = False


class WorkspaceProductPreferenceResponse(BaseModel):
    id: str
    workspace_id: str
    product_slug: str
    import_mode: str
    allow_product_read: bool
    allow_product_write: bool
    allow_inferred_suggestions: bool
    allow_save_to_workspace: bool
    start_fresh_by_default: bool
    created_at: datetime
    updated_at: datetime


class WorkspaceRecommendationResponse(BaseModel):
    product_slug: str
    reason: str
    use_workspace_memory: bool = True
    suggested_memory_types: list[str] = Field(default_factory=list)


class WorkspaceRecommendationsEnvelope(BaseModel):
    workspace_id: str
    recommendations: list[WorkspaceRecommendationResponse] = Field(default_factory=list)


class CreditPackCheckoutRequest(BaseModel):
    pack_slug: str | None = Field(default=None, min_length=1, max_length=64)
    credits: int | None = Field(default=None, ge=1, le=500)
    currency: str = Field(default="INR", max_length=8)


class CreditPackCheckoutResponse(BaseModel):
    purchase_id: str
    razorpay_order_id: str
    key_id: str
    amount_minor: int
    currency: str
    pack_slug: str
    pack_name: str
    credits_granted: int
    unit_amount_minor: int


class CreditPackResponse(BaseModel):
    slug: str
    name: str
    amount_minor: int
    currency: str
    credits: int
    bonus_credits: int = 0
    price_options_minor: dict[str, int] = Field(default_factory=dict)


class CreditWalletResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    currency_unit: str
    balance: int
    created_at: datetime
    updated_at: datetime


class CreditLedgerEntryResponse(BaseModel):
    id: str
    wallet_id: str
    workspace_id: str
    user_id: str
    delta: int
    reason: str
    product_slug: str | None = None
    purchase_id: str | None = None
    usage_event_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class CreditWalletEnvelope(BaseModel):
    wallet: CreditWalletResponse
    packs: list[CreditPackResponse] = Field(default_factory=list)
    credit_unit_amounts_minor: dict[str, int] = Field(default_factory=dict)


class CreditWalletLedgerEnvelope(BaseModel):
    entries: list[CreditLedgerEntryResponse] = Field(default_factory=list)


class CreditUnlockResponse(BaseModel):
    ok: bool = True
    entitlement: EntitlementResponse
    wallet: CreditWalletResponse


class ProductUsageSpendRequest(BaseModel):
    action: str = Field(default="generate", max_length=120)
    credits: int = Field(default=1, ge=1)
    metadata: dict[str, Any] = Field(default_factory=dict)
