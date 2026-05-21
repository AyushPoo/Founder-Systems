from __future__ import annotations

import asyncio
import importlib
import sys
from pathlib import Path

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
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "internal-test-key")
    monkeypatch.setenv("FS_ADMIN_EMAILS", "admin@example.com")

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


def _internal_headers() -> dict[str, str]:
    return {"X-API-Key": "internal-test-key"}


def _create_paid_user(main, *, email: str = "founder@example.com", credits: int = 5) -> str:
    with main.Session(bind=main.engine) as db:
        user = main.get_or_create_user(db, email=email, name="Founder")
        purchase = main.Purchase(
            user_id=user.id,
            razorpay_order_id=f"order-{email}",
            status="paid",
            currency="INR",
            amount_minor=99900,
            metadata_json={"test": True},
        )
        db.add(purchase)
        db.flush()
        main.grant_product_pass(
            db,
            user_id=user.id,
            purchase=purchase,
            product_slug="marketing-agent",
        )
        main.grant_shared_wallet_credits(
            db,
            user_id=user.id,
            purchase=purchase,
            credits_granted=credits,
        )
        db.commit()
        return user.id


async def _with_client(main, scenario):
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        return await scenario(client)


def test_internal_reserve_finalize_and_release_flow(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)
    user_id = _create_paid_user(main, credits=5)

    async def scenario(client: httpx.AsyncClient):
        reserve = await client.post(
            "/v1/internal/runtime/actions/reserve",
            headers=_internal_headers(),
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "reply-001",
                "action": "agent_chat",
                "provider": "google",
                "model_id": "gemini-2.5-flash",
                "estimated_input_chars": 120,
                "estimated_output_tokens": 200,
                "amount": 1,
            },
        )
        assert reserve.status_code == 200, reserve.text
        assert reserve.json()["ok"] is True
        assert reserve.json()["state"] == "reserved"
        assert reserve.json()["wallet_balance"] == 5

        finalize = await client.post(
            "/v1/internal/runtime/actions/finalize",
            headers=_internal_headers(),
            json={
                "reference_id": "reply-001",
                "actual_input_tokens": 30,
                "actual_output_tokens": 80,
            },
        )
        assert finalize.status_code == 200, finalize.text
        assert finalize.json()["state"] == "finalized"
        assert finalize.json()["wallet_balance"] == 4

        second_finalize = await client.post(
            "/v1/internal/runtime/actions/finalize",
            headers=_internal_headers(),
            json={"reference_id": "reply-001"},
        )
        assert second_finalize.status_code == 200, second_finalize.text
        assert second_finalize.json()["wallet_balance"] == 4

    asyncio.run(_with_client(main, scenario))


def test_deepseek_v31_is_disabled_by_default(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)
    user_id = _create_paid_user(main, credits=5)

    async def scenario(client: httpx.AsyncClient):
        response = await client.post(
            "/v1/internal/runtime/actions/reserve",
            headers=_internal_headers(),
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "deepseek-001",
                "action": "agent_chat",
                "provider": "bedrock",
                "model_id": "deepseek.v3.1",
                "amount": 1,
            },
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["ok"] is False
        assert body["state"] == "denied"
        assert body["reason"] == "model_disabled"

    asyncio.run(_with_client(main, scenario))


def test_reserve_denies_empty_wallet_and_records_event(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)
    user_id = _create_paid_user(main, credits=0)

    async def scenario(client: httpx.AsyncClient):
        response = await client.post(
            "/v1/internal/runtime/actions/reserve",
            headers=_internal_headers(),
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "empty-wallet-001",
                "action": "agent_chat",
                "provider": "google",
                "model_id": "gemini-2.5-flash",
                "amount": 1,
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["reason"] == "wallet_empty"

        events = await client.get("/analytics/cost-guard/events", headers=_internal_headers())
        assert events.status_code == 200, events.text
        body = events.json()
        assert body[0]["reference_id"] == "empty-wallet-001"
        assert body[0]["decision"] == "denied"

    asyncio.run(_with_client(main, scenario))


def test_blocked_user_is_denied(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)
    user_id = _create_paid_user(main, credits=5)

    async def scenario(client: httpx.AsyncClient):
        block = await client.post(
            f"/analytics/cost-guard/users/{user_id}/block",
            headers=_internal_headers(),
            json={"reason": "runaway usage"},
        )
        assert block.status_code == 200, block.text

        response = await client.post(
            "/v1/internal/runtime/actions/reserve",
            headers=_internal_headers(),
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "blocked-001",
                "action": "agent_chat",
                "provider": "google",
                "model_id": "gemini-2.5-flash",
                "amount": 1,
            },
        )
        assert response.status_code == 200, response.text
        assert response.json()["reason"] == "user_blocked"

        unblock = await client.post(
            f"/analytics/cost-guard/users/{user_id}/unblock",
            headers=_internal_headers(),
        )
        assert unblock.status_code == 200, unblock.text
        assert unblock.json()["changed"] is True

    asyncio.run(_with_client(main, scenario))


def test_user_daily_limit_is_enforced(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_AI_GUARD_USER_DAILY_LIMIT", "1")
    main = _bootstrap_app(monkeypatch, tmp_path)
    user_id = _create_paid_user(main, credits=5)

    async def scenario(client: httpx.AsyncClient):
        first = await client.post(
            "/v1/internal/runtime/actions/reserve",
            headers=_internal_headers(),
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "limit-001",
                "action": "agent_chat",
                "provider": "google",
                "model_id": "gemini-2.5-flash",
                "amount": 1,
            },
        )
        assert first.status_code == 200, first.text
        assert first.json()["ok"] is True

        second = await client.post(
            "/v1/internal/runtime/actions/reserve",
            headers=_internal_headers(),
            json={
                "product_slug": "marketing-agent",
                "user_id": user_id,
                "reference_id": "limit-002",
                "action": "agent_chat",
                "provider": "google",
                "model_id": "gemini-2.5-flash",
                "amount": 1,
            },
        )
        assert second.status_code == 200, second.text
        assert second.json()["reason"] == "user_daily_limit"

    asyncio.run(_with_client(main, scenario))


def test_admin_cost_guard_summary_and_models(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        summary = await client.get("/analytics/cost-guard/summary", headers=_internal_headers())
        assert summary.status_code == 200, summary.text
        assert summary.json()["disabled_models"] >= 1

        models = await client.get("/analytics/cost-guard/models", headers=_internal_headers())
        assert models.status_code == 200, models.text
        deepseek = next(item for item in models.json() if "deepseek" in item["model_id"])
        assert deepseek["status"] == "disabled"

        patch = await client.patch(
            f"/analytics/cost-guard/models/{deepseek['id']}",
            headers=_internal_headers(),
            json={"status": "enabled", "daily_global_limit": 1},
        )
        assert patch.status_code == 200, patch.text
        assert patch.json()["status"] == "enabled"
        assert patch.json()["daily_global_limit"] == 1

    asyncio.run(_with_client(main, scenario))
