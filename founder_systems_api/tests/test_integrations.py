from __future__ import annotations

import asyncio
import importlib
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import httpx


def _bootstrap_app(monkeypatch, tmp_path: Path):
    db_path = tmp_path / "founder-systems-api.sqlite3"
    monkeypatch.setenv("FS_DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("FS_ENV", "development")
    monkeypatch.setenv("FS_SESSION_SECRET", "test-secret")
    monkeypatch.setenv("FS_INTEGRATION_TOKEN_SECRET", "integration-secret")
    monkeypatch.setenv("FS_SESSION_COOKIE_DOMAIN", "")
    monkeypatch.setenv("FS_SESSION_COOKIE_SECURE", "false")
    monkeypatch.setenv("FS_ALLOW_MOCK_PAYMENTS", "true")
    monkeypatch.setenv("FS_SITE_APP_URL", "https://foundersystems.in")
    monkeypatch.setenv("FS_ACCOUNT_APP_URL", "https://account.foundersystems.in")
    monkeypatch.setenv("FS_PROMPTDECK_APP_URL", "https://promptdeck.foundersystems.in")
    monkeypatch.setenv("FS_PUBLIC_API_URL", "http://localhost:8000")
    monkeypatch.setenv("FS_GOOGLE_CLIENT_ID", "google-client-id")
    monkeypatch.setenv("FS_GOOGLE_CLIENT_SECRET", "google-client-secret")
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "internal-secret")
    monkeypatch.setenv("FS_ADMIN_EMAILS", "founder@example.com")

    for module_name in list(sys.modules):
        if module_name.startswith("founder_systems_api.app"):
            sys.modules.pop(module_name, None)

    main = importlib.import_module("founder_systems_api.app.main")
    main.Base.metadata.drop_all(bind=main.engine)
    main.Base.metadata.create_all(bind=main.engine)
    with main.Session(bind=main.engine) as db:
        main.ensure_seed_data(db, main.settings)
        main.ensure_default_ai_model_policies(db, main.settings)
    return main


async def _run_with_client(main, coro):
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        return await coro(client)


async def _authenticate(client: httpx.AsyncClient) -> None:
    start = await client.post(
        "/auth/magic-link/start",
        json={
            "email": "founder@example.com",
            "name": "Founder",
            "next_url": "https://foundersystems.in/account",
        },
    )
    assert start.status_code == 200, start.text
    magic_url = start.json()["magic_link_url"]
    token = parse_qs(urlparse(magic_url).query)["token"][0]
    verify = await client.post("/auth/magic-link/verify", json={"token": token, "remember_me": True})
    assert verify.status_code == 200, verify.text


def test_gmail_connect_start_redirects_to_google_with_send_scope(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        response = await client.get(
            "/integrations/google/gmail/start",
            params={"next": "https://foundersystems.in/account?tab=settings"},
            follow_redirects=False,
        )
        assert response.status_code == 303, response.text
        location = response.headers["location"]
        assert location.startswith("https://accounts.google.com/o/oauth2/v2/auth")
        params = parse_qs(urlparse(location).query)
        assert params["client_id"][0] == "google-client-id"
        assert params["redirect_uri"][0] == "http://localhost:8000/auth/google/callback"
        assert params["access_type"][0] == "offline"
        assert params["prompt"][0] == "consent"
        scope = set(params["scope"][0].split())
        assert "openid" in scope
        assert "email" in scope
        assert "profile" in scope
        assert "https://www.googleapis.com/auth/gmail.send" in scope
        assert params["state"][0]

    asyncio.run(_run_with_client(main, scenario))


def test_gmail_callback_stores_connected_account(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        start = await client.get("/integrations/google/gmail/start", follow_redirects=False)
        state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def post(self, url, **kwargs):
                assert url == "https://oauth2.googleapis.com/token"
                return httpx.Response(
                    200,
                    json={
                        "access_token": "gmail-access-token",
                        "refresh_token": "gmail-refresh-token",
                        "expires_in": 3600,
                        "scope": "openid email profile https://www.googleapis.com/auth/gmail.send",
                        "token_type": "Bearer",
                    },
                )

            async def get(self, url, **kwargs):
                assert url == "https://openidconnect.googleapis.com/v1/userinfo"
                return httpx.Response(
                    200,
                    json={
                        "email": "founder@gmail.com",
                        "email_verified": True,
                        "name": "Founder Gmail",
                    },
                )

        monkeypatch.setattr(main.httpx, "AsyncClient", FakeAsyncClient)
        callback = await client.get(
            "/auth/google/callback",
            params={"code": "oauth-code", "state": state},
            follow_redirects=False,
        )
        assert callback.status_code == 303, callback.text
        assert callback.headers["location"] == "https://foundersystems.in/account?tab=settings&integration=gmail-connected"

        status = await client.get("/integrations")
        assert status.status_code == 200, status.text
        gmail = status.json()["integrations"][0]
        assert gmail["provider"] == "google"
        assert gmail["integration_slug"] == "gmail"
        assert gmail["status"] == "connected"
        assert gmail["account_email"] == "founder@gmail.com"
        assert gmail["can_send"] is True

    asyncio.run(_run_with_client(main, scenario))


def test_internal_gmail_send_uses_user_connection_and_burns_credit(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        session = await client.get("/auth/session")
        user_id = session.json()["user"]["id"]

        with main.Session(bind=main.engine) as db:
            user = db.get(main.User, user_id)
            purchase = main.Purchase(
                user_id=user.id,
                status="paid",
                currency="INR",
                amount_minor=99900,
                metadata_json={"kind": "test_operator_pass"},
            )
            db.add(purchase)
            db.flush()
            main.grant_product_pass(db, user_id=user.id, product_slug="marketing-agent", purchase=purchase)
            main.grant_shared_wallet_credits(
                db,
                user_id=user.id,
                purchase=purchase,
                credits_granted=3,
            )
            db.commit()

        start = await client.get("/integrations/google/gmail/start", follow_redirects=False)
        state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]
        sent_messages: list[dict] = []

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def post(self, url, **kwargs):
                if url == "https://oauth2.googleapis.com/token":
                    return httpx.Response(
                        200,
                        json={
                            "access_token": "gmail-access-token",
                            "refresh_token": "gmail-refresh-token",
                            "expires_in": 3600,
                            "scope": "openid email profile https://www.googleapis.com/auth/gmail.send",
                            "token_type": "Bearer",
                        },
                    )
                if url == "https://gmail.googleapis.com/gmail/v1/users/me/messages/send":
                    sent_messages.append(kwargs.get("json") or {})
                    return httpx.Response(200, json={"id": "gmail-message-1", "threadId": "thread-1"})
                raise AssertionError(f"Unexpected POST {url}")

            async def get(self, url, **kwargs):
                return httpx.Response(
                    200,
                    json={
                        "email": "founder@gmail.com",
                        "email_verified": True,
                        "name": "Founder Gmail",
                    },
                )

        monkeypatch.setattr(main.httpx, "AsyncClient", FakeAsyncClient)
        callback = await client.get(
            "/auth/google/callback",
            params={"code": "oauth-code", "state": state},
            follow_redirects=False,
        )
        assert callback.status_code == 303, callback.text

        response = await client.post(
            "/v1/internal/runtime/actions/email/send",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "email-send-001",
                "to": ["customer@example.com"],
                "subject": "Welcome from Founder Systems",
                "body_text": "Thanks for joining. This came from the user's Gmail.",
                "approval_text": "Approved by user in Telegram",
            },
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["ok"] is True
        assert body["provider_message_id"] == "gmail-message-1"
        assert body["credits_spent"] == 1
        assert sent_messages and "raw" in sent_messages[0]

        wallet = await client.get("/wallet")
        assert wallet.json()["wallet"]["balance"] == 2
        events = await client.get("/analytics/cost-guard/events", headers={"X-API-Key": "internal-secret"})
        assert any(
            event["reference_id"] == "email-send-001"
            and event["phase"] == "finalize"
            and event["reason"] == "finalized"
            for event in events.json()
        )

    asyncio.run(_run_with_client(main, scenario))
