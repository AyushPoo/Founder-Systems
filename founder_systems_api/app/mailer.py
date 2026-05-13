from __future__ import annotations

import json

import httpx

from .config import Settings


async def send_magic_link_email(settings: Settings, *, to_email: str, magic_link_url: str) -> None:
    if not settings.resend_api_key or not settings.resend_from_email:
        print(
            json.dumps(
                {
                    "type": "magic_link_dev_fallback",
                    "email": to_email,
                    "magic_link_url": magic_link_url,
                }
            )
        )
        return

    payload = {
        "from": settings.resend_from_email,
        "to": [to_email],
        "subject": "Your Founder Systems sign-in link",
        "html": (
            "<p>Use the secure magic link below to sign in to Founder Systems.</p>"
            f"<p><a href=\"{magic_link_url}\">{magic_link_url}</a></p>"
            "<p>This link expires soon. If you didn't request it, you can ignore this email.</p>"
        ),
    }
    headers = {
        "Authorization": f"Bearer {settings.resend_api_key}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post("https://api.resend.com/emails", headers=headers, json=payload)
        response.raise_for_status()
