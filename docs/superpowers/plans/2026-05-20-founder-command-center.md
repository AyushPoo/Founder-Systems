# Founder Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `Founder Command Center`, a founder-only connected dashboard that reads persistent workspace memory, accepts new uploads, synthesizes a company snapshot plus deeper operating sections, and links back into the relevant Founder Systems tools.

**Architecture:** Reuse the existing workspace-memory and account context foundations instead of inventing a new storage system. Add one upload-to-memory ingestion API, one shared command-center synthesis utility, and one compact page/workspace UI that reads normalized company-memory signals, shows provenance and freshness, and supports selective correction actions.

**Tech Stack:** React 19, React Router, existing Founder Workspace context, Vite serverless API handlers, existing mixed-file upload patterns, Node test scripts.

---

## File Structure

### New files

- `src/utils/founderCommandCenterMemory.js`
  - Normalize command-center memory records, derive sections, freshness, and provenance summaries from workspace memory plus ingestion results.
- `src/utils/founderCommandCenterMemory.test.js`
  - Unit tests for snapshot synthesis, stale/confidence detection, and editable record extraction.
- `src/utils/founderCommandCenterIngest.js`
  - Build upload requests, normalize ingestion payloads, and map ingestion results into workspace-memory candidates.
- `src/utils/founderCommandCenterIngest.test.js`
  - Unit tests for request normalization, result validation, and candidate mapping.
- `api/founder-command-center-ingest.js`
  - Mixed-file upload endpoint that classifies company materials and returns normalized company-memory candidates plus a lightweight preview snapshot.
- `api/founder-command-center-ingest.test.js`
  - API tests for validation, response shape, and fallback behavior.
- `src/components/founder-command-center/FounderCommandCenterWorkspace.jsx`
  - Main command-center UI with top snapshot, deeper sections, upload panel, provenance labels, and correction controls.
- `src/pages/FounderCommandCenter.jsx`
  - Product page wrapper with SEO and the command-center workspace.
- `public/products/founder-command-center.json`
  - Catalog/product-detail content for the new product.

### Modified files

- `src/utils/workspaceMemory.js`
  - Add builders for command-center memory candidates and helper readers for richer normalized memory types.
- `src/context/FounderWorkspaceContext.jsx`
  - Expose lightweight helpers for command-center flows such as saving multiple memory candidates and refreshing after ingestion.
- `src/utils/founderApi.js`
  - Add API helper for `/api/founder-command-center-ingest`.
- `src/App.jsx`
  - Register `/tools/founder-command-center`.
- `public/products/index.json`
  - Add the new live product entry.
- `src/pages/Products.jsx`
  - Remove the placeholder `Founder Dashboard` coming-soon card once the real product exists.
- `package.json`
  - Add `test:founder-command-center`.

### Existing files to reference while implementing

- `src/context/FounderWorkspaceContext.jsx`
- `src/utils/workspaceMemory.js`
- `src/components/workspace/WorkspaceImportPrompt.jsx`
- `src/components/workspace/WorkspaceOutcomePanel.jsx`
- `src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx`
- `src/components/founder-update/FounderUpdateWorkspace.jsx`
- `api/founder-pdf-summarize.js`
- `api/founder-update-generate.js`

---

### Task 1: Add Command Center Memory Synthesis Utilities

**Files:**
- Create: `src/utils/founderCommandCenterMemory.js`
- Create: `src/utils/founderCommandCenterMemory.test.js`

- [ ] **Step 1: Write the failing memory synthesis tests**

```js
import assert from 'node:assert/strict';
import {
  buildFounderCommandCenterSnapshot,
  buildFounderCommandCenterSections,
  summarizeMemoryFreshness,
  extractEditableMemoryItems,
} from './founderCommandCenterMemory.js';

const memoryItems = [
  {
    id: 'm1',
    type: 'metric',
    label: 'MRR',
    summary_text: 'MRR is $42k',
    value_json: { value: '42000', unit: 'usd', category: 'finance' },
    source_product: 'founder-update-generator',
    confidence: 'confirmed',
    created_at: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'm2',
    type: 'priority',
    label: 'Stabilize onboarding conversion',
    summary_text: 'Onboarding drop-off remains the top GTM priority.',
    value_json: { area: 'gtm', text: 'Stabilize onboarding conversion' },
    source_product: 'founder-spec-generator',
    confidence: 'confirmed',
    created_at: '2026-05-19T08:00:00.000Z',
  },
  {
    id: 'm3',
    type: 'risk',
    label: 'Runway pressure',
    summary_text: 'Runway may fall below six months without a burn reduction.',
    value_json: { area: 'finance', text: 'Runway below six months' },
    source_product: 'founder-pdf-summarizer',
    confidence: 'inferred',
    created_at: '2026-05-10T08:00:00.000Z',
  },
];

const snapshot = buildFounderCommandCenterSnapshot({ memoryItems, now: '2026-05-20T12:00:00.000Z' });
assert.equal(snapshot.companySummary.length > 0, true);
assert.equal(snapshot.topMetrics.length, 1);
assert.equal(snapshot.needsAttention.length, 1);
assert.equal(snapshot.whatChanged.length >= 1, true);

const sections = buildFounderCommandCenterSections({ memoryItems, now: '2026-05-20T12:00:00.000Z' });
assert.equal(sections.finance.items.length >= 1, true);
assert.equal(sections.strategy.items.length >= 1, true);

const freshness = summarizeMemoryFreshness(memoryItems, '2026-05-20T12:00:00.000Z');
assert.equal(freshness.hasStaleSignals, true);
assert.equal(freshness.totalSignals, 3);

const editable = extractEditableMemoryItems(memoryItems);
assert.deepEqual(
  editable.map((item) => item.type),
  ['metric', 'priority', 'risk'],
);

console.log('founderCommandCenterMemory tests passed');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node src/utils/founderCommandCenterMemory.test.js`

Expected: FAIL with `Cannot find module './founderCommandCenterMemory.js'` or missing export errors.

- [ ] **Step 3: Write the minimal memory synthesis implementation**

```js
function toList(value) {
  return Array.isArray(value) ? value : [];
}

function readText(item = {}) {
  return String(
    item?.summary_text
      || item?.value_json?.text
      || item?.value_json?.value
      || item?.label
      || '',
  ).trim();
}

function ageInDays(isoValue, nowValue) {
  const created = new Date(isoValue || 0).getTime();
  const now = new Date(nowValue || Date.now()).getTime();
  if (!created || Number.isNaN(created) || Number.isNaN(now)) {
    return 0;
  }
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

export function summarizeMemoryFreshness(memoryItems = [], now = Date.now()) {
  const list = toList(memoryItems);
  const ages = list.map((item) => ageInDays(item?.created_at, now));
  return {
    totalSignals: list.length,
    newestDays: ages.length ? Math.min(...ages) : null,
    oldestDays: ages.length ? Math.max(...ages) : null,
    hasStaleSignals: ages.some((value) => value >= 7),
  };
}

export function buildFounderCommandCenterSnapshot({ memoryItems = [], now = Date.now() } = {}) {
  const list = toList(memoryItems);
  const metrics = list.filter((item) => item?.type === 'metric');
  const risks = list.filter((item) => item?.type === 'risk');
  const recent = [...list].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));

  return {
    companySummary: recent.slice(0, 3).map(readText).filter(Boolean).join(' '),
    topMetrics: metrics.slice(0, 3).map((item) => ({ id: item.id, label: item.label, text: readText(item), source: item.source_product })),
    whatChanged: recent.slice(0, 4).map((item) => ({ id: item.id, label: item.label, text: readText(item), source: item.source_product })),
    needsAttention: risks.slice(0, 4).map((item) => ({ id: item.id, label: item.label, text: readText(item), source: item.source_product })),
    freshness: summarizeMemoryFreshness(list, now),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node src/utils/founderCommandCenterMemory.test.js`

Expected: PASS with `founderCommandCenterMemory tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/utils/founderCommandCenterMemory.js src/utils/founderCommandCenterMemory.test.js
git commit -m "feat: add founder command center memory synthesis"
```

### Task 2: Add Upload Ingestion Utilities And API

**Files:**
- Create: `src/utils/founderCommandCenterIngest.js`
- Create: `src/utils/founderCommandCenterIngest.test.js`
- Create: `api/founder-command-center-ingest.js`
- Create: `api/founder-command-center-ingest.test.js`

- [ ] **Step 1: Write the failing ingestion utility tests**

```js
import assert from 'node:assert/strict';
import {
  normalizeFounderCommandCenterIngestRequest,
  normalizeFounderCommandCenterIngestResponse,
  mapIngestResultToMemoryCandidates,
} from './founderCommandCenterIngest.js';

const request = normalizeFounderCommandCenterIngestRequest({
  files: [{ name: 'board-update.pdf', size: 1024, type: 'application/pdf' }],
  notes: 'Board deck and current runway sheet.',
});

assert.equal(request.files.length, 1);
assert.equal(request.notes, 'Board deck and current runway sheet.');

const normalized = normalizeFounderCommandCenterIngestResponse({
  companySummary: 'Revenue is up but runway pressure remains.',
  findings: [{ type: 'risk', label: 'Runway pressure', text: 'Cash runway is under six months.' }],
  memoryCandidates: [],
});

assert.equal(normalized.companySummary.length > 0, true);

const candidates = mapIngestResultToMemoryCandidates({
  findings: [
    { type: 'metric', label: 'MRR', text: '$42k MRR', area: 'finance' },
    { type: 'risk', label: 'Runway pressure', text: 'Runway under six months', area: 'finance' },
  ],
  sourceProduct: 'founder-command-center',
});

assert.equal(candidates.length, 2);
assert.equal(candidates[0].source_product, 'founder-command-center');

console.log('founderCommandCenterIngest tests passed');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node src/utils/founderCommandCenterIngest.test.js`

Expected: FAIL with missing module or export errors.

- [ ] **Step 3: Implement the client-side ingestion helpers**

```js
function cleanText(value) {
  return String(value || '').trim();
}

export function normalizeFounderCommandCenterIngestRequest(input = {}) {
  return {
    files: Array.isArray(input.files) ? input.files.filter(Boolean) : [],
    notes: cleanText(input.notes),
  };
}

export function normalizeFounderCommandCenterIngestResponse(payload = {}) {
  return {
    companySummary: cleanText(payload.companySummary),
    findings: Array.isArray(payload.findings) ? payload.findings : [],
    memoryCandidates: Array.isArray(payload.memoryCandidates) ? payload.memoryCandidates : [],
    error: cleanText(payload.error),
  };
}

export function mapIngestResultToMemoryCandidates({ findings = [], sourceProduct = 'founder-command-center' } = {}) {
  return findings
    .filter((item) => cleanText(item?.type) && cleanText(item?.label) && cleanText(item?.text))
    .map((item) => ({
      memory_scope: 'canonical',
      type: item.type,
      label: item.label,
      summary_text: item.text,
      value_json: { text: item.text, area: item.area || 'general' },
      source_product: sourceProduct,
      confidence: item.confidence || 'inferred',
      visibility: 'workspace_shared',
    }));
}
```

- [ ] **Step 4: Write the failing API test**

```js
import assert from 'node:assert/strict';
import handler from './founder-command-center-ingest.js';

async function run() {
  const req = {
    method: 'POST',
    body: {
      files: [{ name: 'runway.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 2048 }],
      notes: 'Latest finance snapshot and board summary.',
    },
  };

  let statusCode = 200;
  let jsonPayload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonPayload = payload;
      return this;
    },
    setHeader() {},
  };

  await handler(req, res);

  assert.equal(statusCode, 200);
  assert.equal(Array.isArray(jsonPayload.findings), true);
  assert.equal(Array.isArray(jsonPayload.memoryCandidates), true);
  assert.equal(typeof jsonPayload.companySummary, 'string');
}

run().then(() => console.log('founder-command-center-ingest API tests passed'));
```

- [ ] **Step 5: Run the API test to verify it fails**

Run: `node api/founder-command-center-ingest.test.js`

Expected: FAIL because the handler file does not exist yet.

- [ ] **Step 6: Implement the minimal ingestion API**

```js
function cleanText(value) {
  return String(value || '').trim();
}

function buildFallbackFindings(files = [], notes = '') {
  const names = files.map((file) => file?.name).filter(Boolean);
  return [
    {
      type: 'document',
      label: 'Uploaded materials',
      text: names.length ? `Uploaded ${names.join(', ')}` : 'Uploaded founder materials',
      area: 'documents',
      confidence: 'confirmed',
    },
    notes
      ? {
          type: 'priority',
          label: 'Founder note',
          text: notes,
          area: 'strategy',
          confidence: 'confirmed',
        }
      : null,
  ].filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  const notes = cleanText(req.body?.notes);
  if (!files.length && !notes) {
    return res.status(400).json({ error: 'Add at least one file or note.' });
  }

  const findings = buildFallbackFindings(files, notes);
  const memoryCandidates = findings.map((item) => ({
    memory_scope: 'canonical',
    type: item.type,
    label: item.label,
    summary_text: item.text,
    value_json: { text: item.text, area: item.area || 'general' },
    source_product: 'founder-command-center',
    confidence: item.confidence || 'inferred',
    visibility: 'workspace_shared',
  }));

  return res.status(200).json({
    companySummary: findings.map((item) => item.text).join(' '),
    findings,
    memoryCandidates,
  });
}
```

- [ ] **Step 7: Run both ingestion test files to verify they pass**

Run: `node src/utils/founderCommandCenterIngest.test.js && node api/founder-command-center-ingest.test.js`

Expected: PASS with both ingestion suites green.

- [ ] **Step 8: Commit**

```bash
git add src/utils/founderCommandCenterIngest.js src/utils/founderCommandCenterIngest.test.js api/founder-command-center-ingest.js api/founder-command-center-ingest.test.js
git commit -m "feat: add founder command center ingestion"
```

### Task 3: Extend Workspace Memory Helpers And Context

**Files:**
- Modify: `src/utils/workspaceMemory.js`
- Modify: `src/context/FounderWorkspaceContext.jsx`
- Modify: `src/utils/founderApi.js`

- [ ] **Step 1: Write a failing test for command-center candidate persistence**

```js
import assert from 'node:assert/strict';
import { buildFounderCommandCenterMemoryCandidates } from './workspaceMemory.js';

const candidates = buildFounderCommandCenterMemoryCandidates({
  companySummary: 'Revenue is climbing, but runway pressure remains.',
  findings: [
    { type: 'metric', label: 'MRR', text: '$42k MRR', area: 'finance' },
    { type: 'risk', label: 'Runway pressure', text: 'Cash runway under six months', area: 'finance' },
  ],
});

assert.equal(candidates.length, 3);
assert.equal(candidates[0].source_product, 'founder-command-center');
assert.equal(candidates.some((item) => item.type === 'risk'), true);

console.log('workspace memory command-center tests passed');
```

- [ ] **Step 2: Run the test to verify it fails before helper changes**

Run: `node src/utils/workspaceMemory.test.js`

Expected: FAIL with missing export errors or missing candidate assertions.

- [ ] **Step 3: Add the command-center memory helper in `workspaceMemory.js`**

```js
export function buildFounderCommandCenterMemoryCandidates({ companySummary = '', findings = [] } = {}) {
  const summaryCandidate = createCandidate({
    memory_scope: 'canonical',
    type: 'venture_summary',
    label: 'Company snapshot',
    text: companySummary,
    summary: companySummary,
    source_product: 'founder-command-center',
  });

  const findingCandidates = (Array.isArray(findings) ? findings : []).map((item) =>
    createCandidate({
      memory_scope: 'canonical',
      type: item.type,
      label: item.label,
      text: item.text,
      summary: item.text,
      source_product: 'founder-command-center',
      confidence: item.confidence || 'inferred',
    }),
  );

  return compactCandidates([summaryCandidate, ...findingCandidates]);
}
```

- [ ] **Step 4: Add a context helper for saving multiple memory candidates**

```js
const saveMemoryBatch = useCallback(async (candidates = []) => {
  const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
  for (const candidate of list) {
    await createWorkspaceMemory(candidate);
  }
  await refreshAccount();
  return list.length;
}, [refreshAccount]);
```

- [ ] **Step 5: Add the client API helper for command-center ingestion**

```js
export async function ingestFounderCommandCenter(payload) {
  const response = await fetch('/api/founder-command-center-ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || 'Founder command center ingestion failed.');
  }
  return json;
}
```

- [ ] **Step 6: Re-run the workspace memory tests**

Run: `node src/utils/workspaceMemory.test.js`

Expected: PASS with the new command-center candidate coverage included.

- [ ] **Step 7: Commit**

```bash
git add src/utils/workspaceMemory.js src/context/FounderWorkspaceContext.jsx src/utils/founderApi.js
git commit -m "feat: connect founder command center to workspace memory"
```

### Task 4: Build The Founder Command Center UI

**Files:**
- Create: `src/components/founder-command-center/FounderCommandCenterWorkspace.jsx`
- Create: `src/pages/FounderCommandCenter.jsx`

- [ ] **Step 1: Write a failing catalog/route-facing smoke test**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pageSource = fs.readFileSync(new URL('../founder-command-center/FounderCommandCenterWorkspace.jsx', import.meta.url), 'utf8');
assert.equal(pageSource.includes('Founder Command Center'), true);
assert.equal(pageSource.includes('What changed'), true);
assert.equal(pageSource.includes('Needs attention'), true);

console.log('founder command center component smoke test passed');
```

- [ ] **Step 2: Run the smoke test to verify it fails**

Run: `node src/components/founder-command-center/catalog.test.js`

Expected: FAIL because the component file does not exist yet.

- [ ] **Step 3: Implement the compact workspace component**

```jsx
const FounderCommandCenterWorkspace = () => {
  const {
    authenticated,
    loadingAccount,
    memoryItems,
    saveMemoryBatch,
  } = useFounderWorkspace();
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const snapshot = useMemo(
    () => buildFounderCommandCenterSnapshot({ memoryItems }),
    [memoryItems],
  );
  const sections = useMemo(
    () => buildFounderCommandCenterSections({ memoryItems }),
    [memoryItems],
  );

  async function handleIngest() {
    const payload = normalizeFounderCommandCenterIngestRequest({ files, notes });
    const response = normalizeFounderCommandCenterIngestResponse(await ingestFounderCommandCenter(payload));
    setResult(response);
    if (authenticated && response.memoryCandidates.length) {
      await saveMemoryBatch(response.memoryCandidates);
    }
  }

  return (
    <div>
      <section>
        <h1>Founder Command Center</h1>
        <p>{snapshot.companySummary || 'Build your connected company snapshot from uploads and tool activity.'}</p>
      </section>
      <section>
        <h2>What changed</h2>
        {snapshot.whatChanged.map((item) => <p key={item.id}>{item.text}</p>)}
      </section>
      <section>
        <h2>Needs attention</h2>
        {snapshot.needsAttention.map((item) => <p key={item.id}>{item.text}</p>)}
      </section>
    </div>
  );
};
```

- [ ] **Step 4: Add the page wrapper**

```jsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import FounderCommandCenterWorkspace from '../components/founder-command-center/FounderCommandCenterWorkspace';

function FounderCommandCenter() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col">
      <SEO
        title="Founder Command Center"
        description="See what is happening across your company, what changed, and what needs attention next."
        canonical="/tools/founder-command-center"
      />
      <Navbar />
      <main className="flex-grow">
        <FounderCommandCenterWorkspace />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 5: Run the smoke test**

Run: `node src/components/founder-command-center/catalog.test.js`

Expected: PASS with the new component smoke test message.

- [ ] **Step 6: Commit**

```bash
git add src/components/founder-command-center/FounderCommandCenterWorkspace.jsx src/pages/FounderCommandCenter.jsx
git commit -m "feat: add founder command center workspace"
```

### Task 5: Wire The Product Into The App And Catalog

**Files:**
- Modify: `src/App.jsx`
- Modify: `public/products/index.json`
- Create: `public/products/founder-command-center.json`
- Modify: `src/pages/Products.jsx`
- Modify: `package.json`

- [ ] **Step 1: Add the route in `src/App.jsx`**

```jsx
import FounderCommandCenter from './pages/FounderCommandCenter';

<Route path="/tools/founder-command-center" element={<FounderCommandCenter />} />
```

- [ ] **Step 2: Add the product metadata**

```json
{
  "id": "founder-command-center",
  "name": "Founder Command Center",
  "description": "One place to see what is happening across your company, what changed, and what needs attention next.",
  "category": "Strategy",
  "productId": "FS016",
  "thumbnail": "/images/strategy.png"
}
```

- [ ] **Step 3: Remove the old placeholder from `Products.jsx`**

```js
const COMING_SOON_PRODUCTS = [
  { id: 'cs-1', name: 'Investor CRM', description: 'Manage fundraising pipelines and investor updates efficiently.' },
  { id: 'cs-3', name: 'Startup Budget Planner', description: 'Allocate resources and track operational spend against milestones.' },
  { id: 'cs-4', name: 'LinkedIn Summarizer', description: 'Automated extraction of key insights from professional profiles.' }
];
```

- [ ] **Step 4: Add the test script**

```json
"test:founder-command-center": "node src/utils/founderCommandCenterMemory.test.js && node src/utils/founderCommandCenterIngest.test.js && node api/founder-command-center-ingest.test.js && node src/components/founder-command-center/catalog.test.js"
```

- [ ] **Step 5: Run the focused test script**

Run: `npm.cmd run test:founder-command-center`

Expected: PASS with all command-center tests green.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx public/products/index.json public/products/founder-command-center.json src/pages/Products.jsx package.json
git commit -m "feat: wire founder command center into the catalog"
```

### Task 6: Add Memory Correction Controls And Final Verification

**Files:**
- Modify: `src/components/founder-command-center/FounderCommandCenterWorkspace.jsx`
- Modify: `src/context/FounderWorkspaceContext.jsx` only if UI needs an additional helper to update existing memory items inline

- [ ] **Step 1: Add the correction actions to the workspace UI**

```jsx
async function handleConfirm(item) {
  await saveMemoryItem(item.id, { confidence: 'confirmed' });
}

async function handleDismiss(item) {
  await saveMemoryItem(item.id, { status: 'archived' });
}

async function handleMarkStale(item) {
  await saveMemoryItem(item.id, {
    value_json: { ...(item.value_json || {}), stale: true },
    summary_text: item.summary_text,
  });
}
```

- [ ] **Step 2: Show provenance and freshness labels on each key card**

```jsx
<p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
  {item.source ? `Source: ${item.source}` : 'Source: workspace memory'}
</p>
<p className="text-xs font-semibold text-brand-black/55">
  {item.confidence || 'inferred'} · {item.ageLabel || 'recent'}
</p>
```

- [ ] **Step 3: Run the focused test script again**

Run: `npm.cmd run test:founder-command-center`

Expected: PASS with no regressions.

- [ ] **Step 4: Run cross-product verification**

Run:

```bash
npm.cmd run test:founder-command-center
npm.cmd run test:document-intelligence
npm.cmd run test:founder-update
npm.cmd run test:founder-copilot
npm.cmd run test:linkedin-candidate-screener
npm.cmd run test:api-dev
npm.cmd run build
```

Expected:

- all command-center tests pass
- all previously merged product tests still pass
- build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/founder-command-center/FounderCommandCenterWorkspace.jsx src/context/FounderWorkspaceContext.jsx
git commit -m "feat: finish founder command center controls"
```

---

## Self-Review

### Spec coverage

- Persistent company memory: covered by Tasks 1 and 3.
- Upload-driven ingestion: covered by Task 2.
- Connected command-center UI: covered by Tasks 4 and 6.
- Product/catalog integration: covered by Task 5.
- Selective correction controls: covered by Task 6.
- Cross-product non-regression: covered by Task 6 verification.

### Placeholder scan

- No `TODO`, `TBD`, or vague “handle appropriately” plan steps remain.
- Each code-touching step includes concrete code or command examples.

### Type consistency

- Shared names stay consistent across tasks:
  - `buildFounderCommandCenterSnapshot`
  - `buildFounderCommandCenterSections`
  - `normalizeFounderCommandCenterIngestRequest`
  - `normalizeFounderCommandCenterIngestResponse`
  - `buildFounderCommandCenterMemoryCandidates`
  - `ingestFounderCommandCenter`

---

Plan complete and saved to `docs/superpowers/plans/2026-05-20-founder-command-center.md`.

Two execution options:

1. `Subagent-Driven (recommended)`
I dispatch a fresh subagent per task, review between tasks, and keep iteration tight.

2. `Inline Execution`
I execute the tasks in this session in batches with checkpoints.

Which approach?
