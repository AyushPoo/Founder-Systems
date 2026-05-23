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
    monkeypatch.setenv("FS_GITHUB_CLIENT_ID", "github-client-id")
    monkeypatch.setenv("FS_GITHUB_CLIENT_SECRET", "github-client-secret")
    monkeypatch.setenv("FS_HUBSPOT_CLIENT_ID", "hubspot-client-id")
    monkeypatch.setenv("FS_HUBSPOT_CLIENT_SECRET", "hubspot-client-secret")
    monkeypatch.setenv("FS_MAILCHIMP_CLIENT_ID", "mailchimp-client-id")
    monkeypatch.setenv("FS_MAILCHIMP_CLIENT_SECRET", "mailchimp-client-secret")
    monkeypatch.setenv("FS_META_CLIENT_ID", "meta-client-id")
    monkeypatch.setenv("FS_META_CLIENT_SECRET", "meta-client-secret")
    monkeypatch.setenv("FS_LINKEDIN_CLIENT_ID", "linkedin-client-id")
    monkeypatch.setenv("FS_LINKEDIN_CLIENT_SECRET", "linkedin-client-secret")
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


def test_google_workspace_connect_start_redirects_with_product_scopes(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        response = await client.get(
            "/integrations/google/google-sheets/start",
            params={"next": "https://foundersystems.in/account?tab=connections"},
            follow_redirects=False,
        )
        assert response.status_code == 303, response.text
        location = response.headers["location"]
        assert location.startswith("https://accounts.google.com/o/oauth2/v2/auth")
        params = parse_qs(urlparse(location).query)
        assert params["client_id"][0] == "google-client-id"
        assert params["redirect_uri"][0] == "http://localhost:8000/auth/google/callback"
        scope = set(params["scope"][0].split())
        assert "openid" in scope
        assert "email" in scope
        assert "profile" in scope
        assert "https://www.googleapis.com/auth/spreadsheets" in scope
        assert "https://www.googleapis.com/auth/drive.file" in scope
        assert params["state"][0]

    asyncio.run(_run_with_client(main, scenario))


def test_google_workspace_callback_stores_requested_integration(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        start = await client.get("/integrations/google/google-sheets/start", follow_redirects=False)
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
                        "access_token": "sheets-access-token",
                        "refresh_token": "sheets-refresh-token",
                        "expires_in": 3600,
                        "scope": "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
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
        assert callback.headers["location"] == "https://foundersystems.in/account?tab=connections&integration=google-sheets-connected"

        status = await client.get("/integrations")
        assert status.status_code == 200, status.text
        integrations = status.json()["integrations"]
        sheets = next(item for item in integrations if item["integration_slug"] == "google-sheets")
        assert sheets["provider"] == "google"
        assert sheets["status"] == "connected"
        assert sheets["account_email"] == "founder@gmail.com"
        assert "https://www.googleapis.com/auth/spreadsheets" in sheets["scopes"]

    asyncio.run(_run_with_client(main, scenario))


def test_integration_status_marks_razorpay_connected_when_credentials_exist(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_RAZORPAY_KEY_ID", "rzp_test_key")
    monkeypatch.setenv("FS_RAZORPAY_KEY_SECRET", "rzp_test_secret")
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        status = await client.get("/integrations")
        assert status.status_code == 200, status.text
        razorpay = next(item for item in status.json()["integrations"] if item["integration_slug"] == "razorpay")
        assert razorpay["provider"] == "razorpay"
        assert razorpay["status"] == "connected"
        assert "payments:read" in razorpay["scopes"]
        assert "settlements:read" in razorpay["scopes"]

    asyncio.run(_run_with_client(main, scenario))


def test_external_connector_start_redirects_to_provider_oauth(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        response = await client.get(
            "/integrations/github/start",
            params={"next": "https://foundersystems.in/account?tab=connections"},
            follow_redirects=False,
        )
        assert response.status_code == 303, response.text
        location = response.headers["location"]
        assert location.startswith("https://github.com/login/oauth/authorize")
        params = parse_qs(urlparse(location).query)
        assert params["client_id"][0] == "github-client-id"
        assert params["redirect_uri"][0] == "http://localhost:8000/integrations/oauth/callback"
        assert "repo" in params["scope"][0].split()
        assert "user:email" in params["scope"][0].split()
        assert params["state"][0]

    asyncio.run(_run_with_client(main, scenario))


def test_linkedin_connector_start_redirects_to_linkedin_oauth(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        response = await client.get(
            "/integrations/linkedin/start",
            params={"next": "https://foundersystems.in/account?tab=connections"},
            follow_redirects=False,
        )
        assert response.status_code == 303, response.text
        location = response.headers["location"]
        assert location.startswith("https://www.linkedin.com/oauth/v2/authorization")
        params = parse_qs(urlparse(location).query)
        assert params["client_id"][0] == "linkedin-client-id"
        assert params["redirect_uri"][0] == "http://localhost:8000/integrations/oauth/callback"
        assert set(params["scope"][0].split()) == {"openid", "profile", "email"}
        assert params["state"][0]

    asyncio.run(_run_with_client(main, scenario))


def test_external_connector_callback_stores_github_account(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        start = await client.get("/integrations/github/start", follow_redirects=False)
        state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def post(self, url, **kwargs):
                assert url == "https://github.com/login/oauth/access_token"
                return httpx.Response(
                    200,
                    json={
                        "access_token": "github-access-token",
                        "scope": "repo user:email",
                        "token_type": "bearer",
                    },
                )

            async def get(self, url, **kwargs):
                if url == "https://api.github.com/user":
                    return httpx.Response(200, json={"id": 123, "login": "founder", "name": "Founder", "email": None})
                if url == "https://api.github.com/user/emails":
                    return httpx.Response(200, json=[{"email": "founder@example.com", "primary": True}])
                raise AssertionError(f"Unexpected GET {url}")

        monkeypatch.setattr(main.httpx, "AsyncClient", FakeAsyncClient)
        callback = await client.get(
            "/integrations/oauth/callback",
            params={"code": "oauth-code", "state": state},
            follow_redirects=False,
        )
        assert callback.status_code == 303, callback.text
        assert callback.headers["location"] == "https://foundersystems.in/account?tab=connections&integration=github-connected"

        status = await client.get("/integrations")
        github = next(item for item in status.json()["integrations"] if item["integration_slug"] == "github")
        assert github["provider"] == "github"
        assert github["status"] == "connected"
        assert github["account_email"] == "founder@example.com"
        assert "repo" in github["scopes"]

    asyncio.run(_run_with_client(main, scenario))


def test_external_connector_callback_stores_linkedin_account(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        start = await client.get("/integrations/linkedin/start", follow_redirects=False)
        state = parse_qs(urlparse(start.headers["location"]).query)["state"][0]

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def post(self, url, **kwargs):
                assert url == "https://www.linkedin.com/oauth/v2/accessToken"
                return httpx.Response(
                    200,
                    json={
                        "access_token": "linkedin-access-token",
                        "expires_in": 3600,
                        "scope": "openid profile email",
                        "token_type": "Bearer",
                    },
                )

            async def get(self, url, **kwargs):
                assert url == "https://api.linkedin.com/v2/userinfo"
                return httpx.Response(
                    200,
                    json={
                        "sub": "linkedin-user-123",
                        "name": "Founder LinkedIn",
                        "email": "founder@example.com",
                    },
                )

        monkeypatch.setattr(main.httpx, "AsyncClient", FakeAsyncClient)
        callback = await client.get(
            "/integrations/oauth/callback",
            params={"code": "oauth-code", "state": state},
            follow_redirects=False,
        )
        assert callback.status_code == 303, callback.text
        assert callback.headers["location"] == "https://foundersystems.in/account?tab=connections&integration=linkedin-connected"

        status = await client.get("/integrations")
        linkedin = next(item for item in status.json()["integrations"] if item["integration_slug"] == "linkedin")
        assert linkedin["provider"] == "linkedin"
        assert linkedin["status"] == "connected"
        assert linkedin["account_email"] == "founder@example.com"
        assert "openid" in linkedin["scopes"]

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
        assert callback.headers["location"] == "https://foundersystems.in/account?tab=connections&integration=gmail-connected"

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


def test_internal_gmail_send_returns_google_failure_reason(monkeypatch, tmp_path):
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
            main.grant_shared_wallet_credits(db, user_id=user.id, purchase=purchase, credits_granted=3)
            db.commit()

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
                    return httpx.Response(
                        403,
                        json={
                            "error": {
                                "message": "Request had insufficient authentication scopes.",
                                "status": "PERMISSION_DENIED",
                            }
                        },
                    )
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
                "reference_id": "email-send-failed-001",
                "to": ["customer@example.com"],
                "subject": "Welcome",
                "body_text": "Hello",
                "approval_text": "Send",
            },
        )

        assert response.status_code == 502
        assert "insufficient authentication scopes" in response.json()["detail"].lower()
        events = await client.get("/analytics/cost-guard/events", headers={"X-API-Key": "internal-secret"})
        assert any(
            event["reference_id"] == "email-send-failed-001"
            and "insufficient authentication scopes" in str(event["metadata"]).lower()
            for event in events.json()
        )

    asyncio.run(_run_with_client(main, scenario))


def _grant_operator_access(main, user_id: str, *, credits: int = 12) -> None:
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
        main.grant_shared_wallet_credits(db, user_id=user.id, purchase=purchase, credits_granted=credits)
        db.commit()


def _connect_google_action_account(main, user_id: str, *, integration_slug: str, scopes: list[str]) -> None:
    with main.Session(bind=main.engine) as db:
        user = db.get(main.User, user_id)
        main.upsert_google_integration_account(
            db,
            main.settings,
            user=user,
            integration_slug=integration_slug,
            token_payload={
                "access_token": f"{integration_slug}-access-token",
                "refresh_token": f"{integration_slug}-refresh-token",
                "expires_in": 3600,
                "scope": "openid email profile " + " ".join(scopes),
                "token_type": "Bearer",
            },
            profile={
                "email": "founder@gmail.com",
                "email_verified": True,
                "name": "Founder Gmail",
            },
        )
        db.commit()


def _connect_external_action_account(main, user_id: str, *, integration_slug: str, provider: str, scopes: list[str], metadata: dict | None = None) -> None:
    with main.Session(bind=main.engine) as db:
        user = db.get(main.User, user_id)
        account = main.upsert_external_integration_account(
            db,
            main.settings,
            user=user,
            integration_slug=integration_slug,
            token_payload={
                "access_token": f"{integration_slug}-access-token",
                "scope": " ".join(scopes),
                "token_type": "Bearer",
            },
            profile={
                "email": "founder@example.com",
                "name": f"{integration_slug} test",
                **(metadata or {}),
            },
        )
        account.provider = provider
        db.commit()


def test_internal_google_workspace_actions_create_docs_sheets_and_calendar_events(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        user_id = (await client.get("/auth/session")).json()["user"]["id"]
        _grant_operator_access(main, user_id)
        _connect_google_action_account(
            main,
            user_id,
            integration_slug="google-docs",
            scopes=[
                "https://www.googleapis.com/auth/documents",
                "https://www.googleapis.com/auth/drive.file",
            ],
        )
        _connect_google_action_account(
            main,
            user_id,
            integration_slug="google-sheets",
            scopes=[
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive.file",
            ],
        )
        _connect_google_action_account(
            main,
            user_id,
            integration_slug="google-calendar",
            scopes=["https://www.googleapis.com/auth/calendar.events"],
        )

        calls: list[tuple[str, dict]] = []

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def post(self, url, **kwargs):
                calls.append((url, kwargs))
                if url == "https://docs.googleapis.com/v1/documents":
                    return httpx.Response(200, json={"documentId": "doc-123"})
                if url == "https://docs.googleapis.com/v1/documents/doc-123:batchUpdate":
                    return httpx.Response(200, json={"replies": [{}]})
                if url == "https://sheets.googleapis.com/v4/spreadsheets":
                    return httpx.Response(200, json={"spreadsheetId": "sheet-123", "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/sheet-123"})
                if url == "https://sheets.googleapis.com/v4/spreadsheets/sheet-123/values/Sheet1!A1:append":
                    return httpx.Response(200, json={"updates": {"updatedRows": 2}})
                if url == "https://www.googleapis.com/calendar/v3/calendars/primary/events":
                    return httpx.Response(200, json={"id": "event-123", "htmlLink": "https://calendar.google.com/event?eid=event-123"})
                raise AssertionError(f"Unexpected POST {url}")

        monkeypatch.setattr(main.httpx, "AsyncClient", FakeAsyncClient)

        doc = await client.post(
            "/v1/internal/runtime/actions/google/docs/create",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "google-doc-001",
                "title": "Launch Plan",
                "body_text": "Campaign plan ready for review.",
                "approval_text": "Approved in Telegram",
            },
        )
        assert doc.status_code == 200, doc.text
        assert doc.json()["document_id"] == "doc-123"
        assert doc.json()["document_url"] == "https://docs.google.com/document/d/doc-123/edit"

        sheet = await client.post(
            "/v1/internal/runtime/actions/google/sheets/create",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "google-sheet-001",
                "title": "Lead Tracker",
                "values": [["Lead", "Status"], ["Acme", "Drafted"]],
                "approval_text": "Approved in Telegram",
            },
        )
        assert sheet.status_code == 200, sheet.text
        assert sheet.json()["spreadsheet_id"] == "sheet-123"
        assert sheet.json()["updated_rows"] == 2

        event = await client.post(
            "/v1/internal/runtime/actions/google/calendar/events/create",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "google-calendar-001",
                "summary": "Review launch plan",
                "description": "Go through the campaign plan.",
                "start_at": "2026-05-23T10:00:00+05:30",
                "end_at": "2026-05-23T10:30:00+05:30",
                "timezone": "Asia/Kolkata",
                "attendees": ["founder@example.com"],
                "approval_text": "Approved in Telegram",
            },
        )
        assert event.status_code == 200, event.text
        assert event.json()["event_id"] == "event-123"
        assert any(url.endswith("doc-123:batchUpdate") for url, _ in calls)

    asyncio.run(_run_with_client(main, scenario))


def test_internal_google_reporting_actions_read_search_console_and_ga4(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        user_id = (await client.get("/auth/session")).json()["user"]["id"]
        _grant_operator_access(main, user_id)
        _connect_google_action_account(
            main,
            user_id,
            integration_slug="google-search-console",
            scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
        )
        _connect_google_action_account(
            main,
            user_id,
            integration_slug="google-analytics-4",
            scopes=["https://www.googleapis.com/auth/analytics.readonly"],
        )

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def post(self, url, **kwargs):
                if url == "https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Agradesense.in/searchAnalytics/query":
                    assert kwargs["json"]["dimensions"] == ["query", "page"]
                    return httpx.Response(200, json={"rows": [{"keys": ["ai grading", "https://gradesense.in"], "clicks": 7, "impressions": 70}]})
                if url == "https://analyticsdata.googleapis.com/v1beta/properties/123456:runReport":
                    assert kwargs["json"]["metrics"] == [{"name": "activeUsers"}]
                    return httpx.Response(200, json={"rows": [{"dimensionValues": [{"value": "google"}], "metricValues": [{"value": "42"}]}]})
                raise AssertionError(f"Unexpected POST {url}")

        monkeypatch.setattr(main.httpx, "AsyncClient", FakeAsyncClient)

        search_console = await client.post(
            "/v1/internal/runtime/actions/google/search-console/query",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "search-console-001",
                "site_url": "sc-domain:gradesense.in",
                "start_date": "2026-05-01",
                "end_date": "2026-05-22",
                "dimensions": ["query", "page"],
                "row_limit": 10,
            },
        )
        assert search_console.status_code == 200, search_console.text
        assert search_console.json()["rows"][0]["clicks"] == 7

        ga4 = await client.post(
            "/v1/internal/runtime/actions/google/analytics/run-report",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "ga4-001",
                "property_id": "123456",
                "start_date": "2026-05-01",
                "end_date": "2026-05-22",
                "metrics": ["activeUsers"],
                "dimensions": ["sessionDefaultChannelGroup"],
            },
        )
        assert ga4.status_code == 200, ga4.text
        assert ga4.json()["rows"][0]["metricValues"][0]["value"] == "42"

    asyncio.run(_run_with_client(main, scenario))


def test_internal_razorpay_payments_action_lists_recent_payments(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_RAZORPAY_KEY_ID", "rzp_test_key")
    monkeypatch.setenv("FS_RAZORPAY_KEY_SECRET", "rzp_test_secret")
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        user_id = (await client.get("/auth/session")).json()["user"]["id"]
        _grant_operator_access(main, user_id)

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def get(self, url, **kwargs):
                assert url == "https://api.razorpay.com/v1/payments"
                assert kwargs["params"]["count"] == 5
                assert kwargs["auth"] == ("rzp_test_key", "rzp_test_secret")
                return httpx.Response(200, json={"items": [{"id": "pay_123", "amount": 99900, "status": "captured"}], "count": 1})

        monkeypatch.setattr(main.httpx, "AsyncClient", FakeAsyncClient)

        response = await client.post(
            "/v1/internal/runtime/actions/razorpay/payments/list",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "razorpay-payments-001",
                "count": 5,
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["items"][0]["id"] == "pay_123"
        assert response.json()["credits_spent"] == 1

    asyncio.run(_run_with_client(main, scenario))


def test_internal_external_connector_actions(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)
        user_id = (await client.get("/auth/session")).json()["user"]["id"]
        _grant_operator_access(main, user_id)
        _connect_external_action_account(main, user_id, integration_slug="github", provider="github", scopes=["repo", "user:email"])
        _connect_external_action_account(main, user_id, integration_slug="hubspot", provider="hubspot", scopes=["crm.objects.contacts.write"], metadata={"hub_id": 12345})
        _connect_external_action_account(main, user_id, integration_slug="mailchimp", provider="mailchimp", scopes=[], metadata={"dc": "us1", "api_endpoint": "https://us1.api.mailchimp.com/3.0"})
        _connect_external_action_account(main, user_id, integration_slug="meta-ads", provider="meta", scopes=["ads_read", "ads_management"])

        class FakeAsyncClient:
            def __init__(self, *args, **kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return None

            async def post(self, url, **kwargs):
                if url == "https://api.github.com/repos/AyushPoo/Founder-Systems/issues":
                    assert kwargs["json"]["title"] == "Fix connector UX"
                    return httpx.Response(201, json={"id": 99, "number": 7, "html_url": "https://github.com/AyushPoo/Founder-Systems/issues/7"})
                if url == "https://api.hubapi.com/crm/v3/objects/contacts":
                    assert kwargs["json"]["properties"]["email"] == "lead@example.com"
                    return httpx.Response(201, json={"id": "contact-123"})
                raise AssertionError(f"Unexpected POST {url}")

            async def get(self, url, **kwargs):
                if url == "https://us1.api.mailchimp.com/3.0/campaigns":
                    assert kwargs["params"]["count"] == 5
                    return httpx.Response(200, json={"campaigns": [{"id": "camp-1", "settings": {"title": "May newsletter"}}], "total_items": 1})
                if url == "https://graph.facebook.com/v23.0/act_123456/insights":
                    assert kwargs["params"]["level"] == "campaign"
                    return httpx.Response(200, json={"data": [{"campaign_name": "Launch", "spend": "42.00", "clicks": "12"}]})
                raise AssertionError(f"Unexpected GET {url}")

        monkeypatch.setattr(main.httpx, "AsyncClient", FakeAsyncClient)

        github = await client.post(
            "/v1/internal/runtime/actions/github/issues/create",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "ops-agent",
                "user_id": user_id,
                "reference_id": "github-issue-001",
                "repo": "AyushPoo/Founder-Systems",
                "title": "Fix connector UX",
                "body_text": "Telegram connector flow needs polish.",
                "approval_text": "Approved in Telegram",
            },
        )
        assert github.status_code == 200, github.text
        assert github.json()["issue_url"].endswith("/issues/7")

        hubspot = await client.post(
            "/v1/internal/runtime/actions/hubspot/contacts/create",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "hubspot-contact-001",
                "email": "lead@example.com",
                "first_name": "Lead",
                "approval_text": "Approved in Telegram",
            },
        )
        assert hubspot.status_code == 200, hubspot.text
        assert hubspot.json()["contact_id"] == "contact-123"

        mailchimp = await client.post(
            "/v1/internal/runtime/actions/mailchimp/campaigns/list",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "mailchimp-campaigns-001",
                "count": 5,
            },
        )
        assert mailchimp.status_code == 200, mailchimp.text
        assert mailchimp.json()["campaigns"][0]["id"] == "camp-1"

        meta = await client.post(
            "/v1/internal/runtime/actions/meta-ads/insights/read",
            headers={"X-API-Key": "internal-secret"},
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "meta-insights-001",
                "ad_account_id": "123456",
                "limit": 5,
            },
        )
        assert meta.status_code == 200, meta.text
        assert meta.json()["rows"][0]["campaign_name"] == "Launch"

    asyncio.run(_run_with_client(main, scenario))
