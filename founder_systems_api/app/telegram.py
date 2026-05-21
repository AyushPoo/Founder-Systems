from __future__ import annotations

from urllib.parse import quote

from .agents import AGENT_PRODUCT_SLUGS
from .models import TelegramLink, utc_now
from .schemas import TelegramLinkStatusResponse

AGENT_TELEGRAM_BOT_USERNAMES = {
    "marketing-agent": "FSMaAgBot",
    "finance-agent": "founder_systems_finance_bot",
    "ops-agent": "founder_systems_ops_bot",
}

TELEGRAM_LINK_TOKEN_EXPIRES_AT_KEY = "link_token_expires_at"


def get_agent_bot_username(product_slug: str) -> str | None:
    normalized = str(product_slug or "").strip()
    if normalized not in AGENT_PRODUCT_SLUGS:
        return None
    return AGENT_TELEGRAM_BOT_USERNAMES.get(normalized)


def build_agent_bot_url(product_slug: str) -> str | None:
    bot_username = get_agent_bot_username(product_slug)
    if not bot_username:
        return None
    return f"https://t.me/{bot_username}"


def build_agent_bot_deep_link(product_slug: str, token: str) -> str | None:
    bot_url = build_agent_bot_url(product_slug)
    normalized_token = str(token or "").strip()
    if not bot_url or not normalized_token:
        return None
    return f"{bot_url}?start={quote(normalized_token, safe='')}"


def telegram_link_to_status(product_slug: str, link: TelegramLink | None) -> TelegramLinkStatusResponse:
    bot_username = get_agent_bot_username(product_slug)
    if link is None:
        return TelegramLinkStatusResponse(linked=False, status="unlinked", bot_username=bot_username)
    status = link.status
    if status == "pending":
        expires_at = (link.metadata_json or {}).get(TELEGRAM_LINK_TOKEN_EXPIRES_AT_KEY)
        try:
            expires_at = int(expires_at) if expires_at not in (None, "") else None
        except (TypeError, ValueError):
            expires_at = None
        if expires_at is not None and expires_at < int(utc_now().timestamp()):
            status = "expired"
    return TelegramLinkStatusResponse(
        linked=status == "linked",
        status=status,
        bot_username=bot_username,
        telegram_username=link.telegram_username,
        linked_at=link.linked_at,
    )
