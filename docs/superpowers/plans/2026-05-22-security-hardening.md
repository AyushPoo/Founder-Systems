# Founder Systems Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Founder Systems against the concrete auth, payment, credit-abuse, redirect, API-exposure, and dependency risks found in the security audit without breaking existing founder flows.

**Architecture:** Treat this as one security release with five small, test-first tracks: fail-closed production config, strict redirect/secret boundaries, server-side billing and AI usage enforcement, public-surface hardening, and dependency cleanup plus regression verification. Reuse the existing Python backend as the source of truth for identity, wallet state, and AI usage controls instead of trusting frontend or Vercel-route inputs.

**Tech Stack:** FastAPI, SQLAlchemy, Vercel serverless functions, React/Vite, nginx, Razorpay, Gmail OAuth, pytest, npm audit, pip-audit

---

## File map

- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\config.py`
  - Fail-closed production settings and explicit security toggles.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\main.py`
  - Startup validation, strict redirect validation, security headers middleware, docs gating, magic-link throttling, server-side credit spend enforcement.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\integrations.py`
  - Separate integration secret usage and stricter OAuth state handling.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\payments.py`
  - Remove dangerous mock webhook bypass from production behavior.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\schemas.py`
  - Remove client-controlled credit pricing from external spend requests.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\services.py`
  - Add server-side usage-cost lookup and durable request-throttle helpers.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\models.py`
  - Add a simple request-throttle table for auth abuse control.
- **Create:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py`
  - Focused regression tests for config, redirects, throttling, docs exposure, and spend enforcement.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_main.py`
  - Update any expectations broken by safer defaults.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_integrations.py`
  - Add Gmail-state and integration-secret tests.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_cost_guard.py`
  - Assert the backend guard owns usage pricing and reserve/finalize flow.
- **Create:** `E:\Work\Founder-Systems-main-merge\api\_lib\founderBackendGuard.js`
  - Shared helper for Vercel AI routes to resolve authenticated user via backend session and call reserve/finalize/release.
- **Modify:** `E:\Work\Founder-Systems-main-merge\api\_lib\founderAiRuntime.js`
  - Stop trusting client identity headers for spend protection; use backend guard instead.
- **Modify:** `E:\Work\Founder-Systems-main-merge\api\founder-update-generate.js`
- **Modify:** `E:\Work\Founder-Systems-main-merge\api\founder-pdf-summarize.js`
- **Modify:** `E:\Work\Founder-Systems-main-merge\api\founder-safe-explainer.js`
- **Modify:** `E:\Work\Founder-Systems-main-merge\api\founder-outreach-generate.js`
- **Modify:** `E:\Work\Founder-Systems-main-merge\api\linkedin-candidate-screener.js`
  - Use the backend guard helper for authenticated usage gating.
- **Modify:** `E:\Work\Founder-Systems-main-merge\vercel.json`
  - Add frontend security headers.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\deploy\nginx\founder-systems-api.conf.example`
  - Add API hardening headers and safer proxy defaults.
- **Modify:** `E:\Work\Founder-Systems-main-merge\founder_systems_api\requirements.txt`
  - Upgrade vulnerable backend packages to patched versions.

---

### Task 1: Fail closed in production config

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\config.py`
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\main.py:361-378`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py`

- [ ] **Step 1: Write failing tests for insecure production startup**

```python
def test_production_requires_real_session_secret(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_ENV", "production")
    monkeypatch.setenv("FS_DATABASE_URL", f"sqlite:///{(tmp_path / 'db.sqlite3').as_posix()}")
    monkeypatch.setenv("FS_SESSION_SECRET", "change-me-in-production")
    monkeypatch.setenv("FS_ALLOW_MOCK_PAYMENTS", "false")
    monkeypatch.setenv("FS_SESSION_COOKIE_SECURE", "true")

    with pytest.raises(RuntimeError, match="FS_SESSION_SECRET"):
        importlib.import_module("founder_systems_api.app.main")


def test_production_rejects_mock_payments(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_ENV", "production")
    monkeypatch.setenv("FS_DATABASE_URL", f"sqlite:///{(tmp_path / 'db.sqlite3').as_posix()}")
    monkeypatch.setenv("FS_SESSION_SECRET", "real-secret-value")
    monkeypatch.setenv("FS_ALLOW_MOCK_PAYMENTS", "true")
    monkeypatch.setenv("FS_SESSION_COOKIE_SECURE", "true")

    with pytest.raises(RuntimeError, match="FS_ALLOW_MOCK_PAYMENTS"):
        importlib.import_module("founder_systems_api.app.main")
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run:

```powershell
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py -k "production_requires_real_session_secret or production_rejects_mock_payments" -q
```

Expected: FAIL because startup validation does not exist yet.

- [ ] **Step 3: Add explicit production validation**

Add a validator helper in `config.py`:

```python
def validate_production_settings(self) -> None:
    if self.env != "production":
        return
    if not self.session_secret or self.session_secret == "change-me-in-production":
        raise RuntimeError("FS_SESSION_SECRET must be set to a long random secret in production")
    if not self.session_cookie_secure:
        raise RuntimeError("FS_SESSION_COOKIE_SECURE must be true in production")
    if self.allow_mock_payments:
        raise RuntimeError("FS_ALLOW_MOCK_PAYMENTS must be false in production")
    if not self.api_key_internal:
        raise RuntimeError("FS_API_KEY_INTERNAL must be configured in production")
    if not self.integration_token_secret:
        raise RuntimeError("FS_INTEGRATION_TOKEN_SECRET must be configured in production")
```

Call it at startup in `main.py`:

```python
@app.on_event("startup")
def on_startup() -> None:
    settings.validate_production_settings()
    Base.metadata.create_all(bind=engine)
    with Session(bind=engine) as db:
        ensure_seed_data(db, settings)
        ensure_default_ai_model_policies(db, settings)
```

- [ ] **Step 4: Re-run the tests**

Run:

```powershell
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py -k "production_requires_real_session_secret or production_rejects_mock_payments" -q
```

Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add E:\Work\Founder-Systems-main-merge\founder_systems_api\app\config.py E:\Work\Founder-Systems-main-merge\founder_systems_api\app\main.py E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py
git commit -m "fix: fail closed on insecure production settings"
```

---

### Task 2: Replace prefix-based redirects and split integration secrets from session secrets

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\main.py:412-433`
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\integrations.py:25-68`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_integrations.py`

- [ ] **Step 1: Write the failing redirect and secret-isolation tests**

```python
def test_safe_return_url_rejects_lookalike_domain(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)
    assert main._safe_return_url("https://foundersystems.in.evil.com/account") == "https://foundersystems.in/account"


def test_integration_crypto_does_not_fall_back_to_session_secret(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_ENV", "production")
    monkeypatch.setenv("FS_SESSION_SECRET", "session-secret")
    monkeypatch.delenv("FS_INTEGRATION_TOKEN_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="FS_INTEGRATION_TOKEN_SECRET"):
        _bootstrap_app(monkeypatch, tmp_path)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```powershell
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py -k "safe_return_url_rejects_lookalike_domain or integration_crypto_does_not_fall_back_to_session_secret" -q
```

Expected: FAIL

- [ ] **Step 3: Implement strict URL origin validation**

Replace `startswith` logic in `_safe_return_url` with parsed origin matching:

```python
from urllib.parse import urlparse


def _origin(url: str) -> tuple[str, str, int | None]:
    parsed = urlparse(url)
    return parsed.scheme, parsed.hostname or "", parsed.port


def _safe_return_url(candidate: str | None) -> str:
    fallback = f"{settings.site_app_url.rstrip('/')}/account"
    if not candidate:
        return fallback
    cleaned = candidate.strip()
    parsed = urlparse(cleaned)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return fallback
    allowed = {_origin(settings.site_app_url), _origin(settings.account_app_url), _origin(settings.promptdeck_app_url)}
    if _origin(cleaned) not in allowed:
        return fallback
    return cleaned
```

- [ ] **Step 4: Remove integration-token fallback to session secret**

In `integrations.py`, make the encryption helper strict:

```python
def _fernet(settings: Settings) -> Fernet:
    if not settings.integration_token_secret:
        raise RuntimeError("FS_INTEGRATION_TOKEN_SECRET must be configured")
    secret = settings.integration_token_secret.encode("utf-8")
    key = base64.urlsafe_b64encode(hashlib.sha256(secret).digest())
    return Fernet(key)
```

Keep Gmail OAuth state signing on `session_secret`, but keep token encryption separate.

- [ ] **Step 5: Re-run redirect and integration tests**

Run:

```powershell
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py -k "safe_return_url_rejects_lookalike_domain or integration_crypto_does_not_fall_back_to_session_secret" -q
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_integrations.py -q
```

Expected: PASS

- [ ] **Step 6: Commit**

```powershell
git add E:\Work\Founder-Systems-main-merge\founder_systems_api\app\main.py E:\Work\Founder-Systems-main-merge\founder_systems_api\app\integrations.py E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_integrations.py
git commit -m "fix: harden redirects and split integration secrets"
```

---

### Task 3: Move billing and AI usage protection fully server-side

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\schemas.py:415-418`
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\main.py:1307-1327`
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\services.py:703-740`
- Create: `E:\Work\Founder-Systems-main-merge\api\_lib\founderBackendGuard.js`
- Modify: `E:\Work\Founder-Systems-main-merge\api\_lib\founderAiRuntime.js`
- Modify: `E:\Work\Founder-Systems-main-merge\api\founder-update-generate.js`
- Modify: `E:\Work\Founder-Systems-main-merge\api\founder-pdf-summarize.js`
- Modify: `E:\Work\Founder-Systems-main-merge\api\founder-safe-explainer.js`
- Modify: `E:\Work\Founder-Systems-main-merge\api\founder-outreach-generate.js`
- Modify: `E:\Work\Founder-Systems-main-merge\api\linkedin-candidate-screener.js`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_cost_guard.py`
- Test: `E:\Work\Founder-Systems-main-merge\api\_lib\founderAiRuntime.test.js`

- [ ] **Step 1: Write the failing backend spend-enforcement test**

```python
def test_product_usage_spend_ignores_client_credit_override(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client):
        await _authenticate(client)
        order = await client.post("/wallet/packs/checkout", json={"pack_slug": "starter", "currency": "INR"})
        order_body = order.json()
        webhook_payload = {
            "event": "payment.captured",
            "payload": {"payment": {"entity": {"id": "pay_wallet_credits", "order_id": order_body["razorpay_order_id"]}}},
        }
        await client.post("/webhooks/razorpay", content=json.dumps(webhook_payload), headers={"Content-Type": "application/json", "X-Razorpay-Signature": "mock-signature"})
        wallet_before = (await client.get("/wallet")).json()["wallet"]["balance"]
        spend = await client.post("/products/founder-update-generator/usage-spend", json={"action": "generate", "credits": 1})
        assert spend.status_code == 200
        wallet_after = spend.json()["balance"]
        assert wallet_after == wallet_before - 2
```

- [ ] **Step 2: Run the backend spend test**

Run:

```powershell
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py -k "product_usage_spend_ignores_client_credit_override" -q
```

Expected: FAIL because the route still trusts client-provided credits.

- [ ] **Step 3: Replace client credit input with a server-side usage policy**

Update the schema:

```python
class ProductUsageSpendRequest(BaseModel):
    action: str = Field(default="generate", max_length=120)
    metadata: dict[str, Any] = Field(default_factory=dict)
```

Add a policy helper in `services.py`:

```python
USAGE_CREDIT_COSTS = {
    ("founder-update-generator", "generate"): 2,
    ("founder-document-intelligence", "generate"): 3,
    ("founder-outreach-kit", "generate"): 2,
    ("linkedin-candidate-screener", "screen"): 1,
}


def resolve_usage_credit_cost(product_slug: str, action: str) -> int:
    return USAGE_CREDIT_COSTS.get((product_slug, action), 1)
```

Use it in the route:

```python
credits = resolve_usage_credit_cost(product_slug, payload.action)
wallet, _usage_event = consume_wallet_credits(
    db,
    workspace_id=workspace.id,
    user_id=user.id,
    product_slug=product_slug,
    action=payload.action,
    credits=credits,
    metadata=payload.metadata,
)
```

- [ ] **Step 4: Add a backend guard helper for Vercel AI routes**

Create `api/_lib/founderBackendGuard.js`:

```js
export async function resolveBackendSession({ req, apiBaseUrl }) {
  const response = await fetch(`${apiBaseUrl}/auth/session`, {
    headers: {
      cookie: req.headers.cookie || '',
      authorization: req.headers.authorization || '',
      origin: req.headers.origin || '',
    },
  });
  const body = await response.json();
  if (!response.ok || !body?.authenticated || !body?.user?.id) {
    throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
  }
  return body;
}


export async function reserveAiUsage({ apiBaseUrl, apiKey, payload, req }) {
  const session = await resolveBackendSession({ req, apiBaseUrl });
  const reservePayload = { ...payload, user_id: session.user.id };
  const response = await fetch(`${apiBaseUrl}/v1/internal/runtime/actions/reserve`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(reservePayload),
  });
  const body = await response.json();
  if (!response.ok || !body?.ok) {
    throw Object.assign(new Error(body?.reason || 'Usage reserve denied'), { statusCode: 403 });
  }
  return { session, body };
}
```

- [ ] **Step 5: Make the AI runtime stop trusting client identity headers**

In `founderAiRuntime.js`, remove header/body-derived identities from spend protection and keep only a soft anonymous fallback:

```js
function resolveIdentity(req) {
  const forwardedFor = cleanText(req?.headers?.['x-forwarded-for']);
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return cleanText(req?.socket?.remoteAddress) || 'anonymous';
}
```

Then in each AI route, reserve and finalize through the backend guard instead of relying on in-memory trust:

```js
const reserve = await reserveAiUsage({
  apiBaseUrl: process.env.FOUNDER_API_URL,
  apiKey: process.env.FS_API_KEY_INTERNAL,
  req,
  payload: {
    product_slug: 'founder-update-generator',
    action: 'generate',
    reference_id,
    provider: 'bedrock',
    model_id: modelId,
    estimated_input_chars: inputChars,
    estimated_output_tokens: maxTokens,
  },
});
```

- [ ] **Step 6: Re-run backend and JS tests**

Run:

```powershell
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py -q
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_cost_guard.py -q
node E:\Work\Founder-Systems-main-merge\api\_lib\founderAiRuntime.test.js
```

Expected: PASS

- [ ] **Step 7: Commit**

```powershell
git add E:\Work\Founder-Systems-main-merge\founder_systems_api\app\schemas.py E:\Work\Founder-Systems-main-merge\founder_systems_api\app\main.py E:\Work\Founder-Systems-main-merge\founder_systems_api\app\services.py E:\Work\Founder-Systems-main-merge\api\_lib\founderBackendGuard.js E:\Work\Founder-Systems-main-merge\api\_lib\founderAiRuntime.js E:\Work\Founder-Systems-main-merge\api\founder-update-generate.js E:\Work\Founder-Systems-main-merge\api\founder-pdf-summarize.js E:\Work\Founder-Systems-main-merge\api\founder-safe-explainer.js E:\Work\Founder-Systems-main-merge\api\founder-outreach-generate.js E:\Work\Founder-Systems-main-merge\api\linkedin-candidate-screener.js E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_cost_guard.py E:\Work\Founder-Systems-main-merge\api\_lib\founderAiRuntime.test.js
git commit -m "fix: enforce server-side usage billing and ai guard rails"
```

---

### Task 4: Add abuse throttles and reduce public attack surface

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\models.py`
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\services.py`
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\app\main.py`
- Modify: `E:\Work\Founder-Systems-main-merge\vercel.json`
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\deploy\nginx\founder-systems-api.conf.example`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py`

- [ ] **Step 1: Write failing tests for magic-link throttling and docs gating**

```python
def test_magic_link_start_throttles_repeat_requests(monkeypatch, tmp_path):
    main = _bootstrap_app(monkeypatch, tmp_path)

    async def scenario(client):
        payload = {"email": "repeat@example.com"}
        first = await client.post("/auth/magic-link/start", json=payload)
        second = await client.post("/auth/magic-link/start", json=payload)
        assert first.status_code == 200
        assert second.status_code == 429


def test_production_disables_openapi_docs(monkeypatch, tmp_path):
    monkeypatch.setenv("FS_ENV", "production")
    monkeypatch.setenv("FS_SESSION_SECRET", "real-secret")
    monkeypatch.setenv("FS_SESSION_COOKIE_SECURE", "true")
    monkeypatch.setenv("FS_ALLOW_MOCK_PAYMENTS", "false")
    monkeypatch.setenv("FS_INTEGRATION_TOKEN_SECRET", "integration-secret")
    monkeypatch.setenv("FS_API_KEY_INTERNAL", "internal-secret")
    main = _bootstrap_app(monkeypatch, tmp_path)
    assert main.app.docs_url is None
    assert main.app.openapi_url is None
```

- [ ] **Step 2: Run the throttling/docs tests**

Run:

```powershell
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py -k "magic_link_start_throttles_repeat_requests or production_disables_openapi_docs" -q
```

Expected: FAIL

- [ ] **Step 3: Implement durable magic-link throttling**

Add a simple model:

```python
class RequestThrottle(Base):
    __tablename__ = "request_throttles"
    key = Column(String, primary_key=True)
    count = Column(Integer, nullable=False, default=0)
    window_started_at = Column(DateTime(timezone=True), nullable=False)
```

Add a helper in `services.py`:

```python
def enforce_request_window(db: Session, *, key: str, limit: int, window_seconds: int) -> None:
    now = utc_now()
    row = db.get(RequestThrottle, key)
    if row is None or (now - _coerce_utc(row.window_started_at)).total_seconds() >= window_seconds:
        row = RequestThrottle(key=key, count=1, window_started_at=now)
        db.merge(row)
        db.commit()
        return
    if row.count >= limit:
        raise ValueError("Too many requests, please try again later")
    row.count += 1
    db.commit()
```

Use it in `auth_magic_link_start`:

```python
try:
    enforce_request_window(
        db,
        key=f"magic-link:{payload.email.strip().lower()}",
        limit=3,
        window_seconds=900,
    )
except ValueError as error:
    raise HTTPException(status_code=429, detail=str(error)) from error
```

- [ ] **Step 4: Disable public docs in production and add security headers**

Instantiate FastAPI with gated docs:

```python
docs_url = None if settings.env == "production" else "/docs"
openapi_url = None if settings.env == "production" else "/openapi.json"
app = FastAPI(title=settings.app_name, docs_url=docs_url, openapi_url=openapi_url)
```

Add API security headers middleware:

```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response
```

Add matching frontend headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://api.foundersystems.in; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
      ]
    }
  ]
}
```

- [ ] **Step 5: Tighten the nginx example**

Add:

```nginx
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'none'; frame-ancestors 'none'" always;
proxy_hide_header X-Powered-By;
```

- [ ] **Step 6: Re-run tests and basic curl verification**

Run:

```powershell
python -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py -q
npm.cmd run build
curl.exe -I https://foundersystems.in/
curl.exe -I https://api.foundersystems.in/health
```

Expected:
- test suite passes
- build passes
- responses include the new security headers

- [ ] **Step 7: Commit**

```powershell
git add E:\Work\Founder-Systems-main-merge\founder_systems_api\app\models.py E:\Work\Founder-Systems-main-merge\founder_systems_api\app\services.py E:\Work\Founder-Systems-main-merge\founder_systems_api\app\main.py E:\Work\Founder-Systems-main-merge\vercel.json E:\Work\Founder-Systems-main-merge\founder_systems_api\deploy\nginx\founder-systems-api.conf.example E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_security_hardening.py
git commit -m "fix: throttle auth abuse and harden public surface"
```

---

### Task 5: Upgrade vulnerable backend dependencies and run full verification

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\requirements.txt`
- Modify: `E:\Work\Founder-Systems-main-merge\founder_systems_api\DEPLOYMENT.md`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_main.py`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_integrations.py`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_cost_guard.py`
- Test: `E:\Work\Founder-Systems-main-merge\founder_systems_api\tests\test_workspace_memory_and_credits.py`

- [ ] **Step 1: Update vulnerable Python dependencies**

Replace the vulnerable versions in `requirements.txt`:

```txt
fastapi==0.116.2
uvicorn[standard]==0.38.0
sqlalchemy==2.0.44
psycopg[binary]==3.2.13
python-dotenv==1.2.2
pydantic==2.11.7
pydantic-settings==2.11.0
httpx==0.28.1
itsdangerous==2.2.0
pyjwt==2.12.0
email-validator==2.2.0
pytest==9.0.3
cryptography==46.0.6
```

- [ ] **Step 2: Update deployment docs for the new required secrets and disabled docs**

Add to `DEPLOYMENT.md`:

```md
- `FS_INTEGRATION_TOKEN_SECRET` is mandatory in production and must be different from `FS_SESSION_SECRET`.
- `FS_ALLOW_MOCK_PAYMENTS=false` is enforced in production.
- API docs and OpenAPI are disabled in production by default.
- After deploy, verify `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and CSP headers on both the site and the API.
```

- [ ] **Step 3: Rebuild a clean backend venv and run the full Python test suite**

Run:

```powershell
python -m venv E:\Work\Founder-Systems-main-merge\.venv-security
E:\Work\Founder-Systems-main-merge\.venv-security\Scripts\python.exe -m pip install --upgrade pip
E:\Work\Founder-Systems-main-merge\.venv-security\Scripts\python.exe -m pip install -r E:\Work\Founder-Systems-main-merge\founder_systems_api\requirements.txt
E:\Work\Founder-Systems-main-merge\.venv-security\Scripts\python.exe -m pytest E:\Work\Founder-Systems-main-merge\founder_systems_api\tests -q
```

Expected: PASS

- [ ] **Step 4: Re-run audit tooling**

Run:

```powershell
npm.cmd audit --omit=dev
E:\Work\Founder-Systems-main-merge\.venv-security\Scripts\python.exe -m pip install pip-audit
E:\Work\Founder-Systems-main-merge\.venv-security\Scripts\python.exe -m pip_audit
```

Expected:
- npm audit: 0 prod vulnerabilities
- pip-audit: 0 known vulnerabilities in runtime dependencies

- [ ] **Step 5: Run end-to-end smoke verification**

Run:

```powershell
npm.cmd run build
curl.exe -I https://foundersystems.in/
curl.exe -I https://api.foundersystems.in/health
curl.exe -I https://api.foundersystems.in/docs
curl.exe -s -D - -o NUL -X OPTIONS "https://api.foundersystems.in/workspace/memory" -H "Origin: https://foundersystems.in" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"
```

Expected:
- build passes
- site and API emit hardening headers
- `/docs` is not available in production
- allowed site origin still receives correct CORS response

- [ ] **Step 6: Commit**

```powershell
git add E:\Work\Founder-Systems-main-merge\founder_systems_api\requirements.txt E:\Work\Founder-Systems-main-merge\founder_systems_api\DEPLOYMENT.md
git commit -m "chore: upgrade vulnerable backend dependencies"
```

---

## Self-review

### Spec coverage

- Production config fail-open risk: covered in Task 1.
- Redirect weakness and secret separation: covered in Task 2.
- Client-controlled credit spending and AI abuse controls: covered in Task 3.
- Magic-link abuse, public docs/schema exposure, and missing headers: covered in Task 4.
- Dependency vulnerabilities and full regression verification: covered in Task 5.

No audit finding is left without a task.

### Placeholder scan

- No `TODO`, `TBD`, or “handle appropriately” placeholders remain.
- Each task includes exact file paths, commands, and code snippets.

### Type consistency

- `ProductUsageSpendRequest` is consistently reduced to `action` + `metadata`.
- `resolve_usage_credit_cost()` is the single server-side pricing helper used by the route.
- `reserveAiUsage()` in the Vercel helper is aligned with the existing internal reserve endpoint contract.

