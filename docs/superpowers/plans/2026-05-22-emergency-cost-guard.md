# Emergency Cost Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add emergency AI spend guardrails so every paid model call is preflighted, logged, rate-limited, and visible to admins.

**Architecture:** Founder Systems API becomes the cost-control authority with guard policies, reservations, events, block records, and admin analytics endpoints. Founder Agents runtime, PromptDeck, and Founder Systems AI endpoints must fail closed through the guard before provider calls. FounderOS Analytics reads admin guard endpoints and displays usage, denials, wallet state, model state, and user blocks.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest/httpx, Vite React, Node serverless functions, Python FastAPI PromptDeck runtime.

---

### Task 1: Founder Systems Cost Guard Models And Schemas

**Files:**
- Modify: `founder_systems_api/app/models.py`
- Modify: `founder_systems_api/app/schemas.py`
- Test: `founder_systems_api/tests/test_cost_guard.py`

- [ ] **Step 1: Add failing model/schema tests**

Create `founder_systems_api/tests/test_cost_guard.py` with tests that import the app, create tables, and assert guard tables can store model policy, reservation, event, and user block data.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest founder_systems_api/tests/test_cost_guard.py -q`
Expected: FAIL because `AiModelPolicy`, `AiUsageReservation`, `AiUsageEvent`, and `UserAccessBlock` do not exist.

- [ ] **Step 3: Add SQLAlchemy models**

Add focused models:

```python
class AiModelPolicy(Base):
    __tablename__ = "ai_model_policies"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_str)
    provider: Mapped[str] = mapped_column(String(80), index=True)
    model_id: Mapped[str] = mapped_column(String(200), index=True)
    status: Mapped[str] = mapped_column(String(32), default="enabled", index=True)
    max_input_chars: Mapped[int] = mapped_column(Integer, default=12000)
    max_output_tokens: Mapped[int] = mapped_column(Integer, default=800)
    daily_global_limit: Mapped[int] = mapped_column(Integer, default=1000)
    cost_per_1k_input_minor: Mapped[int] = mapped_column(Integer, default=0)
    cost_per_1k_output_minor: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
```

Add similar classes for `AiUsageReservation`, `AiUsageEvent`, and `UserAccessBlock` with product/user/workspace/model/action fields and JSON metadata.

- [ ] **Step 4: Add Pydantic schemas**

Add request/response schemas for reserve, finalize, release, admin summary, admin users, admin events, admin models, and block/unblock actions.

- [ ] **Step 5: Run model/schema tests**

Run: `python -m pytest founder_systems_api/tests/test_cost_guard.py -q`
Expected: PASS.

### Task 2: Founder Systems Guard Service

**Files:**
- Create: `founder_systems_api/app/cost_guard.py`
- Modify: `founder_systems_api/app/services.py`
- Test: `founder_systems_api/tests/test_cost_guard.py`

- [ ] **Step 1: Add failing reserve tests**

Add tests for successful reserve, disabled DeepSeek denial, empty wallet denial, blocked user denial, and per-user daily cap denial.

- [ ] **Step 2: Implement guard service**

Create functions:

```python
def reserve_ai_usage(db: Session, payload: AiUsageReserveRequest) -> AiUsageGuardResponse:
    ...

def finalize_ai_usage(db: Session, payload: AiUsageFinalizeRequest) -> AiUsageGuardResponse:
    ...

def release_ai_usage(db: Session, payload: AiUsageReleaseRequest) -> AiUsageGuardResponse:
    ...
```

Rules: fail closed, require active user/workspace, require wallet credits unless admin/internal bypass, deny disabled model, deny blocked user, enforce per-day caps, create event for every denial, create reservation for every allowance.

- [ ] **Step 3: Seed emergency model policies**

Add a helper that creates default policies for `bedrock/amazon.nova-lite-v1:0`, `google/gemini-2.5-flash`, `openai/gpt-4.1-mini`, `litellm/action`, and disabled `bedrock/deepseek.v3.1`.

- [ ] **Step 4: Run guard service tests**

Run: `python -m pytest founder_systems_api/tests/test_cost_guard.py -q`
Expected: PASS.

### Task 3: Founder Systems API Endpoints

**Files:**
- Modify: `founder_systems_api/app/main.py`
- Modify: `founder_systems_api/app/schemas.py`
- Test: `founder_systems_api/tests/test_cost_guard.py`

- [ ] **Step 1: Add failing endpoint tests**

Test `/v1/internal/runtime/actions/reserve`, `/finalize`, `/release`, `/v1/admin/cost-guard/summary`, `/users`, `/events`, `/models`, block/unblock, and model patch.

- [ ] **Step 2: Add endpoints**

Wire internal endpoints to the guard service using `require_admin_or_internal`. Wire admin endpoints using admin session authentication.

- [ ] **Step 3: Run endpoint tests**

Run: `python -m pytest founder_systems_api/tests/test_cost_guard.py -q`
Expected: PASS.

### Task 4: Founder Agents Runtime Guard Integration

**Files:**
- Modify: `F:\Work\Website\founder-agents-runtime\bridge\schemas.py`
- Modify: `F:\Work\Website\founder-agents-runtime\bridge\app.py`
- Test: `F:\Work\Website\founder-agents-runtime\bridge\tests\test_access.py`

- [ ] **Step 1: Add failing runtime tests**

Test that Telegram message reserves before model generation, skips provider call when reserve is denied, and releases reservation when provider generation fails.

- [ ] **Step 2: Implement runtime reserve/finalize/release around `generate_agent_reply`**

Generate a reference id, estimate input chars, set provider/model metadata, call reserve before Google/Bedrock, finalize on success, release on provider failure.

- [ ] **Step 3: Run runtime tests**

Run: `python -m pytest bridge/tests/test_access.py -q`
Expected: PASS.

### Task 5: PromptDeck Guard Integration

**Files:**
- Modify: `F:\Work\Website\promptdeck\backend\founder_access.py`
- Modify: `F:\Work\Website\promptdeck\backend\main.py`
- Modify: `F:\Work\Website\promptdeck\backend\extraction.py`
- Test: `F:\Work\Website\promptdeck\backend\tests\test_open_design_adapter.py`

- [ ] **Step 1: Add failing PromptDeck tests**

Test that `/import-deck` requires Founder Systems access/guard before `process_files_for_import`, and that failed reserve prevents extraction model calls.

- [ ] **Step 2: Add Founder Systems guard client helpers**

Add `reserve_ai_usage`, `finalize_ai_usage`, and `release_ai_usage` in `founder_access.py`, reusing the existing access URL and headers.

- [ ] **Step 3: Guard PromptDeck model-backed endpoints**

Call reserve before import/rebuild/generate-description and finalize/release around job/model execution. Ensure `/import-deck` is no longer unguarded.

- [ ] **Step 4: Run PromptDeck tests**

Run: `python -m pytest backend/tests/test_open_design_adapter.py -q`
Expected: PASS.

### Task 6: Founder Systems Serverless AI Guard

**Files:**
- Modify: `api/founder-outreach-generate.js`
- Test: `api/founder-outreach-generate.test.js`

- [ ] **Step 1: Add failing serverless guard tests**

Test that the outreach generator calls Founder Systems reserve before LiteLLM/OpenAI and skips provider call when denied.

- [ ] **Step 2: Implement guard helper**

Add an internal API helper using `FOUNDER_SYSTEMS_API_URL` and `FOUNDER_SYSTEMS_INTERNAL_API_KEY`, then reserve/finalize/release around the model call.

- [ ] **Step 3: Run serverless tests**

Run: `npm test -- founder-outreach-generate`
Expected: PASS.

### Task 7: Analytics Admin Cockpit

**Files:**
- Modify: `F:\Work\FounderOS-Analytics\src\hooks\useMetrics.js`
- Modify: `F:\Work\FounderOS-Analytics\src\pages\Dashboard.jsx`
- Create: `F:\Work\FounderOS-Analytics\src\components\CostGuardPanel.jsx`
- Modify: `F:\Work\FounderOS-Analytics\src\api\client.js`

- [ ] **Step 1: Add dashboard data loading**

Fetch `/api/cost-guard/summary`, `/api/cost-guard/users`, `/api/cost-guard/events`, and `/api/cost-guard/models`.

- [ ] **Step 2: Add cost guard panel**

Render cards for allowed/denied requests, wallet burn, disabled models, top users, recent denials, and blocked users.

- [ ] **Step 3: Add admin actions**

Add model status patch and user block/unblock buttons that call admin endpoints and refresh dashboard data.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS.

### Task 8: Verification And Commit

**Files:**
- All modified files

- [ ] **Step 1: Run focused API tests**

Run: `python -m pytest founder_systems_api/tests/test_cost_guard.py founder_systems_api/tests/test_agents.py founder_systems_api/tests/test_workspace_memory_and_credits.py -q`
Expected: PASS.

- [ ] **Step 2: Run frontend tests/builds where available**

Run Founder Systems frontend tests and Analytics build.

- [ ] **Step 3: Check git status across repos**

Run `git status --short --branch` in Founder Systems, FounderOS Analytics, Founder Agents runtime, and PromptDeck.

- [ ] **Step 4: Commit Founder Systems changes**

Commit the Founder Systems API/serverless/spec/plan changes on `codex/emergency-cost-guard`.

- [ ] **Step 5: Report uncommitted cross-repo runtime changes if any**

If runtime repos are not under the same git repo, report their changed files clearly for the user to review.
