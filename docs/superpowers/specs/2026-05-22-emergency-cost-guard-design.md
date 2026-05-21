# Emergency Cost Guard Design

Date: 2026-05-22

## Purpose

Founder Systems needs an emergency cost guard that prevents runaway AI spend before more agent features are expanded. The immediate trigger is unexpected AWS Bedrock usage, especially DeepSeek token volume. The guard must make Founder Systems the control plane for every paid or admin-triggered model call across Founder Systems, PromptDeck, and Founder Agents runtime.

This design intentionally focuses only on cost safety, usage attribution, and admin visibility. Product polish, new agent capabilities, Cofounder orchestration, and broader billing redesign are out of scope until the guard is live.

## Goals

- Require a Founder Systems preflight check before every model call that can cost money.
- Deny model calls when wallet credits, user status, product status, model status, or rate limits do not allow the request.
- Record every allowed and denied attempt with enough metadata to debug cost spikes.
- Add an analytics cockpit for admin review of credits, model usage, product usage, blocked users, and abnormal burn.
- Provide emergency kill switches for expensive providers/models, including DeepSeek.
- Keep paid users from silently burning the owner's AWS credits without attribution.

## Non-Goals

- No new subscription pricing implementation in this phase.
- No new Telegram product behavior beyond enforcing limits around existing runtime calls.
- No autonomous external actions for marketing, finance, or ops agents.
- No full Stripe/Razorpay redesign.
- No complex token-perfect cost accounting in V1; estimates are acceptable when providers do not return exact usage.

## Architecture

Founder Systems API becomes the single cost-control authority. Each app calls it before model usage:

- Founder Agents runtime calls Founder Systems before every Telegram agent reply.
- PromptDeck calls Founder Systems before every generation, import, rebuild, extraction, and model-backed helper.
- Founder Systems serverless AI endpoints call the same internal service before invoking OpenAI, LiteLLM, Bedrock, Google, or any image model.
- Analytics reads the resulting guard events, wallet balances, usage events, and limits through admin-only endpoints.

The guard has three phases per paid model action:

1. `reserve`: validate access, wallet, rate limits, model allowlist, and estimated credit cost before calling a model.
2. `finalize`: record actual or estimated usage after success and debit wallet credits.
3. `release`: cancel the reservation when the app fails before a model response is completed.

For emergency rollout, the first version can debit on reserve for simple one-credit actions when a precise finalize path is not available. More accurate provider token accounting can be added after the guard is deployed.

## Guard Rules

Default emergency rules:

- DeepSeek v3.1 is disabled by default or capped behind a very low daily global limit until attribution is live.
- Every model call needs a product slug, action name, user/workspace identity, model provider, model id, estimated input size, estimated output cap, and request reference id.
- A request is denied if the user is blocked, the product is disabled, the model is disabled, the wallet is empty, the product daily cap is exceeded, the user daily cap is exceeded, or the global provider/model cap is exceeded.
- The guard enforces max prompt size and max output tokens per product/action/model.
- Admin users can be marked as internal, but admin bypass must still log usage and respect global provider kill switches.

Initial safe defaults:

- Per-user agent chat: 20 allowed model replies per day per product.
- Per-user heavy file/import action: 3 allowed model-backed imports per day.
- Per-user PromptDeck generation/rebuild: 3 allowed heavy actions per day unless more credits exist and the model is enabled.
- Global DeepSeek v3.1: disabled by default until attribution is visible in analytics.
- Global Bedrock fallback: allow cheaper default models only, with daily global cap.
- Max agent output: 400 tokens.
- Max PromptDeck import output per LLM step: current code caps remain, but guard blocks oversized files/prompts before calls.

The exact numeric defaults should be environment-configurable so production can be tightened quickly without redeploying code.

## Data Model

Add cost-control entities to Founder Systems API:

- `ai_model_policies`: provider/model allowlist, status, cost estimate, max input, max output, daily global cap.
- `ai_usage_reservations`: short-lived preflight reservations with status `reserved`, `finalized`, `released`, or `expired`.
- `ai_usage_events`: immutable audit log for allowed and denied attempts.
- `user_access_blocks`: admin block records with reason, status, created by, and timestamps.
- `rate_limit_overrides`: optional per-user/per-product overrides for support and testing.

Existing `credit_wallets`, `credit_ledger_entries`, and `product_usage_events` remain the wallet and ledger source of truth. New AI usage records link back to wallet entries when credits are debited.

## API Surface

Internal runtime endpoints:

- `POST /v1/internal/runtime/actions/reserve`
- `POST /v1/internal/runtime/actions/finalize`
- `POST /v1/internal/runtime/actions/release`

Admin analytics endpoints:

- `GET /v1/admin/cost-guard/summary`
- `GET /v1/admin/cost-guard/users`
- `GET /v1/admin/cost-guard/events`
- `GET /v1/admin/cost-guard/models`
- `POST /v1/admin/cost-guard/users/{user_id}/block`
- `POST /v1/admin/cost-guard/users/{user_id}/unblock`
- `PATCH /v1/admin/cost-guard/models/{policy_id}`

All internal endpoints require the existing internal API key or an admin session. All admin endpoints require admin authentication.

## App Integration Points

Founder Agents runtime:

- Guard `generate_agent_reply` before Google or Bedrock calls.
- Include product slug, Telegram user id, provider, model id, input character count, max output tokens, and reference id.
- Show a friendly refusal message when the guard denies access or credits.

PromptDeck:

- Guard `/import-deck`, `/open-design/rebuild`, `/open-design/rebuild-upload`, `/open-design/generate-description`, and any model-backed helper.
- Guard both `azure_responses_extract` and `client.chat.completions.create` paths.
- Replace any unguarded import path with Founder Systems access and credit enforcement.

Founder Systems serverless AI endpoints:

- Guard `api/founder-outreach-generate.js` before OpenAI/LiteLLM calls.
- Guard image generation endpoints if they are reintroduced or deployed from snapshots.

Analytics:

- Extend FounderOS Analytics beyond sales metrics.
- Show global wallet/credit burn, per-user balances, per-product usage, per-model usage, denial reasons, blocked users, and spike warnings.
- Add admin actions for block/unblock and model enable/disable.

## Error Handling

Apps should fail closed for paid model calls. If Founder Systems guard is unavailable, customer-facing model calls are denied with a clear temporary message instead of falling through to unmetered provider calls.

Denied user message examples:

- "Your shared wallet is out of credits. Add credits in Founder Systems to continue."
- "This model is temporarily paused while Founder Systems protects usage limits."
- "You have hit today's safety limit for this product. Try again tomorrow or contact support."

Admin analytics should record the denial reason even when the model call never happened.

## Testing

Founder Systems API tests:

- Reserve succeeds with active pass, wallet balance, enabled model, and available limits.
- Reserve denies empty wallet.
- Reserve denies blocked user.
- Reserve denies disabled model.
- Reserve denies per-user daily cap.
- Finalize debits wallet and records usage event.
- Release does not debit finalized credits twice.
- Analytics summary includes allowed and denied events.

PromptDeck tests:

- Import route requires Founder Systems guard.
- Rebuild route reserves before job creation.
- Failed guard prevents model calls.

Founder Agents runtime tests:

- Telegram message calls reserve before model generation.
- Denied reserve sends friendly refusal and skips provider call.
- Provider failure releases reservation.

Analytics UI tests:

- Dashboard renders cost guard summary.
- User table shows wallet, usage, and blocked state.
- Model table allows disabled status to be displayed clearly.

## Rollout

1. Ship Founder Systems API guard endpoints with conservative defaults.
2. Patch Founder Agents runtime, PromptDeck, and Founder Systems AI endpoints to fail closed through the guard.
3. Deploy analytics read-only cockpit.
4. Add admin actions for user block/unblock and model enable/disable.
5. Re-enable higher-risk models only after events show reliable user/product/model attribution.

## Open Decisions

- Exact production caps can be tuned after the first deploy, but DeepSeek should stay disabled or hard-capped until attribution is visible.
- Whether admin users can bypass wallet credits should be decided separately; they should not bypass global model kill switches.
- Exact credit-to-token pricing can start as coarse estimates and become model-specific after usage telemetry is stable.
