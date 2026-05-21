from __future__ import annotations

AGENT_PRODUCT_SLUGS = (
    "marketing-agent",
    "finance-agent",
    "ops-agent",
)

AGENT_PASS_DURATION_DAYS = 30

AGENT_PRODUCT_CREDITS = {
    "marketing-agent": 500,
    "finance-agent": 750,
    "ops-agent": 500,
}


def is_agent_product_slug(product_slug: str) -> bool:
    return str(product_slug or "").strip() in AGENT_PRODUCT_SLUGS


def get_agent_shared_wallet_credits(product_slug: str) -> int:
    return int(AGENT_PRODUCT_CREDITS.get(str(product_slug or "").strip()) or 0)
