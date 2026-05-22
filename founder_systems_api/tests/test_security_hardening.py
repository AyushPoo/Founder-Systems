from __future__ import annotations

import asyncio
import importlib
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import httpx


def _clear_app_modules() -> None:
    for module_name in list(sys.modules):
        if module_name.startswith("founder_systems_api.app"):
            sys.modules.pop(module_name, None)


def _bootstrap_app(monkeypatch, tmp_path: Path, *, env: str = "development", secure_production: bool = False):
    db_path = tmp_path / "founder-systems-api.sqlite3"
    monkeypatch.setenv("FS_DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("FS_ENV", env)
    monkeypatch.setenv("FS_SESSION_SECRET", "test-secret" if env != "production" else "real-production-secret")
    monkeypatch.setenv("FS_SESSION_COOKIE_DOMAIN", "")
    monkeypatch.setenv("FS_SESSION_COOKIE_SECURE", "true" if secure_production else "false")
    monkeypatch.setenv("FS_ALLOW_MOCK_PAYMENTS", "false" if secure_production else "true")
    monkeypatch.setenv("FS_SITE_APP_URL", "https://foundersystems.in")
    monkeypatch.setenv("FS_ACCOUNT_APP_URL", "https://account.foundersystems.in")
    monkeypatch.setenv("FS_PROMPTDECK_APP_URL", "https://promptdeck.foundersystems.in")
    monkeypatch.setenv("FS_PUBLIC_API_URL", "http://localhost:8000")
    monkeypatch.setenv("FS_GOOGLE_CLIENT_ID", "google-client-id")
    monkeypatch.setenv("FS_GOOGLE_CLIENT_SECRET", "google-client-secret")
    monkeypatch.setenv("FS_INTEGRATION_TOKEN_SECRET", "integration-secret")
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "internal-secret")

    _clear_app_modules()
    main = importlib.import_module("founder_systems_api.app.main")
    main.Base.metadata.drop_all(bind=main.engine)
    main.Base.metadata.create_all(bind=main.engine)
    with main.Session(bind=main.engine) as db:
        main.ensure_seed_data(db, main.settings)
        if hasattr(main, "ensure_default_ai_model_policies"):
            main.ensure_default_ai_model_policies(db, main.settings)
    return main


async def _run_with_client(main, scenario):
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        return await scenario(client)


async def _authenticate(client: httpx.AsyncClient, *, email: str = "security@example.com") -> tuple[dict, str]:
    start = await client.post(
        "/auth/magic-link/start",
        json={"email": email, "name": "Security Test User"},
    )
    assert start.status_code == 200, start.text
    start_body = start.json()
    token = start_body.get("token")
    if not token and start_body.get("magic_link_url"):
        parsed = urlparse(start_body["magic_link_url"])
        token = (parse_qs(parsed.query).get("token") or [""])[0]
    assert token, start_body

    verify = await client.post("/auth/magic-link/verify", json={"token": token})
    assert verify.status_code == 200, verify.text
    return verify.json(), token


def test_production_requires_real_session_secret(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_ENV", "production")
    monkeypatch.setenv("FS_DATABASE_URL", f"sqlite:///{(tmp_path / 'db.sqlite3').as_posix()}")
    monkeypatch.setenv("FS_SESSION_SECRET", "change-me-in-production")
    monkeypatch.setenv("FS_ALLOW_MOCK_PAYMENTS", "false")
    monkeypatch.setenv("FS_SESSION_COOKIE_SECURE", "true")
    monkeypatch.setenv("FS_INTEGRATION_TOKEN_SECRET", "integration-secret")
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "internal-secret")

    _clear_app_modules()

    try:
        import pytest  # noqa: PLC0415
    except Exception as exc:  # pragma: no cover
        raise AssertionError("pytest must be available to run security tests") from exc

    with pytest.raises(RuntimeError, match="FS_SESSION_SECRET"):
        importlib.import_module("founder_systems_api.app.main")


def test_production_rejects_mock_payments(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_ENV", "production")
    monkeypatch.setenv("FS_DATABASE_URL", f"sqlite:///{(tmp_path / 'db.sqlite3').as_posix()}")
    monkeypatch.setenv("FS_SESSION_SECRET", "real-secret-value")
    monkeypatch.setenv("FS_ALLOW_MOCK_PAYMENTS", "true")
    monkeypatch.setenv("FS_SESSION_COOKIE_SECURE", "true")
    monkeypatch.setenv("FS_INTEGRATION_TOKEN_SECRET", "integration-secret")
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "internal-secret")

    _clear_app_modules()

    try:
        import pytest  # noqa: PLC0415
    except Exception as exc:  # pragma: no cover
        raise AssertionError("pytest must be available to run security tests") from exc

    with pytest.raises(RuntimeError, match="FS_ALLOW_MOCK_PAYMENTS"):
        importlib.import_module("founder_systems_api.app.main")


def test_safe_return_url_rejects_lookalike_domain(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)
    assert main._safe_return_url("https://foundersystems.in.evil.com/account") == "https://foundersystems.in/account"


def test_integration_crypto_does_not_fall_back_to_session_secret(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_ENV", "production")
    monkeypatch.setenv("FS_DATABASE_URL", f"sqlite:///{(tmp_path / 'db.sqlite3').as_posix()}")
    monkeypatch.setenv("FS_SESSION_SECRET", "real-secret-value")
    monkeypatch.setenv("FS_SESSION_COOKIE_SECURE", "true")
    monkeypatch.setenv("FS_ALLOW_MOCK_PAYMENTS", "false")
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "internal-secret")
    monkeypatch.delenv("FS_INTEGRATION_TOKEN_SECRET", raising=False)

    _clear_app_modules()

    try:
        import pytest  # noqa: PLC0415
    except Exception as exc:  # pragma: no cover
        raise AssertionError("pytest must be available to run security tests") from exc

    with pytest.raises(RuntimeError, match="FS_INTEGRATION_TOKEN_SECRET"):
        importlib.import_module("founder_systems_api.app.main")


def test_product_usage_spend_ignores_client_credit_override(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        auth_body, _token = await _authenticate(client)
        user_id = auth_body["user"]["id"]

        with main.Session(bind=main.engine) as db:
            user = db.get(main.User, user_id)
            workspace, _membership = main.get_or_create_workspace(db, user=user)
            wallet = main.get_or_create_credit_wallet(
                db,
                workspace_id=workspace.id,
                user_id=user_id,
            )
            main.record_wallet_entry(
                db,
                wallet=wallet,
                user_id=user_id,
                workspace_id=workspace.id,
                delta=10,
                reason="security_test_grant",
                metadata={"test": True},
            )
            db.commit()

        wallet_before = await client.get("/wallet")
        assert wallet_before.status_code == 200, wallet_before.text
        wallet_before_balance = wallet_before.json()["wallet"]["balance"]

        spend = await client.post(
            "/products/founder-update-generator/usage-spend",
            json={"action": "generate", "credits": 1, "metadata": {"attempt": "client-override"}},
        )
        assert spend.status_code == 200, spend.text
        wallet_after_balance = spend.json()["balance"]
        assert wallet_after_balance == wallet_before_balance - 2

        ledger = await client.get("/wallet/usage-events")
        assert ledger.status_code == 200, ledger.text
        latest_event = ledger.json()[0]
        assert latest_event["product_slug"] == "founder-update-generator"
        assert latest_event["credits_spent"] == 2

    asyncio.run(_run_with_client(main, scenario))


def test_magic_link_start_throttles_repeat_requests(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        payload = {"email": "repeat@example.com", "name": "Repeat User"}
        first = await client.post("/auth/magic-link/start", json=payload)
        second = await client.post("/auth/magic-link/start", json=payload)
        third = await client.post("/auth/magic-link/start", json=payload)
        fourth = await client.post("/auth/magic-link/start", json=payload)

        assert first.status_code == 200, first.text
        assert second.status_code == 200, second.text
        assert third.status_code == 200, third.text
        assert fourth.status_code == 429, fourth.text

    asyncio.run(_run_with_client(main, scenario))


def test_production_disables_openapi_docs(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path, env="production", secure_production=True)
    assert main.app.docs_url is None
    assert main.app.openapi_url is None
    assert main.app.redoc_url is None
