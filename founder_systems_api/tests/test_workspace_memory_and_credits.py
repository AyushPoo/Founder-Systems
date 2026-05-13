from __future__ import annotations

import asyncio
import importlib
import json
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import httpx


def _bootstrap_app(monkeypatch, tmp_path: Path):
    db_path = tmp_path / "founder-systems-api.sqlite3"
    monkeypatch.setenv("FS_DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("FS_ENV", "development")
    monkeypatch.setenv("FS_SESSION_SECRET", "test-secret")
    monkeypatch.setenv("FS_SESSION_COOKIE_DOMAIN", "")
    monkeypatch.setenv("FS_SESSION_COOKIE_SECURE", "false")
    monkeypatch.setenv("FS_ALLOW_MOCK_PAYMENTS", "true")
    monkeypatch.setenv("FS_SITE_APP_URL", "https://foundersystems.in")
    monkeypatch.setenv("FS_ACCOUNT_APP_URL", "https://account.foundersystems.in")
    monkeypatch.setenv("FS_PROMPTDECK_APP_URL", "https://promptdeck.foundersystems.in")
    monkeypatch.setenv("FS_GOOGLE_CLIENT_ID", "google-client-id")
    monkeypatch.setenv("FS_GOOGLE_CLIENT_SECRET", "google-client-secret")

    for module_name in list(sys.modules):
        if module_name.startswith("founder_systems_api.app"):
            sys.modules.pop(module_name, None)

    main = importlib.import_module("founder_systems_api.app.main")
    main.Base.metadata.drop_all(bind=main.engine)
    main.Base.metadata.create_all(bind=main.engine)
    with main.Session(bind=main.engine) as db:
        main.ensure_seed_data(db, main.settings)
    return main


def _extract_magic_token(magic_link_url: str) -> str:
    parsed = urlparse(magic_link_url)
    token = parse_qs(parsed.query).get("token", [""])[0].strip()
    assert token, f"Expected token query param in {magic_link_url}"
    return token


async def _authenticate(client: httpx.AsyncClient) -> tuple[dict, str]:
    start = await client.post(
        "/auth/magic-link/start",
        json={
            "email": "founder@example.com",
            "name": "Founder",
            "next_url": "https://foundersystems.in/account",
        },
    )
    assert start.status_code == 200, start.text
    payload = start.json()
    token = _extract_magic_token(payload["magic_link_url"])
    verify = await client.post("/auth/magic-link/verify", json={"token": token})
    assert verify.status_code == 200, verify.text
    return payload, token


async def _run_with_client(main, coro):
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        return await coro(client)


def test_workspace_bootstraps_default_account_memory_and_wallet(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        workspace = await client.get("/workspace")
        assert workspace.status_code == 200, workspace.text
        body = workspace.json()
        assert body["workspace"]["slug"] == "founder-workspace"
        assert body["membership"]["role"] == "owner"

        wallet = await client.get("/wallet")
        assert wallet.status_code == 200, wallet.text
        wallet_body = wallet.json()
        assert wallet_body["wallet"]["balance"] == 0
        assert [pack["slug"] for pack in wallet_body["packs"]] == ["starter", "builder", "scale"]

        memory = await client.get("/workspace/memory")
        assert memory.status_code == 200, memory.text
        assert memory.json()["items"] == []

    asyncio.run(_run_with_client(main, scenario))


def test_workspace_memory_can_be_created_edited_archived_and_promoted(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        created = await client.post(
            "/workspace/memory",
            json={
                "memory_scope": "product_native",
                "type": "messaging_angle",
                "label": "Ops-first wedge",
                "value_json": {"text": "We replace founder-led follow-ups with a weekly operating system."},
                "summary_text": "Founder is positioning around replacing scattered founder follow-ups.",
                "source_product": "founder-outreach-kit",
                "source_session_id": "session-001",
                "confidence": "draft",
                "visibility": "selected_products",
                "selected_products": ["founder-spec-generator", "promptdeck-ai"],
            },
        )
        assert created.status_code == 200, created.text
        item = created.json()
        assert item["memory_scope"] == "product_native"
        assert item["type"] == "messaging_angle"

        updated = await client.patch(
            f"/workspace/memory/{item['id']}",
            json={
                "label": "Ops system wedge",
                "summary_text": "Founder refined the wedge to an operating-system framing.",
                "confidence": "confirmed",
            },
        )
        assert updated.status_code == 200, updated.text
        updated_body = updated.json()
        assert updated_body["label"] == "Ops system wedge"
        assert updated_body["confidence"] == "confirmed"

        promoted = await client.post(
            f"/workspace/memory/{item['id']}/promote",
            json={
                "type": "offer",
                "label": "Offer",
                "summary_text": "Founder wants this offer promoted into shared workspace memory.",
                "visibility": "workspace_shared",
            },
        )
        assert promoted.status_code == 200, promoted.text
        promoted_body = promoted.json()
        assert promoted_body["memory_scope"] == "canonical"
        assert promoted_body["type"] == "offer"
        assert promoted_body["visibility"] == "workspace_shared"

        archived = await client.patch(
            f"/workspace/memory/{item['id']}",
            json={"status": "archived"},
        )
        assert archived.status_code == 200, archived.text
        assert archived.json()["status"] == "archived"

        memory = await client.get("/workspace/memory?include_archived=1")
        assert memory.status_code == 200, memory.text
        assert memory.json()["items"][0]["status"] == "archived"

    asyncio.run(_run_with_client(main, scenario))


def test_workspace_preferences_and_recommendations_are_memory_aware(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        preference = await client.put(
            "/workspace/preferences/founder-outreach-kit",
            json={
                "import_mode": "always_allow",
                "allow_product_read": True,
                "allow_product_write": True,
                "start_fresh_by_default": False,
            },
        )
        assert preference.status_code == 200, preference.text
        preference_body = preference.json()
        assert preference_body["product_slug"] == "founder-outreach-kit"
        assert preference_body["import_mode"] == "always_allow"

        for payload in (
            {
                "memory_scope": "canonical",
                "type": "target_customer",
                "label": "Target customer",
                "value_json": {"text": "B2B founders running sales from spreadsheets and Notion"},
                "summary_text": "Ideal customer is an early-stage B2B founder still doing outreach manually.",
                "source_product": "founder-spec-generator",
                "source_session_id": "spec-001",
                "confidence": "confirmed",
                "visibility": "workspace_shared",
            },
            {
                "memory_scope": "canonical",
                "type": "offer",
                "label": "Offer",
                "value_json": {"text": "Founder operating system for weekly execution"},
                "summary_text": "Offer is an operating system that replaces scattered founder execution rituals.",
                "source_product": "founder-spec-generator",
                "source_session_id": "spec-001",
                "confidence": "confirmed",
                "visibility": "workspace_shared",
            },
        ):
            created = await client.post("/workspace/memory", json=payload)
            assert created.status_code == 200, created.text

        recommendations = await client.get("/workspace/recommendations?product_slug=founder-spec-generator")
        assert recommendations.status_code == 200, recommendations.text
        body = recommendations.json()
        assert body["workspace_id"]
        assert body["recommendations"][0]["product_slug"] == "founder-outreach-kit"
        assert body["recommendations"][0]["use_workspace_memory"] is True
        assert "outreach" in body["recommendations"][0]["reason"].lower()

    asyncio.run(_run_with_client(main, scenario))


def test_credit_packs_fund_wallet_and_can_unlock_products(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        order = await client.post("/wallet/packs/checkout", json={"pack_slug": "starter", "currency": "INR"})
        assert order.status_code == 200, order.text
        order_body = order.json()
        assert order_body["pack_slug"] == "starter"
        assert order_body["credits_granted"] == 10

        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_wallet_pack_001",
                        "order_id": order_body["razorpay_order_id"],
                    }
                }
            },
        }
        webhook = await client.post(
            "/webhooks/razorpay",
            content=json.dumps(webhook_payload),
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": "mock-signature",
            },
        )
        assert webhook.status_code == 200, webhook.text
        assert webhook.json()["processed"] is True

        wallet = await client.get("/wallet")
        assert wallet.status_code == 200, wallet.text
        assert wallet.json()["wallet"]["balance"] == 10

        unlock = await client.post("/products/saas-financial-model/unlock-with-credits")
        assert unlock.status_code == 200, unlock.text
        unlock_body = unlock.json()
        assert unlock_body["wallet"]["balance"] == 2
        assert unlock_body["entitlement"]["product_slug"] == "saas-financial-model"

        ledger = await client.get("/wallet/ledger")
        assert ledger.status_code == 200, ledger.text
        ledger_entries = ledger.json()["entries"]
        assert ledger_entries[0]["reason"] == "product_unlock"
        assert ledger_entries[0]["delta"] == -8
        assert any(entry["reason"] == "credit_pack_purchase" and entry["delta"] == 10 for entry in ledger_entries)

    asyncio.run(_run_with_client(main, scenario))
