from __future__ import annotations

import base64
import hashlib
import hmac
import json
import uuid
from typing import Any

import httpx

from .config import Settings


def verify_razorpay_signature(settings: Settings, payload_body: bytes, signature: str | None) -> bool:
    if settings.allow_mock_payments and signature == "mock-signature":
        return True
    if not settings.razorpay_webhook_secret or not signature:
        return False
    digest = hmac.new(
        settings.razorpay_webhook_secret.encode("utf-8"),
        payload_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(digest, signature)


async def create_razorpay_order(
    settings: Settings,
    *,
    amount_minor: int,
    currency: str,
    receipt: str,
    notes: dict[str, Any],
) -> dict[str, Any]:
    if settings.allow_mock_payments and (not settings.razorpay_key_id or not settings.razorpay_key_secret):
        return {
            "id": f"order_mock_{uuid.uuid4().hex[:12]}",
            "amount": amount_minor,
            "currency": currency,
            "receipt": receipt,
            "status": "created",
            "notes": notes,
        }

    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise RuntimeError("Razorpay credentials are not configured")

    auth = base64.b64encode(f"{settings.razorpay_key_id}:{settings.razorpay_key_secret}".encode("utf-8")).decode("ascii")
    headers = {
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/json",
    }
    payload = {
        "amount": amount_minor,
        "currency": currency.upper(),
        "receipt": receipt,
        "notes": notes,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            "https://api.razorpay.com/v1/orders",
            headers=headers,
            content=json.dumps(payload),
        )
        response.raise_for_status()
        return response.json()
