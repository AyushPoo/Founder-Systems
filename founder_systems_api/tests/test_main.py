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
            "next_url": "https://promptdeck.foundersystems.in",
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


def test_magic_link_creates_session_and_session_snapshot(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)
    
    async def scenario(client: httpx.AsyncClient):
        payload, token = await _authenticate(client)
        assert payload["ok"] is True
        assert token

        session = await client.get("/auth/session")
        assert session.status_code == 200, session.text
        body = session.json()
        assert body["authenticated"] is True
        assert body["session"]["authenticated"] is True
        assert body["user"]["email"] == "founder@example.com"
        assert body["entitlements"] == []

    asyncio.run(_run_with_client(main, scenario))


def test_google_start_redirects_to_google_with_state(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        response = await client.get(
            "/auth/google/start",
            params={
                "next": "https://foundersystems.in/account",
                "remember": 1,
            },
            follow_redirects=False,
        )
        assert response.status_code == 303, response.text
        location = response.headers["location"]
        assert location.startswith("https://accounts.google.com/o/oauth2/v2/auth")
        parsed = urlparse(location)
        params = parse_qs(parsed.query)
        assert params["client_id"][0] == "google-client-id"
        assert params["redirect_uri"][0] == "http://localhost:8000/auth/google/callback"
        assert params["state"][0]

    asyncio.run(_run_with_client(main, scenario))


def test_google_callback_invalid_state_redirects_to_sign_in(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        response = await client.get(
            "/auth/google/callback",
            params={"state": "broken-state", "code": "example"},
            follow_redirects=False,
        )
        assert response.status_code == 303, response.text
        assert response.headers["location"] == "https://foundersystems.in/sign-in?error=google-auth-expired&returnTo=/account"

    asyncio.run(_run_with_client(main, scenario))


def test_promptdeck_access_unlocks_after_checkout_and_webhook(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        before = await client.get("/products/promptdeck-ai/access")
        assert before.status_code == 200, before.text
        before_body = before.json()
        assert before_body["authenticated"] is True
        assert before_body["allowed"] is False
        assert before_body["state"] == "paywall"
        assert before_body["credits_remaining"] == 0

        order = await client.post("/checkout/orders", json={"product_slug": "promptdeck-ai", "currency": "INR"})
        assert order.status_code == 200, order.text
        order_body = order.json()
        assert order_body["product_slug"] == "promptdeck-ai"
        assert order_body["credits_granted"] == 3

        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_001",
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

        after = await client.get("/products/promptdeck-ai/access")
        assert after.status_code == 200, after.text
        after_body = after.json()
        assert after_body["authenticated"] is True
        assert after_body["allowed"] is True
        assert after_body["state"] == "allowed"
        assert after_body["credits_remaining"] == 3
        assert after_body["entitlements"][0]["product_slug"] == "promptdeck-ai"

    asyncio.run(_run_with_client(main, scenario))


def test_catalog_products_seed_and_checkout_use_live_prices(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        promptdeck = await client.post("/checkout/orders", json={"product_slug": "promptdeck-ai", "currency": "INR"})
        assert promptdeck.status_code == 200, promptdeck.text
        promptdeck_body = promptdeck.json()
        assert promptdeck_body["amount_minor"] == 50000
        assert promptdeck_body["credits_granted"] == 3

        saas_model = await client.post("/checkout/orders", json={"product_slug": "saas-financial-model", "currency": "INR"})
        assert saas_model.status_code == 200, saas_model.text
        saas_body = saas_model.json()
        assert saas_body["product_slug"] == "saas-financial-model"
        assert saas_body["amount_minor"] == 149900
        assert saas_body["credits_granted"] == 0

    asyncio.run(_run_with_client(main, scenario))


def test_non_promptdeck_purchase_is_recorded_without_generation_credits(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        order = await client.post("/checkout/orders", json={"product_slug": "saas-financial-model", "currency": "INR"})
        assert order.status_code == 200, order.text
        order_body = order.json()

        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_fin_001",
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

        purchases = await client.get("/purchases")
        assert purchases.status_code == 200, purchases.text
        body = purchases.json()
        assert len(body) == 1
        assert body[0]["status"] == "paid"
        assert body[0]["items"][0]["product_slug"] == "saas-financial-model"

        access = await client.get("/products/promptdeck-ai/access")
        assert access.status_code == 200, access.text
        access_body = access.json()
        assert access_body["credits_remaining"] == 0

    asyncio.run(_run_with_client(main, scenario))


def test_credit_consume_is_idempotent_per_project(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        order = await client.post("/checkout/orders", json={"product_slug": "promptdeck-ai", "currency": "INR"})
        order_body = order.json()
        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_002",
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

        consume_first = await client.post(
            "/products/promptdeck-ai/credits/consume",
            json={"amount": 1, "project_id": "job-123", "source_kind": "build"},
        )
        assert consume_first.status_code == 200, consume_first.text
        assert consume_first.json()["balance"] == 2

        consume_second = await client.post(
            "/products/promptdeck-ai/credits/consume",
            json={"amount": 1, "project_id": "job-123", "source_kind": "build"},
        )
        assert consume_second.status_code == 200, consume_second.text
        assert consume_second.json()["balance"] == 2

    asyncio.run(_run_with_client(main, scenario))


def test_generate_access_requires_more_credits_after_balance_hits_zero(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        order = await client.post("/checkout/orders", json={"product_slug": "promptdeck-ai", "currency": "INR"})
        order_body = order.json()
        webhook_payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_003",
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

        for project_id in ("job-201", "job-202", "job-203"):
            consume = await client.post(
                "/products/promptdeck-ai/credits/consume",
                json={"amount": 1, "project_id": project_id, "source_kind": "build"},
            )
            assert consume.status_code == 200, consume.text

        access_state = await client.get("/products/promptdeck-ai/access-state?capability=generate")
        assert access_state.status_code == 200, access_state.text
        body = access_state.json()
        assert body["allowed"] is False
        assert body["state"] == "paywall"
        assert body["reason"] == "missing_credits"
        assert body["credits_remaining"] == 0
        assert body["paywall"]["title"] == "Refill PromptDeck credits"
        assert body["paywall"]["ctaLabel"] == "Buy more credits"

    asyncio.run(_run_with_client(main, scenario))


def test_admin_session_and_access_responses_expose_promptdeck_bypass(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_ADMIN_EMAILS", "founder@example.com,ops@example.com")
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        session = await client.get("/auth/session")
        assert session.status_code == 200, session.text
        session_body = session.json()
        assert session_body["authenticated"] is True
        assert session_body["is_admin"] is True
        assert session_body["admin_bypass"]["promptdeck"] is True
        assert session_body["session"]["is_admin"] is True
        assert session_body["session"]["admin_bypass"]["promptdeck"] is True
        assert session_body["user"]["is_admin"] is True

        access = await client.get("/products/promptdeck-ai/access-summary")
        assert access.status_code == 200, access.text
        access_body = access.json()
        assert access_body["logged_in"] is True
        assert access_body["entitled"] is True
        assert access_body["admin_bypass"] is True
        assert access_body["credits_remaining"] == 0

        access_state = await client.get("/products/promptdeck-ai/access-state?capability=generate")
        assert access_state.status_code == 200, access_state.text
        state_body = access_state.json()
        assert state_body["allowed"] is True
        assert state_body["state"] == "allowed"
        assert state_body["reason"] == "admin_bypass"
        assert state_body["admin_bypass"] is True
        assert state_body["paywall"] is None

    asyncio.run(_run_with_client(main, scenario))


def test_admin_can_consume_promptdeck_generation_without_entitlement_or_credits(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_ADMIN_EMAILS", "founder@example.com")
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        consume = await client.post(
            "/products/promptdeck-ai/credits/consume",
            json={"amount": 1, "project_id": "admin-job-001", "source_kind": "build"},
        )
        assert consume.status_code == 200, consume.text
        body = consume.json()
        assert body["product_slug"] == "promptdeck-ai"
        assert body["balance"] == 0

        access_state = await client.get("/products/promptdeck-ai/access-state?capability=generate")
        assert access_state.status_code == 200, access_state.text
        state_body = access_state.json()
        assert state_body["allowed"] is True
        assert state_body["reason"] == "admin_bypass"
        assert state_body["credits_remaining"] == 0

    asyncio.run(_run_with_client(main, scenario))
