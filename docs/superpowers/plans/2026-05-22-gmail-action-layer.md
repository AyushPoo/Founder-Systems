# Gmail Action Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first user-owned operator action loop: connect Gmail, verify connection status, and send an approved email from the user's Gmail through Founder Systems.

**Architecture:** Founder Systems remains the control plane for OAuth, encrypted token storage, access checks, wallet/cost guard, and audit logs. Hermes/runtime remains the chat layer and calls internal Founder Systems action endpoints only after collecting user approval.

**Tech Stack:** FastAPI, SQLAlchemy, Postgres/SQLite tests, Google OAuth 2.0, Gmail API, React/Vite, Telegram runtime bridge.

---

## File Structure

- `founder_systems_api/app/models.py`: Add `UserIntegrationAccount` for encrypted user-owned integration credentials.
- `founder_systems_api/app/config.py`: Add token encryption setting and Gmail action cost setting.
- `founder_systems_api/app/schemas.py`: Add integration status and Gmail send request/response schemas.
- `founder_systems_api/app/integrations.py`: Own OAuth state, token encryption/decryption, Gmail token refresh, Gmail send, and integration lookup.
- `founder_systems_api/app/main.py`: Add account-facing Gmail OAuth endpoints and internal runtime email action endpoint.
- `founder_systems_api/tests/test_integrations.py`: TDD coverage for OAuth start/callback, status, missing Gmail denial, Gmail send, and credit logging.
- `src/utils/founderApi.js`: Add integration status and Gmail connect URL helpers.
- `src/pages/Account.jsx`: Add connected tools card in Account settings.
- `F:/Work/Website/founder-agents-runtime/bridge/app.py`: Add a minimal approval-aware email action path after API support lands.

## Tasks

### Task 1: API integration account model and schemas

- [ ] Write failing tests that a signed-in user sees Gmail as disconnected, then connected after an OAuth callback stores a Gmail integration.
- [ ] Add `UserIntegrationAccount` with encrypted token storage and a unique `(user_id, provider, integration_slug)` constraint.
- [ ] Add `IntegrationAccountResponse`, `IntegrationStatusEnvelope`, `GmailSendRequest`, and `GmailSendResponse`.
- [ ] Run `py -3 -m pytest founder_systems_api/tests/test_integrations.py -q`.

### Task 2: Gmail OAuth connect flow

- [ ] Write failing tests for `/integrations/google/gmail/start` redirect parameters.
- [ ] Write failing tests for `/integrations/google/gmail/callback` storing token payload and redirecting back to Account.
- [ ] Implement signed OAuth state bound to the current Founder Systems user.
- [ ] Request `openid email profile https://www.googleapis.com/auth/gmail.send` with `access_type=offline`, `prompt=consent`, and `include_granted_scopes=true`.
- [ ] Run targeted integration tests.

### Task 3: Gmail send service

- [ ] Write failing tests for sending an RFC 2822 email via Gmail API using a refreshed access token.
- [ ] Implement encrypted token decode, refresh-token exchange, base64url MIME generation, and Gmail API send call.
- [ ] Ensure refresh token is preserved if Google only returns a new access token.
- [ ] Run targeted integration tests.

### Task 4: Internal runtime action endpoint

- [ ] Write failing tests that internal send denies when Gmail is missing, pass is inactive, user is blocked, or wallet is empty.
- [ ] Implement `/v1/internal/runtime/actions/email/send`.
- [ ] Reserve with cost guard before sending and finalize only after Gmail API success.
- [ ] Release reservation on provider failure and log metadata for analytics.
- [ ] Run API tests.

### Task 5: Account UI for connected tools

- [ ] Add API helpers for integration status and Gmail connect URL.
- [ ] Add Account Settings card showing Gmail connected/disconnected and a `Connect Gmail` button.
- [ ] Run frontend tests.

### Task 6: Runtime approval loop

- [ ] Add pending email draft detection in the marketing runtime.
- [ ] Store a pending draft per Telegram user/product.
- [ ] On explicit approval, call Founder Systems internal email action endpoint.
- [ ] Reply with sent/failed status and next steps.
- [ ] Run runtime tests.

### Task 7: Deploy and verify

- [ ] Run Founder Systems API test suite.
- [ ] Run frontend test/build.
- [ ] Deploy API and frontend.
- [ ] Deploy runtime bridge.
- [ ] Verify analytics cost guard shows allowed/finalized Gmail action attempts.
- [ ] Test with the logged-in `ayushpoojary1@gmail.com` account.

