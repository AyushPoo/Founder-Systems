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


class SharedWalletResponse(BaseModel):
    balance: int
    available_balance: int
    reserved_balance: int = 0
    currency_unit: str = "credits"
    credit_type: str = "shared_wallet"
    exhausted: bool


class TelegramLinkStatusResponse(BaseModel):
    linked: bool
    status: str
    bot_username: str | None = None
    telegram_username: str | None = None
    linked_at: datetime | None = None


class TelegramLinkStartRequest(BaseModel):
    product_slug: str = Field(validation_alias=AliasChoices("product_slug", "productSlug", "product", "productId"))


class TelegramLinkStartResponse(BaseModel):
    product_slug: str
    bot_username: str
    bot_url: str
    deep_link_url: str
    token: str
    expires_in_seconds: int


class TelegramLinkVerifyRequest(BaseModel):
    token: str
    telegram_user_id: str = Field(min_length=1, max_length=120)
    telegram_chat_id: str = Field(min_length=1, max_length=120)
    telegram_username: str | None = Field(default=None, max_length=120)


class TelegramLinkVerifyResponse(BaseModel):
    ok: bool = True
    product_slug: str
    linked: bool
    status: str
    bot_username: str | None = None
    telegram_username: str | None = None
    linked_at: datetime | None = None


class AgentRuntimeAccessCheckRequest(BaseModel):
    product_slug: str = Field(validation_alias=AliasChoices("product_slug", "productSlug", "product", "productId"))
    telegram_user_id: str = Field(validation_alias=AliasChoices("telegram_user_id", "telegramUserId"), min_length=1, max_length=120)


class AgentRuntimeMemoryContextRequest(BaseModel):
    product_slug: str = Field(validation_alias=AliasChoices("product_slug", "productSlug", "product", "productId"))
    telegram_user_id: str = Field(validation_alias=AliasChoices("telegram_user_id", "telegramUserId"), min_length=1, max_length=120)


class AgentRuntimeMemoryFactsRequest(BaseModel):
    product_slug: str = Field(validation_alias=AliasChoices("product_slug", "productSlug", "product", "productId"))
    telegram_user_id: str = Field(validation_alias=AliasChoices("telegram_user_id", "telegramUserId"), min_length=1, max_length=120)
    facts: dict[str, str] = Field(default_factory=dict)


class AgentProductStatusResponse(BaseModel):
    product_slug: str
    has_active_pass: bool
    entitlement_status: str | None = None
    telegram_link: TelegramLinkStatusResponse
    workspace_status: str | None = None
    bot_username: str | None = None


class AgentAccountStatusResponse(BaseModel):
    shared_wallet: SharedWalletResponse
    products: list[AgentProductStatusResponse]


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


class PublicCreditMilestoneResponse(BaseModel):
    current_credits: int
    goal_credits: int


class CreditUnlockResponse(BaseModel):
    ok: bool = True
    entitlement: EntitlementResponse
    wallet: CreditWalletResponse


class ProductUsageSpendRequest(BaseModel):
    action: str = Field(default="generate", max_length=120)
    metadata: dict[str, Any] = Field(default_factory=dict)


class AiUsageReserveRequest(BaseModel):
    product_slug: str = Field(validation_alias=AliasChoices("product_slug", "productSlug", "product", "productId"), min_length=1, max_length=120)
    action: str = Field(default="generate", max_length=120)
    reference_id: str = Field(validation_alias=AliasChoices("reference_id", "referenceId"), min_length=1, max_length=160)
    amount: int | None = Field(default=None, ge=1)
    credits: int | None = Field(default=None, ge=1)
    provider: str = Field(default="unknown", max_length=80)
    model_id: str = Field(default="unknown", validation_alias=AliasChoices("model_id", "modelId"), max_length=200)
    telegram_user_id: str | None = Field(default=None, validation_alias=AliasChoices("telegram_user_id", "telegramUserId"), max_length=120)
    user_id: str | None = Field(default=None, validation_alias=AliasChoices("user_id", "userId"), max_length=36)
    workspace_id: str | None = Field(default=None, validation_alias=AliasChoices("workspace_id", "workspaceId"), max_length=36)
    estimated_input_chars: int = Field(default=0, validation_alias=AliasChoices("estimated_input_chars", "estimatedInputChars"), ge=0)
    estimated_output_tokens: int = Field(default=0, validation_alias=AliasChoices("estimated_output_tokens", "estimatedOutputTokens"), ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class AiUsageFinalizeRequest(BaseModel):
    reference_id: str = Field(validation_alias=AliasChoices("reference_id", "referenceId"), min_length=1, max_length=160)
    credits: int | None = Field(default=None, ge=0)
    actual_input_tokens: int = Field(default=0, validation_alias=AliasChoices("actual_input_tokens", "actualInputTokens"), ge=0)
    actual_output_tokens: int = Field(default=0, validation_alias=AliasChoices("actual_output_tokens", "actualOutputTokens"), ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class AiUsageReleaseRequest(BaseModel):
    reference_id: str = Field(validation_alias=AliasChoices("reference_id", "referenceId"), min_length=1, max_length=160)
    reason: str = Field(default="released", max_length=160)
    metadata: dict[str, Any] = Field(default_factory=dict)


class AiUsageGuardResponse(BaseModel):
    ok: bool
    state: str
    reference_id: str
    reason: str | None = None
    reservation_id: str | None = None
    credits: int = 0
    wallet_balance: int | None = None
    policy_status: str | None = None


class AiModelPolicyResponse(BaseModel):
    id: str
    provider: str
    model_id: str
    status: str
    max_input_chars: int
    max_output_tokens: int
    daily_global_limit: int
    cost_per_1k_input_minor: int
    cost_per_1k_output_minor: int
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class AiModelPolicyPatchRequest(BaseModel):
    status: str | None = Field(default=None, max_length=32)
    max_input_chars: int | None = Field(default=None, ge=1)
    max_output_tokens: int | None = Field(default=None, ge=1)
    daily_global_limit: int | None = Field(default=None, ge=0)


class UserAccessBlockRequest(BaseModel):
    reason: str = Field(default="Manual admin block", max_length=240)
    metadata: dict[str, Any] = Field(default_factory=dict)


class CostGuardSummaryResponse(BaseModel):
    allowed_24h: int
    denied_24h: int
    finalized_24h: int
    credits_spent_24h: int
    active_blocks: int
    disabled_models: int


class CostGuardUserRow(BaseModel):
    user_id: str
    email: EmailStr
    wallet_balance: int
    allowed_24h: int
    denied_24h: int
    credits_spent_24h: int
    blocked: bool
    last_event_at: datetime | None = None


class CostGuardEventResponse(BaseModel):
    id: str
    reference_id: str
    user_id: str | None = None
    product_slug: str
    action: str
    provider: str
    model_id: str
    phase: str
    decision: str
    reason: str
    credits: int
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class IntegrationAccountResponse(BaseModel):
    provider: str
    integration_slug: str
    status: str
    account_email: EmailStr | None = None
    display_name: str | None = None
    scopes: list[str] = Field(default_factory=list)
    can_send: bool = False
    connected_at: datetime | None = None
    last_used_at: datetime | None = None


class IntegrationStatusEnvelope(BaseModel):
    integrations: list[IntegrationAccountResponse] = Field(default_factory=list)


class GmailSendRequest(BaseModel):
    product_slug: str = Field(validation_alias=AliasChoices("product_slug", "productSlug", "product", "productId"), min_length=1, max_length=120)
    reference_id: str = Field(validation_alias=AliasChoices("reference_id", "referenceId"), min_length=1, max_length=160)
    user_id: str | None = Field(default=None, validation_alias=AliasChoices("user_id", "userId"), max_length=36)
    telegram_user_id: str | None = Field(default=None, validation_alias=AliasChoices("telegram_user_id", "telegramUserId"), max_length=120)
    to: list[EmailStr] = Field(min_length=1, max_length=25)
    cc: list[EmailStr] = Field(default_factory=list, max_length=25)
    bcc: list[EmailStr] = Field(default_factory=list, max_length=25)
    subject: str = Field(min_length=1, max_length=240)
    body_text: str = Field(validation_alias=AliasChoices("body_text", "bodyText"), min_length=1, max_length=50000)
    body_html: str | None = Field(default=None, validation_alias=AliasChoices("body_html", "bodyHtml"), max_length=100000)
    approval_text: str = Field(validation_alias=AliasChoices("approval_text", "approvalText"), min_length=1, max_length=1000)
    metadata: dict[str, Any] = Field(default_factory=dict)


class GmailSendResponse(BaseModel):
    ok: bool
    provider: str = "google"
    integration_slug: str = "gmail"
    provider_message_id: str | None = None
    thread_id: str | None = None
    credits_spent: int = 0
    from_email: EmailStr | None = None


class ConnectorActionBaseRequest(BaseModel):
    product_slug: str = Field(validation_alias=AliasChoices("product_slug", "productSlug", "product", "productId"), min_length=1, max_length=120)
    reference_id: str = Field(validation_alias=AliasChoices("reference_id", "referenceId"), min_length=1, max_length=160)
    user_id: str | None = Field(default=None, validation_alias=AliasChoices("user_id", "userId"), max_length=36)
    telegram_user_id: str | None = Field(default=None, validation_alias=AliasChoices("telegram_user_id", "telegramUserId"), max_length=120)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ApprovedConnectorActionRequest(ConnectorActionBaseRequest):
    approval_text: str = Field(validation_alias=AliasChoices("approval_text", "approvalText"), min_length=1, max_length=1000)


class GoogleDocCreateRequest(ApprovedConnectorActionRequest):
    title: str = Field(min_length=1, max_length=240)
    body_text: str = Field(validation_alias=AliasChoices("body_text", "bodyText"), min_length=1, max_length=100000)


class GoogleDocCreateResponse(BaseModel):
    ok: bool
    provider: str = "google"
    integration_slug: str = "google-docs"
    document_id: str
    document_url: str
    credits_spent: int = 0


class GoogleSheetCreateRequest(ApprovedConnectorActionRequest):
    title: str = Field(min_length=1, max_length=240)
    sheet_name: str = Field(default="Sheet1", validation_alias=AliasChoices("sheet_name", "sheetName"), min_length=1, max_length=80)
    values: list[list[Any]] = Field(default_factory=list, max_length=500)
    freeze_rows: int = Field(default=0, validation_alias=AliasChoices("freeze_rows", "freezeRows"), ge=0, le=50)
    column_widths: list[int] = Field(default_factory=list, validation_alias=AliasChoices("column_widths", "columnWidths"), max_length=26)
    bold_rows: list[int] = Field(default_factory=list, validation_alias=AliasChoices("bold_rows", "boldRows"), max_length=200)
    currency_columns: list[int] = Field(default_factory=list, validation_alias=AliasChoices("currency_columns", "currencyColumns"), max_length=26)


class GoogleSheetCreateResponse(BaseModel):
    ok: bool
    provider: str = "google"
    integration_slug: str = "google-sheets"
    spreadsheet_id: str
    spreadsheet_url: str | None = None
    updated_rows: int = 0
    credits_spent: int = 0


class GoogleCalendarEventCreateRequest(ApprovedConnectorActionRequest):
    summary: str = Field(min_length=1, max_length=240)
    start_at: datetime = Field(validation_alias=AliasChoices("start_at", "startAt"))
    end_at: datetime = Field(validation_alias=AliasChoices("end_at", "endAt"))
    timezone: str = Field(default="UTC", max_length=80)
    description: str | None = Field(default=None, max_length=20000)
    location: str | None = Field(default=None, max_length=500)
    attendees: list[EmailStr] = Field(default_factory=list, max_length=25)


class GoogleCalendarEventCreateResponse(BaseModel):
    ok: bool
    provider: str = "google"
    integration_slug: str = "google-calendar"
    event_id: str
    html_link: str | None = None
    credits_spent: int = 0


class GoogleSearchConsoleQueryRequest(ConnectorActionBaseRequest):
    site_url: str = Field(validation_alias=AliasChoices("site_url", "siteUrl"), min_length=1, max_length=500)
    start_date: str = Field(validation_alias=AliasChoices("start_date", "startDate"), min_length=10, max_length=10)
    end_date: str = Field(validation_alias=AliasChoices("end_date", "endDate"), min_length=10, max_length=10)
    dimensions: list[str] = Field(default_factory=lambda: ["query"], max_length=5)
    row_limit: int = Field(default=25, validation_alias=AliasChoices("row_limit", "rowLimit"), ge=1, le=250)


class GoogleRowsResponse(BaseModel):
    ok: bool
    provider: str = "google"
    integration_slug: str
    rows: list[dict[str, Any]] = Field(default_factory=list)
    credits_spent: int = 0


class GoogleAnalyticsRunReportRequest(ConnectorActionBaseRequest):
    property_id: str = Field(validation_alias=AliasChoices("property_id", "propertyId"), min_length=1, max_length=80)
    start_date: str = Field(validation_alias=AliasChoices("start_date", "startDate"), min_length=10, max_length=10)
    end_date: str = Field(validation_alias=AliasChoices("end_date", "endDate"), min_length=10, max_length=10)
    metrics: list[str] = Field(default_factory=lambda: ["activeUsers"], min_length=1, max_length=10)
    dimensions: list[str] = Field(default_factory=list, max_length=10)


class RazorpayPaymentsListRequest(ConnectorActionBaseRequest):
    count: int = Field(default=10, ge=1, le=100)
    skip: int = Field(default=0, ge=0, le=10000)
    from_timestamp: int | None = Field(default=None, validation_alias=AliasChoices("from_timestamp", "fromTimestamp", "from"), ge=0)
    to_timestamp: int | None = Field(default=None, validation_alias=AliasChoices("to_timestamp", "toTimestamp", "to"), ge=0)


class RazorpayPaymentsListResponse(BaseModel):
    ok: bool
    provider: str = "razorpay"
    integration_slug: str = "razorpay"
    items: list[dict[str, Any]] = Field(default_factory=list)
    count: int = 0
    credits_spent: int = 0


class GithubIssueCreateRequest(ApprovedConnectorActionRequest):
    repo: str = Field(min_length=3, max_length=200, description="owner/repo")
    title: str = Field(min_length=1, max_length=256)
    body_text: str = Field(default="", validation_alias=AliasChoices("body_text", "bodyText", "body"), max_length=65000)
    labels: list[str] = Field(default_factory=list, max_length=20)


class GithubIssueCreateResponse(BaseModel):
    ok: bool
    provider: str = "github"
    integration_slug: str = "github"
    issue_id: int | None = None
    issue_number: int | None = None
    issue_url: str | None = None
    credits_spent: int = 0


class HubSpotContactCreateRequest(ApprovedConnectorActionRequest):
    email: EmailStr
    first_name: str | None = Field(default=None, validation_alias=AliasChoices("first_name", "firstName"), max_length=120)
    last_name: str | None = Field(default=None, validation_alias=AliasChoices("last_name", "lastName"), max_length=120)
    company: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=80)


class HubSpotContactCreateResponse(BaseModel):
    ok: bool
    provider: str = "hubspot"
    integration_slug: str = "hubspot"
    contact_id: str | None = None
    contact_url: str | None = None
    credits_spent: int = 0


class MailchimpCampaignsListRequest(ConnectorActionBaseRequest):
    count: int = Field(default=10, ge=1, le=100)
    status: str | None = Field(default=None, max_length=40)


class MailchimpCampaignsListResponse(BaseModel):
    ok: bool
    provider: str = "mailchimp"
    integration_slug: str = "mailchimp"
    campaigns: list[dict[str, Any]] = Field(default_factory=list)
    count: int = 0
    credits_spent: int = 0


class MetaAdsInsightsRequest(ConnectorActionBaseRequest):
    ad_account_id: str = Field(validation_alias=AliasChoices("ad_account_id", "adAccountId", "accountId"), min_length=3, max_length=80)
    date_preset: str = Field(default="last_30d", validation_alias=AliasChoices("date_preset", "datePreset"), max_length=40)
    level: str = Field(default="campaign", max_length=40)
    limit: int = Field(default=10, ge=1, le=100)


class MetaAdsInsightsResponse(BaseModel):
    ok: bool
    provider: str = "meta"
    integration_slug: str = "meta-ads"
    rows: list[dict[str, Any]] = Field(default_factory=list)
    credits_spent: int = 0
