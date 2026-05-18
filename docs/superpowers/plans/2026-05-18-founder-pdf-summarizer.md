# Founder PDF Summarizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a founder-facing PDF summarizer that accepts a PDF upload, lets the user choose a founder-specific mode, sends the PDF to a Vercel API route for structured analysis, and returns an exportable summary report.

**Architecture:** Add a standalone React tool page at `/tools/founder-pdf-summarizer`, backed by a single focused workspace component and a small shared utility module for request and response normalization. Use a Vercel serverless endpoint at `/api/founder-pdf-summarize` that passes the uploaded PDF directly to the OpenAI Responses API as a PDF file input, which keeps the MVP simple while still handling image-heavy PDFs without a separate OCR pipeline.

**Tech Stack:** Vite, React 19, React Router, fetch, FileReader, Vercel serverless functions, OpenAI Responses API PDF file input, plain JavaScript utility tests with Node `assert`

---

## File Structure

### Create

- `api/founder-pdf-summarize.js`
- `api/founder-pdf-summarize.test.js`
- `public/products/founder-pdf-summarizer.json`
- `src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx`
- `src/pages/FounderPdfSummarizer.jsx`
- `src/utils/founderPdfSummary.js`
- `src/utils/founderPdfSummary.test.js`
- `docs/superpowers/plans/2026-05-18-founder-pdf-summarizer.md`

### Modify

- `package.json`
- `public/products/index.json`
- `src/App.jsx`

### Keep Unchanged

- `src/pages/ProductDetail.jsx`
- `vercel.json`

The current app already resolves product detail pages from `public/products/*.json` and already supports local tool routes in `src/App.jsx`. The first PDF summarizer should fit that existing pattern without a router or catalog refactor.

## Task 1: Build The Shared PDF Summary Domain Utilities First

**Files:**
- Create: `src/utils/founderPdfSummary.js`
- Create: `src/utils/founderPdfSummary.test.js`
- Modify: `package.json`

- [ ] **Step 1: Add a targeted test script in `package.json`**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test:pdf-summary": "node src/utils/founderPdfSummary.test.js && node api/founder-pdf-summarize.test.js"
  }
}
```

- [ ] **Step 2: Write the failing utility tests in `src/utils/founderPdfSummary.test.js`**

```js
import assert from 'assert';
import {
  PDF_SUMMARY_MODES,
  MAX_PDF_SIZE_BYTES,
  buildFounderPdfSummaryMarkdown,
  createFounderPdfSummaryDraft,
  normalizeFounderPdfSummaryRequest,
  normalizeFounderPdfSummaryResponse,
  validateFounderPdfSummaryRequest,
} from './founderPdfSummary.js';

const draft = createFounderPdfSummaryDraft();
assert.equal(draft.mode, 'general');
assert.equal(draft.focus, '');
assert.equal(draft.filename, '');

assert.equal(Array.isArray(PDF_SUMMARY_MODES), true);
assert.equal(PDF_SUMMARY_MODES.some((mode) => mode.id === 'pitch-deck'), true);

const normalized = normalizeFounderPdfSummaryRequest({
  filename: 'deck.pdf',
  mimeType: 'application/pdf',
  fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
  fileSize: 1024,
  mode: 'pitch-deck',
  focus: 'Focus on market clarity',
});

assert.equal(normalized.filename, 'deck.pdf');
assert.equal(normalized.mode, 'pitch-deck');
assert.equal(normalized.focus, 'Focus on market clarity');

const invalidModeNormalized = normalizeFounderPdfSummaryRequest({
  filename: 'memo.pdf',
  mimeType: 'application/pdf',
  fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
  fileSize: 512,
  mode: 'wrong-mode',
});

assert.equal(invalidModeNormalized.mode, 'general');

const missingFile = validateFounderPdfSummaryRequest({
  filename: '',
  mimeType: '',
  fileData: '',
  fileSize: 0,
  mode: 'general',
  focus: '',
});

assert.equal(missingFile.isValid, false);
assert.match(missingFile.missing.join(', '), /filename/i);

const oversized = validateFounderPdfSummaryRequest({
  filename: 'large.pdf',
  mimeType: 'application/pdf',
  fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
  fileSize: MAX_PDF_SIZE_BYTES + 1,
  mode: 'general',
  focus: '',
});

assert.equal(oversized.isValid, false);
assert.match(oversized.error, /smaller than/i);

const normalizedResponse = normalizeFounderPdfSummaryResponse({
  documentType: 'pitch deck',
  title: 'Seed deck summary',
  mode: 'pitch-deck',
  executiveSummary: 'The deck is clear on the problem but weak on proof.',
  keyTakeaways: ['Problem is clear', 'Traction proof is thin'],
  riskFlags: ['Traction slide lacks hard numbers'],
  nextQuestions: ['What retention evidence exists?'],
  extractionQuality: {
    label: 'mixed',
    notes: ['Several pages were image-heavy.'],
  },
});

assert.equal(normalizedResponse.ok, true);
assert.equal(normalizedResponse.mode, 'pitch-deck');
assert.equal(normalizedResponse.keyTakeaways.length, 2);
assert.equal(normalizedResponse.extractionQuality.label, 'mixed');

const markdown = buildFounderPdfSummaryMarkdown({
  filename: 'seed-deck.pdf',
  summary: normalizedResponse,
});

assert.match(markdown, /^# Founder PDF Summary: seed-deck\.pdf/m);
assert.match(markdown, /## Executive Summary/m);
assert.match(markdown, /## Key Takeaways/m);

console.log('founderPdfSummary tests passed');
```

- [ ] **Step 3: Implement the shared domain helpers in `src/utils/founderPdfSummary.js`**

```js
const VALID_MODES = ['general', 'pitch-deck', 'investor-memo', 'grant-doc', 'market-report'];

export const MAX_PDF_SIZE_BYTES = 4 * 1024 * 1024;

export const PDF_SUMMARY_MODES = [
  {
    id: 'general',
    label: 'General founder PDF',
    description: 'Use this for mixed startup documents, notes, and operating files.',
  },
  {
    id: 'pitch-deck',
    label: 'Pitch deck',
    description: 'Focus on story clarity, traction proof, and investor questions.',
  },
  {
    id: 'investor-memo',
    label: 'Investor memo',
    description: 'Focus on market, model, proof, and missing diligence questions.',
  },
  {
    id: 'grant-doc',
    label: 'Grant document',
    description: 'Focus on eligibility, deliverables, risks, and next actions.',
  },
  {
    id: 'market-report',
    label: 'Market report',
    description: 'Focus on relevant market signals, implications, and open questions.',
  },
];

function cleanText(value) {
  return String(value || '').trim();
}

function cleanList(values) {
  return Array.isArray(values) ? values.map(cleanText).filter(Boolean) : [];
}

function normalizeMode(value) {
  const mode = cleanText(value).toLowerCase();
  return VALID_MODES.includes(mode) ? mode : 'general';
}

export function createFounderPdfSummaryDraft() {
  return {
    filename: '',
    mimeType: '',
    fileData: '',
    fileSize: 0,
    mode: 'general',
    focus: '',
  };
}

export function normalizeFounderPdfSummaryRequest(input = {}) {
  return {
    ...createFounderPdfSummaryDraft(),
    filename: cleanText(input.filename),
    mimeType: cleanText(input.mimeType) || 'application/pdf',
    fileData: cleanText(input.fileData),
    fileSize: Number.isFinite(Number(input.fileSize)) ? Number(input.fileSize) : 0,
    mode: normalizeMode(input.mode),
    focus: cleanText(input.focus),
  };
}

export function validateFounderPdfSummaryRequest(input = {}) {
  const normalized = normalizeFounderPdfSummaryRequest(input);
  const missing = [];

  if (!normalized.filename) missing.push('filename');
  if (!normalized.fileData) missing.push('fileData');
  if (normalized.mimeType !== 'application/pdf') missing.push('mimeType');

  if (missing.length > 0) {
    return {
      normalized,
      missing,
      isValid: false,
      error: `Missing required fields: ${missing.join(', ')}`,
    };
  }

  if (normalized.fileSize > MAX_PDF_SIZE_BYTES) {
    return {
      normalized,
      missing: [],
      isValid: false,
      error: 'Please upload a PDF smaller than 4 MB for the first version.',
    };
  }

  return {
    normalized,
    missing: [],
    isValid: true,
    error: '',
  };
}

export function normalizeFounderPdfSummaryResponse(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Invalid founder PDF summary response.' };
  }

  const executiveSummary = cleanText(payload.executiveSummary);
  const keyTakeaways = cleanList(payload.keyTakeaways);
  const riskFlags = cleanList(payload.riskFlags);
  const nextQuestions = cleanList(payload.nextQuestions);

  if (!executiveSummary || keyTakeaways.length === 0) {
    return { ok: false, error: 'Founder PDF summary response is missing required sections.' };
  }

  return {
    ok: true,
    documentType: cleanText(payload.documentType) || 'Founder PDF',
    title: cleanText(payload.title) || 'Founder PDF Summary',
    mode: normalizeMode(payload.mode),
    executiveSummary,
    keyTakeaways,
    riskFlags,
    nextQuestions,
    extractionQuality: {
      label: cleanText(payload?.extractionQuality?.label) || 'unknown',
      notes: cleanList(payload?.extractionQuality?.notes),
    },
  };
}

export function buildFounderPdfSummaryMarkdown({ filename = '', summary = {} }) {
  const safeFilename = cleanText(filename) || 'document.pdf';
  const normalized = normalizeFounderPdfSummaryResponse(summary);

  if (!normalized.ok) {
    return `# Founder PDF Summary: ${safeFilename}\n\nSummary unavailable.`;
  }

  const lines = [`# Founder PDF Summary: ${safeFilename}`, ''];

  lines.push(`**Document type:** ${normalized.documentType}`);
  lines.push(`**Mode:** ${normalized.mode}`);
  lines.push('');
  lines.push('## Executive Summary', '');
  lines.push(normalized.executiveSummary, '');
  lines.push('## Key Takeaways', '');
  normalized.keyTakeaways.forEach((item) => lines.push(`- ${item}`));
  lines.push('');

  if (normalized.riskFlags.length > 0) {
    lines.push('## Risk Flags', '');
    normalized.riskFlags.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (normalized.nextQuestions.length > 0) {
    lines.push('## Next Questions', '');
    normalized.nextQuestions.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (normalized.extractionQuality.notes.length > 0) {
    lines.push('## Extraction Notes', '');
    normalized.extractionQuality.notes.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  return lines.join('\n').trim();
}
```

- [ ] **Step 4: Run the new utility test to verify it fails before the implementation exists**

Run: `node src/utils/founderPdfSummary.test.js`  
Expected: FAIL with a missing import or missing export error before `founderPdfSummary.js` is implemented, then PASS after Step 3.

- [ ] **Step 5: Re-run the utility test after implementing `src/utils/founderPdfSummary.js`**

Run: `node src/utils/founderPdfSummary.test.js`  
Expected: `founderPdfSummary tests passed`

- [ ] **Step 6: Commit the utility layer**

```bash
git add package.json src/utils/founderPdfSummary.js src/utils/founderPdfSummary.test.js
git commit -m "feat: add founder pdf summary domain utilities"
```

## Task 2: Add The API Route That Sends PDFs Directly To The Model

**Files:**
- Create: `api/founder-pdf-summarize.js`
- Create: `api/founder-pdf-summarize.test.js`

- [ ] **Step 1: Write the failing API tests in `api/founder-pdf-summarize.test.js`**

```js
import assert from 'assert';
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'events';
import process from 'node:process';
import handler from './founder-pdf-summarize.js';

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

function createStreamingRequest(bodyText) {
  const req = new EventEmitter();
  req.method = 'POST';
  process.nextTick(() => {
    if (bodyText) {
      req.emit('data', Buffer.from(bodyText));
    }
    req.emit('end');
  });
  return req;
}

function parseJsonBody(res) {
  return JSON.parse(res.body);
}

const malformedReq = createStreamingRequest('{"filename":');
const malformedRes = createResponse();
await handler(malformedReq, malformedRes);

assert.equal(malformedRes.statusCode, 400);
assert.match(parseJsonBody(malformedRes).error, /malformed json|parse/i);

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENAI_API_KEY;

process.env.OPENAI_API_KEY = 'test-key';
globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({
    output_text: JSON.stringify({
      documentType: 'Pitch deck',
      title: 'Founder PDF Summary',
      mode: 'pitch-deck',
      executiveSummary: 'The deck is clear on the problem and weak on quantified traction.',
      keyTakeaways: ['Problem statement is strong', 'Traction proof is thin'],
      riskFlags: ['The business model slide lacks numbers'],
      nextQuestions: ['What retention data exists?'],
      extractionQuality: {
        label: 'mixed',
        notes: ['Some slides were image-heavy but still interpretable.'],
      },
    }),
  }),
});

const successReq = {
  method: 'POST',
  body: {
    filename: 'seed-deck.pdf',
    mimeType: 'application/pdf',
    fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
    fileSize: 1024,
    mode: 'pitch-deck',
    focus: 'Focus on fundraising clarity',
  },
};

const successRes = createResponse();
await handler(successReq, successRes);

if (typeof originalApiKey === 'undefined') {
  delete process.env.OPENAI_API_KEY;
} else {
  process.env.OPENAI_API_KEY = originalApiKey;
}
globalThis.fetch = originalFetch;

assert.equal(successRes.statusCode, 200);
const payload = parseJsonBody(successRes);
assert.equal(payload.ok, true);
assert.equal(payload.mode, 'pitch-deck');
assert.equal(payload.keyTakeaways.length, 2);
assert.equal(payload.extractionQuality.label, 'mixed');

console.log('founder-pdf-summarize API tests passed');
```

- [ ] **Step 2: Implement the Vercel route in `api/founder-pdf-summarize.js`**

```js
import { Buffer } from 'node:buffer';
import process from 'node:process';
import {
  normalizeFounderPdfSummaryResponse,
  validateFounderPdfSummaryRequest,
} from '../src/utils/founderPdfSummary.js';

const SYSTEM_PROMPT = [
  'You are a founder-specific document analyst.',
  'Read the uploaded PDF and return a concise structured summary for startup operators.',
  'Focus on practical clarity, missing proof, risks, and next questions.',
  'Do not give legal or financial certainty.',
  'Always return valid JSON only.',
].join('\n');

const RESPONSE_SHAPE = {
  documentType: '',
  title: '',
  mode: '',
  executiveSummary: '',
  keyTakeaways: [''],
  riskFlags: [''],
  nextQuestions: [''],
  extractionQuality: {
    label: '',
    notes: [''],
  },
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function cleanText(value) {
  return String(value || '').trim();
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function readJsonBody(req) {
  if (req?.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req?.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw createHttpError(400, `Malformed JSON request body: ${cleanText(error.message) || 'Unable to parse JSON.'}`);
    }
  }

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', resolve);
    req.on('error', reject);
  });

  const rawText = Buffer.concat(chunks).toString('utf8').trim();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw createHttpError(400, `Malformed JSON request body: ${cleanText(error.message) || 'Unable to parse JSON.'}`);
  }
}

function buildUserPrompt(normalized) {
  return [
    `Mode: ${normalized.mode}`,
    `Filename: ${normalized.filename}`,
    normalized.focus ? `Focus request: ${normalized.focus}` : 'Focus request: None provided.',
    '',
    'Return JSON only.',
    'Match this exact shape:',
    JSON.stringify(RESPONSE_SHAPE, null, 2),
    '',
    'Guidance by mode:',
    '- general: summarize the document and highlight the most important founder-relevant implications.',
    '- pitch-deck: focus on fundraising clarity, missing proof, and likely investor questions.',
    '- investor-memo: focus on business model logic, traction, diligence gaps, and risks.',
    '- grant-doc: focus on requirements, deadlines, risks, and next steps.',
    '- market-report: focus on the few signals that matter most for a startup operator.',
  ].join('\n');
}

function extractResponseText(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputItems = Array.isArray(payload.output) ? payload.output : [];
  const textParts = [];

  outputItems.forEach((item) => {
    const contentItems = Array.isArray(item?.content) ? item.content : [];
    contentItems.forEach((content) => {
      if (typeof content?.text === 'string' && content.text.trim()) {
        textParts.push(content.text.trim());
      } else if (typeof content?.text?.value === 'string' && content.text.value.trim()) {
        textParts.push(content.text.value.trim());
      }
    });
  });

  return textParts.join('\n').trim();
}

function parseModelJson(text) {
  const raw = cleanText(text);
  if (!raw) {
    throw new Error('OpenAI response did not include JSON text.');
  }

  try {
    return JSON.parse(raw);
  } catch {
    const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      return JSON.parse(fencedMatch[1].trim());
    }

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }

    throw new Error('OpenAI response was not valid JSON.');
  }
}

async function generateSummary(normalized) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw createHttpError(503, 'OPENAI_API_KEY is not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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
            {
              type: 'input_file',
              filename: normalized.filename,
              file_data: normalized.fileData,
            },
            {
              type: 'input_text',
              text: buildUserPrompt(normalized),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      cleanText(payload?.error?.message) ||
      cleanText(extractResponseText(payload)) ||
      `OpenAI request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return parseModelJson(extractResponseText(payload));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const requestBody = await readJsonBody(req);
    const validation = validateFounderPdfSummaryRequest(requestBody || {});

    if (!validation.isValid) {
      return json(res, 400, {
        ok: false,
        error: validation.error,
        missing: validation.missing,
      });
    }

    const rawOutput = await generateSummary(validation.normalized);
    const normalizedOutput = normalizeFounderPdfSummaryResponse({
      ...rawOutput,
      mode: rawOutput?.mode || validation.normalized.mode,
    });

    if (!normalizedOutput.ok) {
      return json(res, 502, normalizedOutput);
    }

    return json(res, 200, normalizedOutput);
  } catch (error) {
    return json(res, error?.statusCode || 500, {
      ok: false,
      error: cleanText(error?.message) || 'Founder PDF summarization failed.',
    });
  }
}
```

- [ ] **Step 3: Run the API test to verify it passes**

Run: `node api/founder-pdf-summarize.test.js`  
Expected: `founder-pdf-summarize API tests passed`

- [ ] **Step 4: Run the targeted product test script**

Run: `npm run test:pdf-summary`  
Expected:

```text
founderPdfSummary tests passed
founder-pdf-summarize API tests passed
```

- [ ] **Step 5: Commit the API layer**

```bash
git add api/founder-pdf-summarize.js api/founder-pdf-summarize.test.js package.json src/utils/founderPdfSummary.js src/utils/founderPdfSummary.test.js
git commit -m "feat: add founder pdf summarizer API"
```

## Task 3: Add The Founder-Facing Tool UI And Route

**Files:**
- Create: `src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx`
- Create: `src/pages/FounderPdfSummarizer.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create the tool workspace in `src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx`**

```jsx
import { useMemo, useState } from 'react';
import { copyText, downloadMarkdown } from '../../utils/founderSpec';
import {
  PDF_SUMMARY_MODES,
  buildFounderPdfSummaryMarkdown,
  createFounderPdfSummaryDraft,
  normalizeFounderPdfSummaryRequest,
  normalizeFounderPdfSummaryResponse,
  validateFounderPdfSummaryRequest,
} from '../../utils/founderPdfSummary';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read PDF file.'));
    reader.readAsDataURL(file);
  });
}

const PdfSummaryWorkspace = () => {
  const [draft, setDraft] = useState(createFounderPdfSummaryDraft);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const validation = useMemo(
    () => validateFounderPdfSummaryRequest(draft),
    [draft]
  );

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setResult(null);
    setError('');
    setCopied(false);

    if (!file) {
      setDraft(createFounderPdfSummaryDraft());
      return;
    }

    setDraft((current) =>
      normalizeFounderPdfSummaryRequest({
        ...current,
        filename: file.name,
        mimeType: file.type || 'application/pdf',
        fileSize: file.size,
      })
    );
  }

  function handleModeChange(mode) {
    setDraft((current) => ({ ...current, mode }));
  }

  function handleFocusChange(event) {
    const value = event.target.value;
    setDraft((current) => ({ ...current, focus: value }));
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setError('Choose a PDF before generating a summary.');
      return;
    }

    setLoading(true);
    setError('');
    setCopied(false);
    setResult(null);

    try {
      const fileData = await readFileAsDataUrl(selectedFile);
      const normalized = normalizeFounderPdfSummaryRequest({
        ...draft,
        fileData,
      });

      const nextValidation = validateFounderPdfSummaryRequest(normalized);
      if (!nextValidation.isValid) {
        throw new Error(nextValidation.error);
      }

      const response = await fetch('/api/founder-pdf-summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nextValidation.normalized),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Failed to summarize the PDF.');
      }

      const normalizedOutput = normalizeFounderPdfSummaryResponse(payload);
      if (!normalizedOutput.ok) {
        throw new Error(normalizedOutput.error);
      }

      setDraft(nextValidation.normalized);
      setResult(normalizedOutput);
    } catch (submitError) {
      setError(submitError?.message || 'Failed to summarize the PDF.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await copyText(buildFounderPdfSummaryMarkdown({ filename: draft.filename, summary: result }));
    setCopied(true);
  }

  function handleDownload() {
    if (!result) return;
    const filename = String(draft.filename || 'founder-pdf-summary')
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9-]+/gi, '-')
      .replace(/^-+|-+$/g, '');

    downloadMarkdown(
      `${filename || 'founder-pdf-summary'}.md`,
      buildFounderPdfSummaryMarkdown({ filename: draft.filename, summary: result })
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)]">
      <div className="rounded-3xl border-2 border-brand-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] md:p-8">
        <div className="mb-6">
          <span className="inline-flex rounded-sm border-2 border-brand-black bg-brand-orange px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
            Beta Tool
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight-brand text-brand-black md:text-4xl">
            Founder PDF Summarizer
          </h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-brand-black/70">
            Upload a founder document, choose the lens, and get a concise summary with key takeaways, risks, and next questions.
          </p>
        </div>

        <label className="block rounded-2xl border-2 border-dashed border-brand-black bg-brand-cream p-6">
          <span className="mb-2 block text-sm font-black uppercase tracking-[0.14em] text-brand-black/70">
            Upload PDF
          </span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm font-medium text-brand-black"
          />
          <p className="mt-3 text-sm text-brand-black/60">
            PDF only. Keep the first version under 4 MB.
          </p>
        </label>

        <div className="mt-6">
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-brand-black/70">
            Summary Mode
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {PDF_SUMMARY_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeChange(mode.id)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-black transition-all ${
                  draft.mode === mode.id
                    ? 'border-brand-black bg-brand-orange text-white shadow-[3px_3px_0px_0px_rgba(27,28,26,1)]'
                    : 'border-brand-black bg-white text-brand-black'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-black uppercase tracking-[0.14em] text-brand-black/70">
            Optional Focus
          </label>
          <textarea
            rows={4}
            value={draft.focus}
            onChange={handleFocusChange}
            placeholder="Example: focus on missing proof, GTM logic, and investor questions."
            className="mt-3 w-full rounded-2xl border-2 border-brand-black bg-white px-4 py-3 text-sm font-medium text-brand-black outline-none"
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border-2 border-brand-black bg-[#FFF1EB] px-4 py-3 text-sm font-bold text-brand-black">
            {error}
          </div>
        ) : null}

        {!validation.isValid && draft.filename ? (
          <div className="mt-4 text-sm font-bold text-brand-black/60">
            {validation.error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !selectedFile}
            className="rounded-sm border-2 border-brand-black bg-brand-orange px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Summarizing...' : 'Summarize PDF'}
          </button>
          {result ? (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-sm border-2 border-brand-black bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]"
              >
                {copied ? 'Copied' : 'Copy Markdown'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-sm border-2 border-brand-black bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]"
              >
                Download .md
              </button>
            </>
          ) : null}
        </div>
      </div>

      <aside className="rounded-3xl border-2 border-brand-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] md:p-8">
        <h2 className="text-2xl font-black tracking-tight-brand text-brand-black">
          Summary Output
        </h2>

        {!result ? (
          <p className="mt-4 text-sm font-medium leading-relaxed text-brand-black/65">
            Upload a founder PDF and run the summary to see the executive summary, key takeaways, risks, and next questions here.
          </p>
        ) : (
          <div className="mt-5 space-y-6">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-brand-black/55">
                Executive Summary
              </div>
              <p className="mt-2 text-sm leading-relaxed text-brand-black/80">
                {result.executiveSummary}
              </p>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-brand-black/55">
                Key Takeaways
              </div>
              <ul className="mt-2 space-y-2 text-sm text-brand-black/80">
                {result.keyTakeaways.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="font-black">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.riskFlags.length > 0 ? (
              <div>
                <div className="text-xs font-black uppercase tracking-[0.14em] text-brand-black/55">
                  Risk Flags
                </div>
                <ul className="mt-2 space-y-2 text-sm text-brand-black/80">
                  {result.riskFlags.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="font-black">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.nextQuestions.length > 0 ? (
              <div>
                <div className="text-xs font-black uppercase tracking-[0.14em] text-brand-black/55">
                  Next Questions
                </div>
                <ul className="mt-2 space-y-2 text-sm text-brand-black/80">
                  {result.nextQuestions.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="font-black">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-2xl border-2 border-dashed border-brand-black bg-brand-cream p-4">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-brand-black/55">
                Extraction Quality
              </div>
              <p className="mt-2 text-sm font-bold text-brand-black/80">
                {result.extractionQuality.label}
              </p>
              {result.extractionQuality.notes.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm text-brand-black/70">
                  {result.extractionQuality.notes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="font-black">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        )}
      </aside>
    </section>
  );
};

export default PdfSummaryWorkspace;
```

- [ ] **Step 2: Add the page shell in `src/pages/FounderPdfSummarizer.jsx`**

```jsx
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import PdfSummaryWorkspace from '../components/founder-pdf-summarizer/PdfSummaryWorkspace';

const FounderPdfSummarizer = () => {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder PDF Summarizer"
        description="Upload founder documents and get a concise summary with key takeaways, risks, and next questions."
        canonical="/tools/founder-pdf-summarizer"
      />
      <Navbar />

      <main className="flex-grow pb-6 pt-16 sm:pt-18 lg:pt-22">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-5 lg:px-8">
          <PdfSummaryWorkspace />
        </div>
      </main>
    </div>
  );
};

export default FounderPdfSummarizer;
```

- [ ] **Step 3: Register the route in `src/App.jsx`**

```jsx
import FounderPdfSummarizer from './pages/FounderPdfSummarizer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans cursor-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2216%22%20r%3D%2214%22%20fill%3D%22none%22%20stroke%3D%22%231A1A1A%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E'),_auto]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/:id" element={<GuideDetail />} />
          <Route path="/tools/founder-spec-generator" element={<FounderSpecGenerator />} />
          <Route path="/tools/founder-outreach-kit" element={<FounderOutreachKit />} />
          <Route path="/tools/founder-pdf-summarizer" element={<FounderPdfSummarizer />} />
          <Route path="/about" element={<About />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/access" element={<Access />} />
        </Routes>
      </div>
    </Router>
  );
}
```

- [ ] **Step 4: Run the product tests and the app build**

Run: `npm run test:pdf-summary`  
Expected:

```text
founderPdfSummary tests passed
founder-pdf-summarize API tests passed
```

Run: `npm run build`  
Expected: Vite production build completes successfully with the new page and route.

- [ ] **Step 5: Commit the UI layer**

```bash
git add src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx src/pages/FounderPdfSummarizer.jsx src/App.jsx
git commit -m "feat: add founder pdf summarizer tool UI"
```

## Task 4: Add Catalog Metadata And Verify Product Discovery

**Files:**
- Create: `public/products/founder-pdf-summarizer.json`
- Modify: `public/products/index.json`

- [ ] **Step 1: Add the product detail JSON in `public/products/founder-pdf-summarizer.json`**

```json
{
  "slug": "founder-pdf-summarizer",
  "productId": "FS013",
  "catalogName": "Founder PDF Summarizer",
  "catalogDescription": "Upload a founder document and get a concise summary with takeaways, risks, and next questions.",
  "catalogCategory": "Strategy",
  "title": "Founder PDF Summarizer",
  "subtitle": "Turn a dense founder PDF into a fast, structured read.",
  "descriptionBody": "Founders do not just deal with pitch decks. They deal with investor memos, grant documents, market reports, and long internal PDFs that take too long to parse when a decision is needed quickly.\n\nFounder PDF Summarizer turns one uploaded PDF into a concise founder-facing summary with key takeaways, risk flags, and next questions so you can understand the file before you disappear into a full read.",
  "section1Title": "A fast read before the deep read",
  "section1Body": "Upload the PDF, choose the lens, and get a structured summary that focuses on what matters for a founder or startup operator. The result is meant to speed up decisions, not replace careful review where the stakes are high.",
  "featuresTitle": "What the beta helps with:",
  "features": [
    {
      "name": "Founder-specific summary modes",
      "desc": "Choose a general founder read, pitch deck lens, investor memo lens, grant document lens, or market report lens."
    },
    {
      "name": "Structured takeaways",
      "desc": "Get one executive summary, key takeaways, risk flags, and next questions instead of a vague paragraph."
    },
    {
      "name": "Image-heavy PDF support",
      "desc": "The first version sends the full PDF directly for analysis so image-heavy pages still contribute to the result."
    },
    {
      "name": "Markdown export",
      "desc": "Copy or download the summary as a clean Markdown file for docs, Notion, or founder notes."
    }
  ],
  "whyTitle": "Why use this instead of skimming manually?",
  "whyPoints": [
    {
      "title": "Faster first-pass clarity",
      "desc": "Useful when you need to understand the file before deciding whether to keep reading, share it, or act on it."
    },
    {
      "title": "Founder lens instead of generic chat",
      "desc": "The output is designed around startup decisions, missing proof, and practical next questions."
    },
    {
      "title": "Works across multiple founder document types",
      "desc": "The same tool can help on decks, memos, grant documents, and market research PDFs."
    }
  ],
  "footerSummaryTitle": "Beta Access",
  "footerSummaryDetails": "(Free while we validate quality, file limits, and the strongest document modes).",
  "footerResultTitle": "The Result",
  "footerResultDetails": "A concise founder-ready summary you can copy, export, and use as a decision brief.",
  "whatYouGet": [
    "Executive summary",
    "Key takeaways",
    "Risk flags",
    "Next questions",
    "Founder-specific mode selection",
    "Markdown export",
    "Free beta access"
  ],
  "whoThisIsFor": [
    "Founders reviewing pitch decks, memos, and market documents quickly.",
    "Operators preparing for investor, customer, or grant conversations.",
    "Advisors or analysts who need a fast structured read before deeper review."
  ],
  "faq": [
    {
      "q": "Does this replace legal or financial review?",
      "a": "No. It is a founder-first summary tool, not a substitute for legal or expert advice."
    },
    {
      "q": "What files work in the first version?",
      "a": "The MVP is focused on PDF uploads under the file-size limit shown in the tool."
    },
    {
      "q": "Can I export the result?",
      "a": "Yes. You can copy the summary or download it as Markdown."
    }
  ],
  "images": [
    "/images/strategy.png"
  ],
  "launchUrl": "/tools/founder-pdf-summarizer",
  "category": "Strategy"
}
```

- [ ] **Step 2: Add the catalog entry in `public/products/index.json`**

```json
{
  "id": "founder-pdf-summarizer",
  "name": "Founder PDF Summarizer",
  "description": "Upload a founder PDF and get a concise summary with key takeaways, risks, and next questions.",
  "category": "Strategy",
  "productId": "FS013",
  "thumbnail": "/images/strategy.png"
}
```

Add this object in the same array pattern used by the existing tool products, ideally near the other strategy tools.

- [ ] **Step 3: Run the full verification pass**

Run: `npm run test:pdf-summary`  
Expected:

```text
founderPdfSummary tests passed
founder-pdf-summarize API tests passed
```

Run: `npm run build`  
Expected: Build succeeds and includes the new route.

Run: `git status --short`  
Expected: Only the planned files are changed for this feature.

- [ ] **Step 4: Commit the catalog wiring**

```bash
git add public/products/index.json public/products/founder-pdf-summarizer.json
git commit -m "feat: add founder pdf summarizer catalog entry"
```

## Task 5: Manual Verification And Launch-Readiness Pass

**Files:**
- Modify: `src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx` only if a verification issue is found

- [ ] **Step 1: Start the local app**

Run: `npm run dev`  
Expected: Vite starts and prints a local development URL.

- [ ] **Step 2: Verify the tool route manually**

Check:

- `/tools/founder-pdf-summarizer` loads
- a PDF can be selected
- mode selection updates visually
- the summarize action is disabled until a file is chosen
- errors are readable when a bad file or missing file is submitted

- [ ] **Step 3: Verify product discoverability manually**

Check:

- `/products/founder-pdf-summarizer` loads from the static JSON
- the launch button goes to `/tools/founder-pdf-summarizer`
- the product also appears in the `/products` catalog

- [ ] **Step 4: Re-run production checks after any manual fixes**

Run: `npm run test:pdf-summary`  
Expected:

```text
founderPdfSummary tests passed
founder-pdf-summarize API tests passed
```

Run: `npm run build`  
Expected: Vite production build succeeds with no new errors.

- [ ] **Step 5: Commit the final polish**

```bash
git add src/components/founder-pdf-summarizer/PdfSummaryWorkspace.jsx src/pages/FounderPdfSummarizer.jsx src/App.jsx public/products/index.json public/products/founder-pdf-summarizer.json api/founder-pdf-summarize.js api/founder-pdf-summarize.test.js src/utils/founderPdfSummary.js src/utils/founderPdfSummary.test.js package.json
git commit -m "feat: launch founder pdf summarizer"
```

## Self-Review

### Spec Coverage

Covered from the approved product spec:

- PDF upload
- founder-specific mode selection
- structured summary report
- exportable output
- low-cost build path
- image-heavy handling through direct PDF file input

Deliberately not in this first implementation plan:

- persistent saved history
- multi-document comparison
- collaboration
- pricing and checkout

### Placeholder Scan

This plan intentionally names exact files, commands, route paths, and data objects. There are no `TODO`, `TBD`, or “handle later” placeholders in the implementation tasks.

### Type Consistency

The request payload is consistently named:

- `filename`
- `mimeType`
- `fileData`
- `fileSize`
- `mode`
- `focus`

The normalized response is consistently named:

- `documentType`
- `title`
- `mode`
- `executiveSummary`
- `keyTakeaways`
- `riskFlags`
- `nextQuestions`
- `extractionQuality`

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-founder-pdf-summarizer.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
