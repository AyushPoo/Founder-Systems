from __future__ import annotations

import asyncio
from datetime import timedelta

import httpx

from founder_systems_api.tests.test_main import _authenticate, _bootstrap_app, _run_with_client


def _grant_agent_pass(main, *, email: str, product_slug: str) -> None:
    with main.Session(bind=main.engine) as db:
        user = main.get_or_create_user(db, email=email, name="Founder")
        purchase = main.Purchase(
            user_id=user.id,
            status="paid",
            currency="INR",
            amount_minor=99900,
            metadata_json={"purchase_kind": "agent_pass"},
        )
        db.add(purchase)
        db.commit()
        db.refresh(purchase)
        main.grant_product_pass(
            db,
            user_id=user.id,
            purchase=purchase,
            product_slug=product_slug,
        )
        db.commit()


def test_start_and_verify_telegram_link_flow(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "telegram-internal-secret")
    main = _bootstrap_app(monkeypatch, tmp_path)
    _grant_agent_pass(main, email="founder@example.com", product_slug="marketing-agent")

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        start = await client.post(
            "/agents/telegram/link/start",
            json={"product_slug": "marketing-agent"},
        )
        assert start.status_code == 200, start.text
        start_body = start.json()
        assert start_body["product_slug"] == "marketing-agent"
        assert start_body["bot_username"] == "FSMaAgBot"
        assert start_body["bot_url"] == "https://t.me/FSMaAgBot"
        assert start_body["deep_link_url"].startswith("https://t.me/FSMaAgBot?start=")
        assert start_body["deep_link_url"].endswith(start_body["token"])
        assert start_body["token"]
        assert start_body["expires_in_seconds"] > 0

        verify = await client.post(
            "/agents/telegram/link/verify",
            headers={"X-API-Key": "telegram-internal-secret"},
            json={
                "token": start_body["token"],
                "telegram_user_id": "tg-user-123",
                "telegram_chat_id": "tg-chat-123",
                "telegram_username": "founder_handle",
            },
        )
        assert verify.status_code == 200, verify.text
        verify_body = verify.json()
        assert verify_body["product_slug"] == "marketing-agent"
        assert verify_body["linked"] is True
        assert verify_body["status"] == "linked"
        assert verify_body["telegram_username"] == "founder_handle"

        account = await client.get("/account/agent-status")
        assert account.status_code == 200, account.text
        products = {item["product_slug"]: item for item in account.json()["products"]}
        assert products["marketing-agent"]["telegram_link"]["linked"] is True
        assert products["marketing-agent"]["telegram_link"]["status"] == "linked"
        assert products["marketing-agent"]["telegram_link"]["telegram_username"] == "founder_handle"

        reuse = await client.post(
            "/agents/telegram/link/verify",
            headers={"X-API-Key": "telegram-internal-secret"},
            json={
                "token": start_body["token"],
                "telegram_user_id": "tg-user-123",
                "telegram_chat_id": "tg-chat-123",
            },
        )
        assert reuse.status_code == 400, reuse.text

    asyncio.run(_run_with_client(main, scenario))


def test_new_telegram_link_token_supersedes_previous_token(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "telegram-internal-secret")
    main = _bootstrap_app(monkeypatch, tmp_path)
    _grant_agent_pass(main, email="founder@example.com", product_slug="marketing-agent")

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        first = await client.post(
            "/agents/telegram/link/start",
            json={"product_slug": "marketing-agent"},
        )
        assert first.status_code == 200, first.text
        first_body = first.json()

        second = await client.post(
            "/agents/telegram/link/start",
            json={"product_slug": "marketing-agent"},
        )
        assert second.status_code == 200, second.text
        second_body = second.json()
        assert second_body["token"] != first_body["token"]

        old_verify = await client.post(
            "/agents/telegram/link/verify",
            headers={"X-API-Key": "telegram-internal-secret"},
            json={
                "token": first_body["token"],
                "telegram_user_id": "tg-user-old",
                "telegram_chat_id": "tg-chat-old",
            },
        )
        assert old_verify.status_code == 400, old_verify.text

        new_verify = await client.post(
            "/agents/telegram/link/verify",
            headers={"X-API-Key": "telegram-internal-secret"},
            json={
                "token": second_body["token"],
                "telegram_user_id": "tg-user-new",
                "telegram_chat_id": "tg-chat-new",
            },
        )
        assert new_verify.status_code == 200, new_verify.text

    asyncio.run(_run_with_client(main, scenario))


def test_expired_telegram_link_token_cannot_verify(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "telegram-internal-secret")
    main = _bootstrap_app(monkeypatch, tmp_path)
    _grant_agent_pass(main, email="founder@example.com", product_slug="marketing-agent")

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        start = await client.post(
            "/agents/telegram/link/start",
            json={"product_slug": "marketing-agent"},
        )
        assert start.status_code == 200, start.text
        start_body = start.json()

        import founder_systems_api.app.services as services

        expired_now = services.utc_now() + timedelta(seconds=services.TELEGRAM_LINK_TOKEN_TTL_SECONDS + 1)
        monkeypatch.setattr(services, "utc_now", lambda: expired_now)

        verify = await client.post(
            "/agents/telegram/link/verify",
            headers={"X-API-Key": "telegram-internal-secret"},
            json={
                "token": start_body["token"],
                "telegram_user_id": "tg-user-expired",
                "telegram_chat_id": "tg-chat-expired",
            },
        )
        assert verify.status_code == 400, verify.text

        account = await client.get("/account/agent-status")
        assert account.status_code == 200, account.text
        products = {item["product_slug"]: item for item in account.json()["products"]}
        assert products["marketing-agent"]["telegram_link"]["linked"] is False
        assert products["marketing-agent"]["telegram_link"]["status"] == "expired"

    asyncio.run(_run_with_client(main, scenario))


def test_relink_without_username_clears_previous_telegram_username(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "telegram-internal-secret")
    main = _bootstrap_app(monkeypatch, tmp_path)
    _grant_agent_pass(main, email="founder@example.com", product_slug="marketing-agent")

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        first = await client.post(
            "/agents/telegram/link/start",
            json={"product_slug": "marketing-agent"},
        )
        assert first.status_code == 200, first.text
        first_body = first.json()

        first_verify = await client.post(
            "/agents/telegram/link/verify",
            headers={"X-API-Key": "telegram-internal-secret"},
            json={
                "token": first_body["token"],
                "telegram_user_id": "tg-user-1",
                "telegram_chat_id": "tg-chat-1",
                "telegram_username": "oldname",
            },
        )
        assert first_verify.status_code == 200, first_verify.text

        second = await client.post(
            "/agents/telegram/link/start",
            json={"product_slug": "marketing-agent"},
        )
        assert second.status_code == 200, second.text
        second_body = second.json()

        second_verify = await client.post(
            "/agents/telegram/link/verify",
            headers={"X-API-Key": "telegram-internal-secret"},
            json={
                "token": second_body["token"],
                "telegram_user_id": "tg-user-2",
                "telegram_chat_id": "tg-chat-2",
            },
        )
        assert second_verify.status_code == 200, second_verify.text
        assert second_verify.json()["telegram_username"] is None

        account = await client.get("/account/agent-status")
        assert account.status_code == 200, account.text
        products = {item["product_slug"]: item for item in account.json()["products"]}
        assert products["marketing-agent"]["telegram_link"]["telegram_username"] is None

    asyncio.run(_run_with_client(main, scenario))


def test_agent_diagnostics_matches_account_status(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        diagnostics = await client.get("/agents/diagnostics")
        account = await client.get("/account/agent-status")

        assert diagnostics.status_code == 200, diagnostics.text
        assert account.status_code == 200, account.text
        assert diagnostics.json() == account.json()

    asyncio.run(_run_with_client(main, scenario))
