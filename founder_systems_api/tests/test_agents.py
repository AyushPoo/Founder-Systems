from __future__ import annotations

import asyncio
from datetime import timedelta, timezone

import httpx
from sqlalchemy.exc import IntegrityError

from founder_systems_api.tests.test_main import _authenticate, _bootstrap_app, _run_with_client


def test_agent_status_reports_wallet_pass_and_link_state(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        response = await client.get("/account/agent-status")
        assert response.status_code == 200, response.text
        body = response.json()

        assert body["shared_wallet"]["balance"] == 0
        assert body["shared_wallet"]["currency_unit"] == "credits"
        assert body["shared_wallet"]["exhausted"] is True

        products = {item["product_slug"]: item for item in body["products"]}
        marketing = products["marketing-agent"]
        assert marketing["has_active_pass"] is False
        assert marketing["entitlement_status"] is None
        assert marketing["telegram_link"]["linked"] is False
        assert marketing["telegram_link"]["status"] == "unlinked"
        assert marketing["workspace_status"] is None
        assert marketing["bot_username"]

    asyncio.run(_run_with_client(main, scenario))


def test_agent_status_uses_product_specific_links_and_workspaces(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        await _authenticate(client)

        with main.Session(bind=main.engine) as db:
            user = db.scalar(main.select(main.User).where(main.User.email == "founder@example.com"))
            assert user is not None
            db.add(
                main.TelegramLink(
                    user_id=user.id,
                    product_slug="marketing-agent",
                    telegram_user_id="tg-shared-user",
                    telegram_username="marketingbot",
                    status="linked",
                    linked_at=main.utc_now(),
                )
            )
            db.add(
                main.TelegramLink(
                    user_id=user.id,
                    product_slug="finance-agent",
                    telegram_user_id="tg-shared-user",
                    telegram_username="financebot",
                    status="pending",
                )
            )
            db.add(
                main.AgentWorkspace(
                    user_id=user.id,
                    product_slug="marketing-agent",
                    external_workspace_id="workspace-mkt-001",
                    status="ready",
                )
            )
            db.commit()

        response = await client.get("/account/agent-status")
        assert response.status_code == 200, response.text
        body = response.json()
        products = {item["product_slug"]: item for item in body["products"]}

        assert products["marketing-agent"]["telegram_link"]["linked"] is True
        assert products["marketing-agent"]["telegram_link"]["status"] == "linked"
        assert products["marketing-agent"]["telegram_link"]["telegram_username"] == "marketingbot"
        assert products["marketing-agent"]["workspace_status"] == "ready"

        assert products["finance-agent"]["telegram_link"]["linked"] is False
        assert products["finance-agent"]["telegram_link"]["status"] == "pending"
        assert products["finance-agent"]["telegram_link"]["telegram_username"] == "financebot"
        assert products["finance-agent"]["workspace_status"] is None

        assert products["ops-agent"]["telegram_link"]["linked"] is False
        assert products["ops-agent"]["telegram_link"]["status"] == "unlinked"
        assert products["ops-agent"]["workspace_status"] is None

    asyncio.run(_run_with_client(main, scenario))


def test_runtime_memory_facts_upsert_and_context_use_workspace_memory(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "runtime-secret")
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client: httpx.AsyncClient):
        with main.Session(bind=main.engine) as db:
            user = main.get_or_create_user(db, email="memory@example.com", name="Memory User")
            db.add(
                main.TelegramLink(
                    user_id=user.id,
                    product_slug="marketing-agent",
                    telegram_user_id="tg-memory-001",
                    telegram_chat_id="chat-memory-001",
                    status="linked",
                    linked_at=main.utc_now(),
                )
            )
            db.commit()

        upsert = await client.post(
            "/v1/internal/runtime/memory/facts",
            headers={"X-API-Key": "runtime-secret"},
            json={
                "product_slug": "marketing-agent",
                "telegram_user_id": "tg-memory-001",
                "facts": {
                    "name": "Ayush Poojary",
                    "website": "gradesense.in",
                },
            },
        )
        assert upsert.status_code == 200, upsert.text
        assert upsert.json()["facts"]["name"] == "Ayush Poojary"

        context = await client.post(
            "/v1/internal/runtime/memory/context",
            headers={"X-API-Key": "runtime-secret"},
            json={
                "product_slug": "marketing-agent",
                "telegram_user_id": "tg-memory-001",
            },
        )
        assert context.status_code == 200, context.text
        body = context.json()
        assert body["workspace_id"]
        assert body["facts"] == {
            "name": "Ayush Poojary",
            "website": "gradesense.in",
        }
        assert body["items"][0]["type"] == "telegram_profile"
        assert body["items"][0]["memory_scope"] == "canonical"

    asyncio.run(_run_with_client(main, scenario))


def test_same_telegram_user_can_link_multiple_products(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    with main.Session(bind=main.engine) as db:
        user = main.get_or_create_user(db, email="multi-product@example.com", name="Multi Product")
        db.add(
            main.TelegramLink(
                user_id=user.id,
                product_slug="marketing-agent",
                telegram_user_id="tg-multi-001",
                telegram_chat_id="chat-multi-001",
                status="linked",
                linked_at=main.utc_now(),
            )
        )
        db.add(
            main.TelegramLink(
                user_id=user.id,
                product_slug="finance-agent",
                telegram_user_id="tg-multi-001",
                telegram_chat_id="chat-multi-001",
                status="linked",
                linked_at=main.utc_now(),
            )
        )
        db.commit()


def test_same_telegram_user_cannot_link_same_product_for_two_accounts(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    with main.Session(bind=main.engine) as db:
        first_user = main.get_or_create_user(db, email="account-one@example.com", name="Account One")
        second_user = main.get_or_create_user(db, email="account-two@example.com", name="Account Two")
        db.add(
            main.TelegramLink(
                user_id=first_user.id,
                product_slug="marketing-agent",
                telegram_user_id="tg-shared-identity",
                telegram_chat_id="chat-shared-identity-1",
                status="linked",
                linked_at=main.utc_now(),
            )
        )
        db.commit()

        db.add(
            main.TelegramLink(
                user_id=second_user.id,
                product_slug="marketing-agent",
                telegram_user_id="tg-shared-identity",
                telegram_chat_id="chat-shared-identity-2",
                status="linked",
                linked_at=main.utc_now(),
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
        else:
            raise AssertionError("Expected duplicate telegram_user_id for the same product to be rejected")


def test_same_telegram_chat_cannot_link_same_product_for_two_accounts(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    with main.Session(bind=main.engine) as db:
        first_user = main.get_or_create_user(db, email="chat-one@example.com", name="Chat One")
        second_user = main.get_or_create_user(db, email="chat-two@example.com", name="Chat Two")
        db.add(
            main.TelegramLink(
                user_id=first_user.id,
                product_slug="finance-agent",
                telegram_user_id="tg-chat-001-a",
                telegram_chat_id="chat-shared-room",
                status="linked",
                linked_at=main.utc_now(),
            )
        )
        db.commit()

        db.add(
            main.TelegramLink(
                user_id=second_user.id,
                product_slug="finance-agent",
                telegram_user_id="tg-chat-001-b",
                telegram_chat_id="chat-shared-room",
                status="linked",
                linked_at=main.utc_now(),
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
        else:
            raise AssertionError("Expected duplicate telegram_chat_id for the same product to be rejected")


def test_grant_product_pass_sets_30_day_bounds(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    def coerce_utc(value):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    with main.Session(bind=main.engine) as db:
        user = main.get_or_create_user(db, email="passes@example.com", name="Passes")
        purchase = main.Purchase(
            user_id=user.id,
            status="paid",
            currency="INR",
            amount_minor=100,
            metadata_json={},
        )
        db.add(purchase)
        db.commit()
        db.refresh(purchase)

        before = main.utc_now()
        entitlement = main.grant_product_pass(
            db,
            user_id=user.id,
            purchase=purchase,
            product_slug="marketing-agent",
        )
        after = main.utc_now()

        starts_at = coerce_utc(entitlement.starts_at)
        ends_at = coerce_utc(entitlement.ends_at)

        assert starts_at is not None
        assert ends_at is not None
        assert before <= starts_at <= after
        assert ends_at - starts_at == timedelta(days=30)


def test_grant_product_pass_renews_from_existing_future_end(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    def coerce_utc(value):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    with main.Session(bind=main.engine) as db:
        user = main.get_or_create_user(db, email="renewal@example.com", name="Renewal")
        purchase_one = main.Purchase(
            user_id=user.id,
            status="paid",
            currency="INR",
            amount_minor=100,
            metadata_json={},
        )
        db.add(purchase_one)
        db.commit()
        db.refresh(purchase_one)

        first_entitlement = main.grant_product_pass(
            db,
            user_id=user.id,
            purchase=purchase_one,
            product_slug="marketing-agent",
        )
        first_end = coerce_utc(first_entitlement.ends_at)

        purchase_two = main.Purchase(
            user_id=user.id,
            status="paid",
            currency="INR",
            amount_minor=100,
            metadata_json={},
        )
        db.add(purchase_two)
        db.commit()
        db.refresh(purchase_two)

        renewed = main.grant_product_pass(
            db,
            user_id=user.id,
            purchase=purchase_two,
            product_slug="marketing-agent",
        )
        renewed_start = coerce_utc(renewed.starts_at)
        renewed_end = coerce_utc(renewed.ends_at)

        assert renewed_start == coerce_utc(first_entitlement.starts_at)
        assert renewed_end == first_end + timedelta(days=30)


def test_early_pass_renewal_preserves_active_access(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    def coerce_utc(value):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    with main.Session(bind=main.engine) as db:
        user = main.get_or_create_user(db, email="active-renewal@example.com", name="Active Renewal")
        purchase_one = main.Purchase(
            user_id=user.id,
            status="paid",
            currency="INR",
            amount_minor=100,
            metadata_json={},
        )
        db.add(purchase_one)
        db.commit()
        db.refresh(purchase_one)

        first_entitlement = main.grant_product_pass(
            db,
            user_id=user.id,
            purchase=purchase_one,
            product_slug="marketing-agent",
        )
        first_start = coerce_utc(first_entitlement.starts_at)
        first_end = coerce_utc(first_entitlement.ends_at)

        purchase_two = main.Purchase(
            user_id=user.id,
            status="paid",
            currency="INR",
            amount_minor=100,
            metadata_json={},
        )
        db.add(purchase_two)
        db.commit()
        db.refresh(purchase_two)

        renewed = main.grant_product_pass(
            db,
            user_id=user.id,
            purchase=purchase_two,
            product_slug="marketing-agent",
        )

        assert coerce_utc(renewed.starts_at) == first_start
        assert coerce_utc(renewed.ends_at) == first_end + timedelta(days=30)
        status = main.build_agent_account_status(db, user_id=user.id)
        products = {item.product_slug: item for item in status.products}
        assert products["marketing-agent"].has_active_pass is True
