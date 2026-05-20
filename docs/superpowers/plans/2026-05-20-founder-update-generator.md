# Founder Update Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `Founder Update Generator`, a compact mixed-input workspace that turns messy founder materials into one polished founder update with wins, challenges, metrics, next focus, and caveats.

**Architecture:** Add one new product surface with a dedicated page, product metadata, and compact workspace UI. Reuse the mixed-file upload/report discipline from document-intelligence patterns, but keep the output single-update-focused through a new normalization/export utility and one API endpoint that classifies inputs, extracts evidence, and synthesizes the final update.

**Tech Stack:** React 19, Vite, existing Founder Systems product/page patterns, Node-based API handlers, OpenAI Responses API, lightweight Node assertion tests.

---

## File Map

### Create

- `src/pages/FounderUpdateGenerator.jsx`
  - Product page wrapper for the new tool.
- `src/components/founder-update/FounderUpdateWorkspace.jsx`
  - Main mixed-file workspace UI.
- `src/utils/founderUpdateGenerator.js`
  - Request normalization, validation, response normalization, and Markdown export.
- `src/utils/founderUpdateGenerator.test.js`
  - Behavior tests for the new utility layer.
- `api/founder-update-generate.js`
  - Mixed-input analysis and founder-update synthesis endpoint.
- `api/founder-update-generate.test.js`
  - Endpoint tests for validation, fallback behavior, and synthesized output.
- `public/products/founder-update-generator.json`
  - Product detail metadata for the new tool.

### Modify

- `src/App.jsx`
  - Register the new route.
- `public/products/index.json`
  - Add the catalog listing for the new product.
- `package.json`
  - Add a dedicated founder-update test script and include it in the combined workflow if appropriate.

### Reference During Implementation

- `src/components/founder-outreach/OutreachWorkspace.jsx`
- `src/utils/founderSpec.js`
- `api/founder-outreach-generate.js`

---

### Task 1: Add Founder Update Utility Layer

**Files:**
- Create: `src/utils/founderUpdateGenerator.js`
- Create: `src/utils/founderUpdateGenerator.test.js`

- [ ] **Step 1: Write the failing utility test**

```js
import assert from 'assert';
import { Buffer } from 'node:buffer';
import {
  MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES,
  buildFounderUpdateMarkdown,
  createFounderUpdateDraft,
  normalizeFounderUpdateRequest,
  normalizeFounderUpdateResponse,
  validateFounderUpdateRequest,
} from './founderUpdateGenerator.js';

function createPdfDataUrl(byteLength) {
  return `data:application/pdf;base64,${Buffer.alloc(byteLength).toString('base64')}`;
}

const draft = createFounderUpdateDraft();
assert.deepEqual(draft.files, []);
assert.equal(draft.contextNotes, '');

const normalized = normalizeFounderUpdateRequest({
  files: [
    {
      filename: 'weekly-notes.pdf',
      mimeType: 'application/pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
      fileSize: 1024,
    },
  ],
  contextNotes: 'Highlight the real blockers.',
});

assert.equal(normalized.files.length, 1);
assert.equal(normalized.files[0].id, 'file-1');
assert.equal(normalized.contextNotes, 'Highlight the real blockers.');

const invalid = validateFounderUpdateRequest({ files: [] });
assert.equal(invalid.isValid, false);
assert.match(invalid.error, /at least one/i);

const oversized = validateFounderUpdateRequest({
  files: [
    {
      filename: 'huge.pdf',
      mimeType: 'application/pdf',
      fileData: createPdfDataUrl(MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES + 1),
      fileSize: 1,
    },
  ],
});

assert.equal(oversized.isValid, false);
assert.match(oversized.error, /under/i);

const normalizedResponse = normalizeFounderUpdateResponse({
  title: 'Founder update',
  reportingPeriod: 'Week of May 20',
  topline: 'Revenue held up, but delivery slipped.',
  whatChanged: ['Closed two new pilots.', 'Moved one release by a week.'],
  wins: ['Signed a lighthouse customer.'],
  challenges: ['Implementation bandwidth is tight.'],
  metricsAndProof: ['MRR grew 6% week over week.'],
  nextFocus: ['Stabilize delivery before expanding the pipeline.'],
  asks: ['Need one product hiring referral.'],
  confidenceGaps: ['Retention evidence is still light.'],
  extractionNotes: ['One spreadsheet tab had sparse labels.'],
  sourceFiles: ['weekly-notes.pdf'],
});

assert.equal(normalizedResponse.ok, true);
assert.equal(normalizedResponse.wins.length, 1);

const markdown = buildFounderUpdateMarkdown({
  title: 'Founder update',
  update: normalizedResponse,
});

assert.match(markdown, /^# Founder Update: Founder update/m);
assert.match(markdown, /## Wins/m);
assert.match(markdown, /## Confidence Or Gaps/m);

console.log('founderUpdateGenerator tests passed');
```

- [ ] **Step 2: Run the utility test to verify it fails**

Run: `node src/utils/founderUpdateGenerator.test.js`
Expected: FAIL with `Cannot find module './founderUpdateGenerator.js'` or missing export errors.

- [ ] **Step 3: Write the minimal utility implementation**

```js
export const MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES = Math.round(3.25 * 1024 * 1024);

export function createFounderUpdateDraft() {
  return { files: [], contextNotes: '' };
}

export function normalizeFounderUpdateRequest(input = {}) {
  const files = Array.isArray(input.files) ? input.files : [];
  return {
    files: files.map((file, index) => ({
      id: `file-${index + 1}`,
      filename: String(file?.filename || '').trim(),
      mimeType: String(file?.mimeType || '').trim().toLowerCase(),
      fileData: String(file?.fileData || '').trim(),
      fileSize: Number(file?.fileSize || 0),
    })),
    contextNotes: String(input.contextNotes || '').trim(),
  };
}

export function validateFounderUpdateRequest(input = {}) {
  const normalized = normalizeFounderUpdateRequest(input);
  if (normalized.files.length === 0) {
    return { normalized, isValid: false, error: 'Upload at least one founder update file.' };
  }
  return { normalized, isValid: true, error: '' };
}
```

- [ ] **Step 4: Run the utility test to verify it passes**

Run: `node src/utils/founderUpdateGenerator.test.js`
Expected: PASS with `founderUpdateGenerator tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/utils/founderUpdateGenerator.js src/utils/founderUpdateGenerator.test.js
git commit -m "feat: add founder update generator utilities"
```

---

### Task 2: Add the Founder Update API Endpoint

**Files:**
- Create: `api/founder-update-generate.js`
- Create: `api/founder-update-generate.test.js`
- Modify: `src/utils/founderUpdateGenerator.js`

- [ ] **Step 1: Write the failing API test**

```js
import assert from 'assert';
import process from 'node:process';
import handler from './founder-update-generate.js';

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload) {
      this.body = String(payload ?? '');
    },
  };
}

function parseJsonBody(res) {
  return JSON.parse(res.body);
}

const req = {
  method: 'POST',
  body: {
    files: [
      {
        filename: 'weekly-notes.pdf',
        mimeType: 'application/pdf',
        fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
        fileSize: 2048,
      },
      {
        filename: 'metrics.csv',
        mimeType: 'text/csv',
        fileData: 'data:text/csv;base64,bXJyLDYl',
        fileSize: 8,
      },
    ],
    contextNotes: 'Keep this brutally honest.',
  },
};

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = 'test-key';

globalThis.fetch = async () => ({
  ok: true,
  status: 200,
  async json() {
    return {
      output_text: JSON.stringify({
        title: 'Founder update',
        reportingPeriod: 'Current period',
        topline: 'Growth is intact, but delivery pressure is building.',
        whatChanged: ['Closed a pilot.', 'Delayed one release.'],
        wins: ['Signed one lighthouse customer.'],
        challenges: ['Bandwidth remains tight.'],
        metricsAndProof: ['MRR grew 6% week over week.'],
        nextFocus: ['Stabilize delivery before adding more pipeline.'],
        asks: ['Need one product hiring referral.'],
        confidenceGaps: ['Retention proof is still incomplete.'],
        extractionNotes: ['One note set was sparse.'],
        sourceFiles: ['weekly-notes.pdf', 'metrics.csv'],
      }),
    };
  },
});

const res = createResponse();
await handler(req, res);

globalThis.fetch = originalFetch;
if (typeof originalApiKey === 'undefined') {
  delete process.env.OPENAI_API_KEY;
} else {
  process.env.OPENAI_API_KEY = originalApiKey;
}

assert.equal(res.statusCode, 200);
const payload = parseJsonBody(res);
assert.equal(payload.ok, true);
assert.equal(payload.wins.length, 1);
assert.equal(payload.sourceFiles.length, 2);

console.log('founder-update-generate API tests passed');
```

- [ ] **Step 2: Run the API test to verify it fails**

Run: `node api/founder-update-generate.test.js`
Expected: FAIL with `Cannot find module './founder-update-generate.js'` or missing endpoint behavior.

- [ ] **Step 3: Write the minimal endpoint and synthesis prompt**

```js
const SYSTEM_PROMPT = [
  'You are a founder reporting editor.',
  'Turn messy founder materials into one concise, honest founder update.',
  'Prioritize signal, not completeness.',
  'Always return valid JSON only.',
].join('\n');

async function generateFounderUpdate(input) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [
            ...input.files.map((file) => ({
              type: 'input_file',
              filename: file.filename,
              file_data: file.fileData,
            })),
            {
              type: 'input_text',
              text: buildFounderUpdatePrompt(input),
            },
          ],
        },
      ],
      text: { format: { type: 'json_object' } },
    }),
  });
}
```

- [ ] **Step 4: Run the API test to verify it passes**

Run: `node api/founder-update-generate.test.js`
Expected: PASS with `founder-update-generate API tests passed`.

- [ ] **Step 5: Commit**

```bash
git add api/founder-update-generate.js api/founder-update-generate.test.js src/utils/founderUpdateGenerator.js
git commit -m "feat: add founder update generator endpoint"
```

---

### Task 3: Build the Founder Update Workspace UI

**Files:**
- Create: `src/components/founder-update/FounderUpdateWorkspace.jsx`
- Create: `src/pages/FounderUpdateGenerator.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Write the failing UI-support expectation into the utility test**

```js
const markdown = buildFounderUpdateMarkdown({
  title: 'Weekly update',
  update: normalizedResponse,
});

assert.match(markdown, /## What Changed/m);
assert.match(markdown, /## Metrics And Proof/m);
assert.match(markdown, /## What Needs Attention Next/m);
```

- [ ] **Step 2: Run the founder-update tests to verify the new expectation fails if the renderer or imports are incomplete**

Run: `node src/utils/founderUpdateGenerator.test.js && node api/founder-update-generate.test.js`
Expected: FAIL until the full workspace-facing result shape is stable.

- [ ] **Step 3: Implement the compact mixed-file workspace**

```jsx
const [files, setFiles] = useState([]);
const [contextNotes, setContextNotes] = useState('');
const [result, setResult] = useState(null);

async function handleGenerate(event) {
  event.preventDefault();
  const filePayloads = await Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      fileData: await readFileAsDataUrl(file),
    }))
  );

  const response = await fetch('/api/founder-update-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: filePayloads,
      contextNotes,
    }),
  });
}
```

- [ ] **Step 4: Run the founder-update tests to verify they pass**

Run: `node src/utils/founderUpdateGenerator.test.js && node api/founder-update-generate.test.js`
Expected: PASS for both founder-update suites.

- [ ] **Step 5: Commit**

```bash
git add src/components/founder-update/FounderUpdateWorkspace.jsx src/pages/FounderUpdateGenerator.jsx src/App.jsx
git commit -m "feat: add founder update workspace"
```

---

### Task 4: Add Product Metadata and Catalog Wiring

**Files:**
- Create: `public/products/founder-update-generator.json`
- Modify: `public/products/index.json`

- [ ] **Step 1: Write the failing catalog expectation**

```js
import assert from 'assert';
import productCatalog from '../data/products.json' assert { type: 'json' };

assert.equal(
  productCatalog.some((product) => product.slug === 'founder-update-generator'),
  true
);
```

- [ ] **Step 2: Run a narrow check to verify it fails before metadata is added**

Run: `rg -n "\"founder-update-generator\"" public/products/index.json public/products`
Expected: no matches yet.

- [ ] **Step 3: Add the product metadata and listing**

```json
{
  "id": "founder-update-generator",
  "name": "Founder Update Generator",
  "description": "Upload messy founder materials and get one polished update with wins, challenges, metrics, next focus, and caveats.",
  "category": "Strategy",
  "productId": "FS014",
  "thumbnail": "/images/products/founder-update-generator/preview-1.png"
}
```

- [ ] **Step 4: Run the narrow check to verify the metadata exists**

Run: `rg -n "\"founder-update-generator\"" public/products/index.json public/products/founder-update-generator.json`
Expected: matches in both files.

- [ ] **Step 5: Commit**

```bash
git add public/products/index.json public/products/founder-update-generator.json
git commit -m "feat: add founder update product metadata"
```

---

### Task 5: Add Scripts and Full Verification

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the founder-update test script**

```json
"test:founder-update": "node src/utils/founderUpdateGenerator.test.js && node api/founder-update-generate.test.js"
```

- [ ] **Step 2: Run the founder-update suite**

Run: `npm.cmd run test:founder-update`
Expected: PASS with both founder-update suites green.

- [ ] **Step 3: Run the production build**

Run: `npm.cmd run build`
Expected: PASS with exit code `0`.

- [ ] **Step 4: Inspect git status for unintended changes**

Run: `git status --short`
Expected: only intended founder-update files plus the pre-existing unrelated docs folder contents that were not staged.

- [ ] **Step 5: Commit the verified implementation**

```bash
git add src/pages/FounderUpdateGenerator.jsx src/components/founder-update/FounderUpdateWorkspace.jsx src/utils/founderUpdateGenerator.js src/utils/founderUpdateGenerator.test.js api/founder-update-generate.js api/founder-update-generate.test.js public/products/founder-update-generator.json public/products/index.json package.json src/App.jsx
git commit -m "feat: ship founder update generator beta"
```
