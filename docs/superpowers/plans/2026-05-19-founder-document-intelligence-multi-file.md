# Founder Document Intelligence Multi-File Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `Founder Document Intelligence` into a compact multi-file founder analyst with type-aware per-file analysis and a cross-file founder brief.

**Architecture:** Keep one flagship workflow and extend the current single-file request path into a workspace request path. Add a shared workspace normalization layer, keep financing analysis reusable as an internal specialist path, and add one synthesis pass that merges all file-level findings into a founder-specific report.

**Tech Stack:** React 19, Vite, existing Founder Systems utilities, Node-based API handlers, OpenAI Responses API, lightweight Node assertion tests.

---

## File Map

### Create

- `src/utils/founderDocumentWorkspace.js`
  - Shared multi-file request normalization, workspace result normalization, document-type helpers, and Markdown export.
- `src/utils/founderDocumentWorkspace.test.js`
  - Behavior tests for multi-file validation, synthesis normalization, and Markdown rendering.

### Modify

- `src/utils/founderPdfSummary.js`
  - Reuse accepted file helpers in workspace mode and export any shared document-type constants needed by the workspace layer.
- `src/utils/founderSafeExplainer.js`
  - Expose financing type helpers and normalize specialist output into a file-level shape the workspace layer can consume.
- `src/utils/founderDocumentIntelligence.js`
  - Move from single-mode API resolution toward workspace-aware request helpers and display labels.
- `api/founder-pdf-summarize.js`
  - Accept a `files` array, classify each file, run type-aware analysis, and add a final cross-file synthesis pass.
- `api/founder-pdf-summarize.test.js`
  - Cover multi-file validation, classification routing, synthesis output, and partial-result behavior.
- `src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx`
  - Replace the single-file form with a compact multi-file workflow and render workspace-level plus per-file output.
- `package.json`
  - Include the new workspace utility test in the document-intelligence script.

### Verify During Execution

- `src/utils/founderDocumentIntelligence.test.js`
- `src/utils/founderPdfSummary.test.js`
- `src/utils/founderSafeExplainer.test.js`
- `api/founder-safe-explainer.test.js`

---

### Task 1: Add Multi-File Workspace Utilities

**Files:**
- Create: `src/utils/founderDocumentWorkspace.js`
- Test: `src/utils/founderDocumentWorkspace.test.js`
- Modify: `src/utils/founderPdfSummary.js`

- [ ] **Step 1: Write the failing workspace utility tests**

```js
import assert from 'assert';
import {
  buildFounderWorkspaceMarkdown,
  createFounderDocumentWorkspaceDraft,
  normalizeFounderDocumentWorkspaceRequest,
  normalizeFounderDocumentWorkspaceResponse,
  validateFounderDocumentWorkspaceRequest,
} from './founderDocumentWorkspace.js';

const draft = createFounderDocumentWorkspaceDraft();
assert.deepEqual(draft.files, []);
assert.equal(draft.focus, '');

const normalized = normalizeFounderDocumentWorkspaceRequest({
  files: [
    {
      filename: 'deck.pdf',
      mimeType: 'application/pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
      fileSize: 1024,
    },
    {
      filename: 'model.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileData: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,QUJDRA==',
      fileSize: 4,
    },
  ],
  focus: 'Find contradictions.',
});

assert.equal(normalized.files.length, 2);
assert.equal(normalized.files[0].id, 'file-1');
assert.equal(normalized.files[1].filename, 'model.xlsx');

const invalid = validateFounderDocumentWorkspaceRequest({ files: [] });
assert.equal(invalid.isValid, false);
assert.match(invalid.error, /at least one/i);

const normalizedResponse = normalizeFounderDocumentWorkspaceResponse({
  workspaceTitle: 'Founder document workspace',
  filesAnalyzed: ['deck.pdf', 'model.xlsx'],
  overallRead: 'The story is compelling but evidence is uneven.',
  whatMattersMost: ['The deck claims growth that the model does not support.'],
  contradictions: ['Deck says 85% gross margin while the model implies 61%.'],
  missingProof: ['No customer retention backup is included.'],
  watchouts: ['Fundraising claims look ahead of operating proof.'],
  priorityQuestions: ['Which margin figure is the current source of truth?'],
  nextActions: ['Reconcile the deck and model before sharing externally.'],
  fileAnalyses: [
    {
      fileId: 'file-1',
      filename: 'deck.pdf',
      detectedType: 'pitch-deck',
      summary: 'Clear story, weak proof.',
      strongestSignals: ['Narrative is tight.'],
      concerns: ['Traction proof is thin.'],
      focusAreas: ['Show retention evidence.'],
      extractionQuality: { label: 'high', notes: [] },
    },
  ],
  extractionNotes: ['One spreadsheet tab could not be interpreted fully.'],
});

assert.equal(normalizedResponse.ok, true);
assert.equal(normalizedResponse.fileAnalyses.length, 1);

const markdown = buildFounderWorkspaceMarkdown({
  workspaceName: 'Acme workspace',
  analysis: normalizedResponse,
});

assert.match(markdown, /## Cross-File Contradictions/m);
assert.match(markdown, /## File Analyses/m);
```

- [ ] **Step 2: Run the utility test to verify it fails**

Run: `node src/utils/founderDocumentWorkspace.test.js`
Expected: FAIL with `Cannot find module './founderDocumentWorkspace.js'` or missing export errors.

- [ ] **Step 3: Write the minimal workspace utility implementation**

```js
export function createFounderDocumentWorkspaceDraft() {
  return { files: [], focus: '' };
}

export function normalizeFounderDocumentWorkspaceRequest(input = {}) {
  const files = Array.isArray(input.files) ? input.files : [];
  return {
    files: files.map((file, index) => ({
      id: `file-${index + 1}`,
      filename: String(file?.filename || '').trim(),
      mimeType: String(file?.mimeType || '').trim().toLowerCase(),
      fileData: String(file?.fileData || '').trim(),
      fileSize: Number(file?.fileSize || 0),
    })),
    focus: String(input.focus || '').trim(),
  };
}

export function validateFounderDocumentWorkspaceRequest(input = {}) {
  const normalized = normalizeFounderDocumentWorkspaceRequest(input);
  if (normalized.files.length === 0) {
    return { normalized, isValid: false, error: 'Upload at least one supported file.' };
  }
  return { normalized, isValid: true, error: '' };
}
```

- [ ] **Step 4: Run the utility test to verify it passes**

Run: `node src/utils/founderDocumentWorkspace.test.js`
Expected: PASS with `founderDocumentWorkspace tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/utils/founderDocumentWorkspace.js src/utils/founderDocumentWorkspace.test.js src/utils/founderPdfSummary.js
git commit -m "feat: add founder document workspace utilities"
```

---

### Task 2: Add Workspace-Aware Document Routing Helpers

**Files:**
- Modify: `src/utils/founderDocumentIntelligence.js`
- Modify: `src/utils/founderSafeExplainer.js`
- Test: `src/utils/founderDocumentIntelligence.test.js`
- Test: `src/utils/founderSafeExplainer.test.js`

- [ ] **Step 1: Write the failing routing tests**

```js
import assert from 'assert';
import {
  classifyFounderDocumentType,
  isWorkspaceFinancingType,
  getDocumentIntelligenceApiConfig,
} from './founderDocumentIntelligence.js';

assert.equal(classifyFounderDocumentType('seed-safe.pdf', 'application/pdf'), 'safe');
assert.equal(classifyFounderDocumentType('board-model.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), 'financial-statement');
assert.equal(isWorkspaceFinancingType('term-sheet'), true);
assert.equal(isWorkspaceFinancingType('pitch-deck'), false);

const apiConfig = getDocumentIntelligenceApiConfig({
  env: {},
  hostname: 'foundersystems.in',
  fileCount: 2,
});

assert.equal(apiConfig.apiUrl, '/api/founder-pdf-summarize');
```

- [ ] **Step 2: Run the routing tests to verify they fail**

Run: `node src/utils/founderDocumentIntelligence.test.js`
Expected: FAIL with missing export errors for the new workspace helpers.

- [ ] **Step 3: Implement the routing helpers and financing-type bridge**

```js
const WORKSPACE_FINANCING_TYPES = new Set(['safe', 'term-sheet', 'convertible-note']);

export function isWorkspaceFinancingType(typeId) {
  return WORKSPACE_FINANCING_TYPES.has(String(typeId || '').trim().toLowerCase());
}

export function classifyFounderDocumentType(filename = '', mimeType = '') {
  const lowerFilename = String(filename || '').toLowerCase();
  const lowerMime = String(mimeType || '').toLowerCase();

  if (lowerFilename.includes('safe')) return 'safe';
  if (lowerFilename.includes('term')) return 'term-sheet';
  if (lowerFilename.includes('note')) return 'convertible-note';
  if (lowerFilename.endsWith('.xlsx') || lowerFilename.endsWith('.csv') || lowerMime.includes('excel')) {
    return 'financial-statement';
  }
  if (lowerFilename.includes('deck') || lowerFilename.endsWith('.pptx')) return 'pitch-deck';
  return 'general-founder-doc';
}
```

- [ ] **Step 4: Run the routing tests to verify they pass**

Run: `node src/utils/founderDocumentIntelligence.test.js && node src/utils/founderSafeExplainer.test.js`
Expected: PASS for both suites.

- [ ] **Step 5: Commit**

```bash
git add src/utils/founderDocumentIntelligence.js src/utils/founderDocumentIntelligence.test.js src/utils/founderSafeExplainer.js src/utils/founderSafeExplainer.test.js
git commit -m "feat: add founder document workspace routing helpers"
```

---

### Task 3: Upgrade the API Handler to Multi-File Analysis

**Files:**
- Modify: `api/founder-pdf-summarize.js`
- Modify: `api/founder-pdf-summarize.test.js`
- Modify: `src/utils/founderDocumentWorkspace.js`

- [ ] **Step 1: Write the failing multi-file API tests**

```js
const multiFileReq = {
  method: 'POST',
  body: {
    files: [
      {
        filename: 'seed-deck.pdf',
        mimeType: 'application/pdf',
        fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
        fileSize: 2048,
      },
      {
        filename: 'board-model.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileData: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,QUJDRA==',
        fileSize: 4,
      },
    ],
    focus: 'Find contradictions and missing proof.',
  },
};

const multiFileRes = createResponse();
await handler(multiFileReq, multiFileRes);

assert.equal(multiFileRes.statusCode, 200);

const payload = parseJsonBody(multiFileRes);
assert.equal(payload.ok, true);
assert.equal(payload.fileAnalyses.length, 2);
assert.equal(payload.contradictions.length, 1);
assert.match(payload.nextActions[0], /reconcile/i);
```

- [ ] **Step 2: Run the API test to verify it fails**

Run: `node api/founder-pdf-summarize.test.js`
Expected: FAIL because the handler still expects a single-file payload shape.

- [ ] **Step 3: Implement multi-file request handling, per-file analysis, and synthesis**

```js
async function analyzeWorkspaceFile(file, focus) {
  const detectedType = classifyFounderDocumentType(file.filename, file.mimeType);

  if (isWorkspaceFinancingType(detectedType)) {
    const financingResult = await explainFinancingDocument({
      ...file,
      mode: detectedType,
      focus,
    });
    return normalizeWorkspaceFileAnalysisFromFinancing(file, financingResult, detectedType);
  }

  const summaryResult = await summarizeWithModel({
    ...file,
    mode: mapWorkspaceTypeToSummaryMode(detectedType),
    focus,
  });
  return normalizeWorkspaceFileAnalysisFromSummary(file, summaryResult, detectedType);
}

async function analyzeWorkspaceRequest(input) {
  const fileAnalyses = [];
  for (const file of input.files) {
    fileAnalyses.push(await analyzeWorkspaceFile(file, input.focus));
  }
  return synthesizeFounderWorkspace(input, fileAnalyses);
}
```

- [ ] **Step 4: Run the API test to verify it passes**

Run: `node api/founder-pdf-summarize.test.js`
Expected: PASS with `founder-pdf-summarize API tests passed`.

- [ ] **Step 5: Commit**

```bash
git add api/founder-pdf-summarize.js api/founder-pdf-summarize.test.js src/utils/founderDocumentWorkspace.js
git commit -m "feat: add multi-file founder document analysis"
```

---

### Task 4: Update the Workspace UI for Multi-File Output

**Files:**
- Modify: `src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx`
- Modify: `src/utils/founderDocumentWorkspace.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing UI-support test and script expectation**

```js
import assert from 'assert';
import { buildFounderWorkspaceMarkdown } from './founderDocumentWorkspace.js';

const markdown = buildFounderWorkspaceMarkdown({
  workspaceName: 'Acme room',
  analysis: {
    ok: true,
    workspaceTitle: 'Acme room',
    filesAnalyzed: ['deck.pdf'],
    overallRead: 'Promising but inconsistent.',
    whatMattersMost: ['Revenue proof is weak.'],
    contradictions: [],
    missingProof: ['Retention backup is missing.'],
    watchouts: ['Claims outrun evidence.'],
    priorityQuestions: ['Where is the retention data?'],
    nextActions: ['Add evidence before sharing.'],
    fileAnalyses: [],
    extractionNotes: [],
  },
});

assert.match(markdown, /## What Matters Most/m);
assert.match(markdown, /## Suggested Next Actions/m);
```

- [ ] **Step 2: Run the workspace script suite to verify the new expectation fails before UI wiring**

Run: `npm.cmd run test:document-intelligence-workspace`
Expected: FAIL if the new workspace test file is not yet wired into the script or the Markdown renderer is incomplete.

- [ ] **Step 3: Implement the compact multi-file form and result rendering**

```jsx
const [files, setFiles] = useState([]);

function handleFileChange(event) {
  const nextFiles = Array.from(event.target.files || []);
  setFiles((current) => [...current, ...nextFiles]);
}

{result?.kind === 'workspace' ? (
  <div className="space-y-3">
    <SummarySection title="What matters most" items={result.data.whatMattersMost} />
    <SummarySection title="Cross-file contradictions" items={result.data.contradictions} />
    <SummarySection title="Missing proof or missing documents" items={result.data.missingProof} />
    {result.data.fileAnalyses.map((fileAnalysis) => (
      <WorkspaceFileCard key={fileAnalysis.fileId} fileAnalysis={fileAnalysis} />
    ))}
  </div>
) : null}
```

- [ ] **Step 4: Run the workspace script suite to verify it passes**

Run: `npm.cmd run test:document-intelligence-workspace`
Expected: PASS for `founderDocumentIntelligence tests passed` and `founderDocumentWorkspace tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx src/utils/founderDocumentWorkspace.js package.json
git commit -m "feat: ship multi-file founder document workspace"
```

---

### Task 5: Full Regression Verification

**Files:**
- Verify only: `package.json`

- [ ] **Step 1: Run the full document-intelligence test suite**

Run: `npm.cmd run test:document-intelligence`
Expected: PASS with all workspace, summary, and financing suites green.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`
Expected: PASS with exit code `0`.

- [ ] **Step 3: Inspect git status for unintended changes**

Run: `git status --short`
Expected: only intended product files plus the pre-existing untracked `docs/superpowers/specs/2026-05-13-founder-systems-priority-product-briefs.md`.

- [ ] **Step 4: Commit the verification-ready implementation**

```bash
git add src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx src/utils/founderDocumentWorkspace.js src/utils/founderDocumentIntelligence.js src/utils/founderPdfSummary.js src/utils/founderSafeExplainer.js api/founder-pdf-summarize.js api/founder-pdf-summarize.test.js package.json
git commit -m "feat: deepen founder document intelligence workspace"
```

