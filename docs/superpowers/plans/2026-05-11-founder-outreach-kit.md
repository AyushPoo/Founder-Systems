# Founder Outreach Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Founder Outreach Kit tool with hybrid intake, structured AI generation, local saved campaigns, catalog discovery, and CSV export.

**Architecture:** Add a dedicated React page and focused component set for the tool, backed by small campaign utilities and a Vercel serverless API endpoint at `/api/founder-outreach-generate`. Reuse the app’s visual language and a few proven interaction patterns from the founder strategy tool, but keep the state model specific to outreach campaigns.

**Tech Stack:** Vite, React 19, React Router, localStorage, fetch, Vercel serverless functions, plain JavaScript utility tests with Node `assert`

---

## File Structure

### Create

- `api/founder-outreach-generate.js`
- `docs/superpowers/specs/2026-05-11-founder-outreach-kit-design.md`
- `docs/superpowers/plans/2026-05-11-founder-outreach-kit.md`
- `public/products/founder-outreach-kit.json`
- `src/components/founder-outreach/AttachmentPicker.jsx`
- `src/components/founder-outreach/EmailsTab.jsx`
- `src/components/founder-outreach/ExportTab.jsx`
- `src/components/founder-outreach/LinkedInTab.jsx`
- `src/components/founder-outreach/ObjectionsTab.jsx`
- `src/components/founder-outreach/OutreachCoachPanel.jsx`
- `src/components/founder-outreach/OutreachIntakeForm.jsx`
- `src/components/founder-outreach/OutreachOutputTabs.jsx`
- `src/components/founder-outreach/OutreachProgress.jsx`
- `src/components/founder-outreach/OutreachWorkspace.jsx`
- `src/components/founder-outreach/SavedCampaignsDrawer.jsx`
- `src/components/founder-outreach/StrategyTab.jsx`
- `src/pages/FounderOutreachKit.jsx`
- `src/utils/outreachCampaign.js`
- `src/utils/outreachCampaign.test.js`
- `src/utils/outreachCampaignExport.js`
- `src/utils/outreachCampaignExport.test.js`
- `src/utils/outreachCampaignStorage.js`
- `src/utils/outreachCampaignStorage.test.js`

### Modify

- `package.json`
- `src/App.jsx`
- `src/pages/Products.jsx`
- `public/products/index.json`
- `vercel.json`

### Optional later, only if needed during implementation

- `src/index.css`
- `src/components/ProductCard.jsx`

## Task 1: Build The Campaign Domain Utilities First

**Files:**
- Create: `src/utils/outreachCampaign.js`
- Create: `src/utils/outreachCampaign.test.js`
- Create: `src/utils/outreachCampaignExport.js`
- Create: `src/utils/outreachCampaignExport.test.js`
- Create: `src/utils/outreachCampaignStorage.js`
- Create: `src/utils/outreachCampaignStorage.test.js`
- Modify: `package.json`

- [ ] **Step 1: Add lightweight test scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test:outreach": "node src/utils/outreachCampaign.test.js && node src/utils/outreachCampaignExport.test.js && node src/utils/outreachCampaignStorage.test.js"
  }
}
```

- [ ] **Step 2: Write failing utility tests for normalization in `src/utils/outreachCampaign.test.js`**

```js
import assert from 'assert';
import {
  createOutreachDraft,
  normalizeOutreachInput,
  normalizeOutreachOutput,
  getOutreachFieldFeedback,
} from './outreachCampaign.js';

const draft = createOutreachDraft();
assert.equal(draft.productName, '');
assert.deepEqual(draft.channels, []);

const normalizedInput = normalizeOutreachInput({
  productName: 'Founder Outreach Kit',
  offer: 'Outbound campaign generator',
  targetCustomer: 'Solo SaaS founders',
  buyerRole: 'Founder',
  painPoint: 'They do not know what to say in cold outreach',
  desiredOutcome: 'Book first calls',
  cta: 'Open to a quick call?',
  tone: 'founder-led',
  channels: ['email', 'linkedin', 'email'],
});

assert.equal(normalizedInput.productName, 'Founder Outreach Kit');
assert.deepEqual(normalizedInput.channels, ['email', 'linkedin']);

const feedback = getOutreachFieldFeedback({
  offer: 'AI tool',
  painPoint: 'growth',
  proof: '',
});

assert.equal(feedback.offer.length > 0, true);
assert.equal(feedback.painPoint.length > 0, true);

const normalizedOutput = normalizeOutreachOutput({
  icpSnapshot: {
    customer: 'Solo SaaS founders',
    buyerRole: 'Founder',
    painIntensity: 'High',
    buyingTrigger: 'Outbound is not converting',
    whyTheyRespond: 'They need pipeline fast',
  },
  positioningAngles: [
    {
      name: 'Pain-led',
      target: 'Solo SaaS founders',
      angle: 'Stop writing blank-page cold emails',
      whyItWorks: 'Speaks to immediate pain',
    },
  ],
  fixBeforeSending: ['Proof is thin'],
  emails: [
    {
      step: 1,
      title: 'Cold intro',
      subject: 'Quick idea for founder outbound',
      body: 'Short email body',
      delayDays: 0,
    },
  ],
  subjectLines: ['Quick idea for founder outbound'],
  linkedinMessages: [{ step: 'connection_request', body: 'Open to connect?' }],
  objectionReplies: [{ objection: 'Not interested', reply: 'Understood.' }],
  csvRows: [{ step: '1', channel: 'email', subject: 'Quick idea', body: 'Body', delayDays: 0, goal: 'Reply' }],
});

assert.equal(normalizedOutput.ok, true);
assert.equal(normalizedOutput.emails.length, 1);
assert.equal(normalizedOutput.linkedinMessages.length, 1);
```

- [ ] **Step 3: Implement the intake and output helpers in `src/utils/outreachCampaign.js`**

```js
const REQUIRED_FIELDS = [
  'productName',
  'offer',
  'targetCustomer',
  'buyerRole',
  'painPoint',
  'desiredOutcome',
  'cta',
  'tone',
];

const VALID_TONES = ['direct', 'warm', 'founder-led', 'bold', 'consultative'];
const VALID_CHANNELS = ['email', 'linkedin'];

function cleanText(value) {
  return String(value || '').trim();
}

function cleanArray(values) {
  return Array.isArray(values) ? values : [];
}

export function createOutreachDraft() {
  return {
    productName: '',
    offer: '',
    targetCustomer: '',
    buyerRole: '',
    geography: '',
    painPoint: '',
    desiredOutcome: '',
    proof: '',
    pricing: '',
    cta: '',
    tone: 'founder-led',
    channels: [],
    objections: [],
    competitors: '',
    industry: '',
    companySize: '',
    triggerEvent: '',
    websiteUrl: '',
    attachments: [],
  };
}

export function normalizeOutreachInput(input = {}) {
  const normalized = {
    ...createOutreachDraft(),
    productName: cleanText(input.productName),
    offer: cleanText(input.offer),
    targetCustomer: cleanText(input.targetCustomer),
    buyerRole: cleanText(input.buyerRole),
    geography: cleanText(input.geography),
    painPoint: cleanText(input.painPoint),
    desiredOutcome: cleanText(input.desiredOutcome),
    proof: cleanText(input.proof),
    pricing: cleanText(input.pricing),
    cta: cleanText(input.cta),
    tone: VALID_TONES.includes(cleanText(input.tone)) ? cleanText(input.tone) : 'founder-led',
    channels: [...new Set(cleanArray(input.channels).map((value) => cleanText(value)).filter((value) => VALID_CHANNELS.includes(value)))],
    objections: cleanArray(input.objections).map(cleanText).filter(Boolean),
    competitors: cleanText(input.competitors),
    industry: cleanText(input.industry),
    companySize: cleanText(input.companySize),
    triggerEvent: cleanText(input.triggerEvent),
    websiteUrl: cleanText(input.websiteUrl),
    attachments: cleanArray(input.attachments),
  };

  return normalized;
}

export function validateOutreachInput(input = {}) {
  const normalized = normalizeOutreachInput(input);
  const missing = REQUIRED_FIELDS.filter((key) => !normalized[key]);
  if (normalized.channels.length === 0) missing.push('channels');
  return { normalized, missing, isValid: missing.length === 0 };
}

export function getOutreachFieldFeedback(input = {}) {
  const normalized = normalizeOutreachInput(input);
  return {
    offer:
      normalized.offer.length > 12
        ? []
        : ['Make the offer concrete. Say what you do, for whom, and what changes after using it.'],
    painPoint:
      normalized.painPoint.length > 20
        ? []
        : ['Name the painful moment, not just a theme like "growth" or "sales".'],
    proof:
      normalized.proof
        ? []
        : ['If you have any proof, include it. Even one result, case study, or credible signal helps.'],
    cta:
      normalized.cta.length > 8
        ? []
        : ['Use one clear next step like a reply, quick call, or teardown offer.'],
  };
}

export function normalizeOutreachOutput(payload = {}) {
  const emails = cleanArray(payload.emails);
  const positioningAngles = cleanArray(payload.positioningAngles);
  const linkedinMessages = cleanArray(payload.linkedinMessages);
  const objectionReplies = cleanArray(payload.objectionReplies);
  const csvRows = cleanArray(payload.csvRows);
  const subjectLines = cleanArray(payload.subjectLines).map(cleanText).filter(Boolean);

  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Invalid outreach response.' };
  }

  if (!payload.icpSnapshot || !payload.icpSnapshot.customer || !payload.icpSnapshot.buyerRole) {
    return { ok: false, error: 'Outreach response is missing icpSnapshot.' };
  }

  if (emails.length === 0 || positioningAngles.length === 0) {
    return { ok: false, error: 'Outreach response is missing required campaign sections.' };
  }

  return {
    ok: true,
    normalizedInput: payload.normalizedInput || null,
    diagnosticNotes: cleanArray(payload.diagnosticNotes).map(cleanText).filter(Boolean),
    generatedAt: cleanText(payload.generatedAt),
    icpSnapshot: payload.icpSnapshot,
    positioningAngles,
    fixBeforeSending: cleanArray(payload.fixBeforeSending).map(cleanText).filter(Boolean),
    emails,
    subjectLines,
    linkedinMessages,
    objectionReplies,
    csvRows,
  };
}
```

- [ ] **Step 4: Write failing export tests in `src/utils/outreachCampaignExport.test.js`**

```js
import assert from 'assert';
import { buildOutreachCsvRows, buildOutreachCsvString } from './outreachCampaignExport.js';

const rows = buildOutreachCsvRows({
  emails: [
    { step: 1, title: 'Email 1', subject: 'Subject 1', body: 'Body 1', delayDays: 0 },
  ],
  linkedinMessages: [
    { step: 'follow_up_dm', body: 'LinkedIn body' },
  ],
});

assert.equal(rows.length, 2);
assert.equal(rows[0].channel, 'email');
assert.equal(rows[1].channel, 'linkedin');

const csv = buildOutreachCsvString(rows);
assert.match(csv, /step,channel,subject,body,delay_days,goal/);
assert.match(csv, /Email 1/);
```

- [ ] **Step 5: Implement CSV helpers in `src/utils/outreachCampaignExport.js`**

```js
function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildOutreachCsvRows(output = {}) {
  const emailRows = (output.emails || []).map((entry) => ({
    step: `email_${entry.step}`,
    channel: 'email',
    subject: entry.subject || '',
    body: entry.body || '',
    delay_days: entry.delayDays ?? 0,
    goal: entry.title || 'Get reply',
  }));

  const linkedinRows = (output.linkedinMessages || []).map((entry, index) => ({
    step: entry.step || `linkedin_${index + 1}`,
    channel: 'linkedin',
    subject: '',
    body: entry.body || '',
    delay_days: index,
    goal: 'Start conversation',
  }));

  return [...emailRows, ...linkedinRows];
}

export function buildOutreachCsvString(rows = []) {
  const headers = ['step', 'channel', 'subject', 'body', 'delay_days', 'goal'];
  const lines = [headers.join(',')];

  rows.forEach((row) => {
    lines.push(
      headers.map((key) => escapeCsvCell(row[key])).join(',')
    );
  });

  return lines.join('\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 6: Write failing storage tests in `src/utils/outreachCampaignStorage.test.js`**

```js
import assert from 'assert';
import {
  createCampaignRecord,
  serializeCampaigns,
  deserializeCampaigns,
} from './outreachCampaignStorage.js';

const record = createCampaignRecord({
  input: { productName: 'Founder Outreach Kit', buyerRole: 'Founder', targetCustomer: 'Solo SaaS founders', channels: ['email'] },
  output: { emails: [] },
});

assert.equal(record.name, 'Founder Outreach Kit');
assert.equal(record.channels[0], 'email');

const payload = serializeCampaigns([record]);
const restored = deserializeCampaigns(payload);
assert.equal(restored.length, 1);
assert.equal(restored[0].buyerRole, 'Founder');
```

- [ ] **Step 7: Implement local save helpers in `src/utils/outreachCampaignStorage.js`**

```js
const STORAGE_KEY = 'founder-outreach-kit:candidates';

function cleanText(value) {
  return String(value || '').trim();
}

function createId() {
  return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createCampaignRecord({ input = {}, output = {} }) {
  return {
    id: createId(),
    name: cleanText(input.productName) || 'Untitled campaign',
    productName: cleanText(input.productName),
    buyerRole: cleanText(input.buyerRole),
    targetCustomer: cleanText(input.targetCustomer),
    channels: Array.isArray(input.channels) ? input.channels : [],
    updatedAt: new Date().toISOString(),
    input,
    output,
  };
}

export function serializeCampaigns(records = []) {
  return JSON.stringify(records);
}

export function deserializeCampaigns(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readSavedCampaigns(storage = window.localStorage) {
  return deserializeCampaigns(storage.getItem(STORAGE_KEY));
}

export function writeSavedCampaigns(records, storage = window.localStorage) {
  storage.setItem(STORAGE_KEY, serializeCampaigns(records));
}

export function deleteSavedCampaign(storageId, storage = window.localStorage) {
  const next = readSavedCampaigns(storage).filter((entry) => entry.id !== storageId);
  writeSavedCampaigns(next, storage);
  return next;
}
```

- [ ] **Step 8: Run the utility test suite**

Run: `npm run test:outreach`

Expected: all three utility test files pass and print no assertion failures.

## Task 2: Add The API Contract And Serverless Generator Endpoint

**Files:**
- Create: `api/founder-outreach-generate.js`
- Modify: `vercel.json`
- Modify: `src/utils/outreachCampaign.js`

- [ ] **Step 1: Write the response contract into the endpoint first**

```js
const SYSTEM_PROMPT = `
You are a founder-led outbound strategist.
Be specific, concise, and plain-spoken.
Challenge weak positioning before writing copy.
Avoid generic SaaS filler, fake familiarity, and spammy claims.
Always return valid JSON.
`;

const RESPONSE_SHAPE = {
  diagnosticNotes: [''],
  fixBeforeSending: [''],
  icpSnapshot: {
    customer: '',
    buyerRole: '',
    painIntensity: '',
    buyingTrigger: '',
    whyTheyRespond: '',
  },
  positioningAngles: [
    {
      name: '',
      target: '',
      angle: '',
      whyItWorks: '',
      openingStyle: '',
    },
  ],
  emails: [
    {
      step: 1,
      title: '',
      subject: '',
      body: '',
      delayDays: 0,
    },
  ],
  subjectLines: [''],
  linkedinMessages: [
    {
      step: '',
      body: '',
    },
  ],
  objectionReplies: [
    {
      objection: '',
      reply: '',
    },
  ],
  csvRows: [
    {
      step: '',
      channel: '',
      subject: '',
      body: '',
      delayDays: 0,
      goal: '',
    },
  ],
};
```

- [ ] **Step 2: Implement request validation and prompt assembly in `api/founder-outreach-generate.js`**

```js
import { normalizeOutreachInput, normalizeOutreachOutput, validateOutreachInput } from '../src/utils/outreachCampaign.js';
import { buildOutreachCsvRows } from '../src/utils/outreachCampaignExport.js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function collectAttachmentContext(attachments = []) {
  const lines = [];
  attachments.forEach((file) => {
    if (!file || typeof file !== 'object') return;
    if (file.parsed && file.excerpt) {
      lines.push(`Attachment: ${file.name}\n${file.excerpt}`);
    } else if (file.name) {
      lines.push(`Attachment: ${file.name} (text extraction unavailable)`);
    }
  });
  return lines.join('\n\n');
}

function buildUserPrompt(input, attachments = []) {
  const attachmentContext = collectAttachmentContext(attachments);
  return `
Create a founder outbound campaign from this intake.

Product name: ${input.productName}
Offer: ${input.offer}
Target customer: ${input.targetCustomer}
Buyer role: ${input.buyerRole}
Geography: ${input.geography}
Pain point: ${input.painPoint}
Desired outcome: ${input.desiredOutcome}
Proof: ${input.proof}
Pricing: ${input.pricing}
CTA: ${input.cta}
Tone: ${input.tone}
Channels: ${input.channels.join(', ')}
Objections: ${(input.objections || []).join(', ')}
Competitors: ${input.competitors}
Industry: ${input.industry}
Company size: ${input.companySize}
Trigger event: ${input.triggerEvent}
Website URL: ${input.websiteUrl}

${attachmentContext}

Return JSON only.
`;
}
```

- [ ] **Step 3: Implement an MVP-safe endpoint with a model call seam and deterministic fallback**

```js
async function generateWithModel({ systemPrompt, userPrompt }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      diagnosticNotes: ['OPENAI_API_KEY is not configured, so a deterministic fallback campaign was returned.'],
      fixBeforeSending: ['Replace the fallback generator with a live model before production use.'],
      icpSnapshot: {
        customer: 'Solo SaaS founders',
        buyerRole: 'Founder',
        painIntensity: 'Moderate to high',
        buyingTrigger: 'Outbound is inconsistent or nonexistent',
        whyTheyRespond: 'They need first conversations fast without hiring SDRs',
      },
      positioningAngles: [
        {
          name: 'Pain-led angle',
          target: 'Founders doing their own sales',
          angle: 'Turn vague outreach into a usable sequence quickly',
          whyItWorks: 'It names the blank-page pain directly',
          openingStyle: 'Direct pain opener',
        },
      ],
      emails: [
        { step: 1, title: 'Cold intro', subject: 'Quick outbound idea', body: 'Saw that many founders stall on outbound because the offer is still fuzzy. We built a way to turn a rough offer into a full sequence in one sitting. Open to a quick look?', delayDays: 0 },
      ],
      subjectLines: ['Quick outbound idea'],
      linkedinMessages: [{ step: 'connection_request', body: 'Working on founder outbound systems and thought this might be relevant to what you are building.' }],
      objectionReplies: [{ objection: 'Not interested', reply: 'Totally fair. If outbound becomes a focus later, I can send a tighter example built around your exact offer.' }],
      csvRows: [],
    };
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    }),
  });

  const payload = await response.json();
  const text = payload.output?.[0]?.content?.[0]?.text || '{}';
  return JSON.parse(text);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  const { normalized, missing } = validateOutreachInput(req.body || {});
  if (missing.length > 0) {
    return json(res, 400, { ok: false, error: `Missing required fields: ${missing.join(', ')}` });
  }

  try {
    const raw = await generateWithModel({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(normalized, req.body?.attachments || []),
    });

    const withCsvRows = {
      ...raw,
      normalizedInput: normalized,
      generatedAt: new Date().toISOString(),
      csvRows: Array.isArray(raw.csvRows) && raw.csvRows.length > 0 ? raw.csvRows : buildOutreachCsvRows(raw),
    };

    const normalizedOutput = normalizeOutreachOutput(withCsvRows);
    if (!normalizedOutput.ok) {
      return json(res, 502, normalizedOutput);
    }

    return json(res, 200, normalizedOutput);
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error.message || 'Campaign generation failed.',
    });
  }
}
```

- [ ] **Step 4: Update `vercel.json` so API routes are not swallowed by the SPA rewrite**

```json
{
  "rewrites": [
    {
      "source": "/tools/promptdeck",
      "destination": "/tools/promptdeck/index.html"
    },
    {
      "source": "/tools/promptdeck/(.*)",
      "destination": "/tools/promptdeck/index.html"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

- [ ] **Step 5: Extend `normalizeOutreachOutput` if the endpoint reveals missing fallback normalization**

```js
if (!subjectLines.length) {
  payload.subjectLines = emails.map((entry) => cleanText(entry.subject)).filter(Boolean);
}
```

- [ ] **Step 6: Smoke-test the endpoint locally after the frontend exists**

Run: `npm run dev`

Expected: POST requests from the tool page to `/api/founder-outreach-generate` return valid JSON instead of falling through to the SPA HTML.

## Task 3: Build The Standalone Page And Intake Workspace

**Files:**
- Create: `src/pages/FounderOutreachKit.jsx`
- Create: `src/components/founder-outreach/OutreachWorkspace.jsx`
- Create: `src/components/founder-outreach/OutreachProgress.jsx`
- Create: `src/components/founder-outreach/OutreachIntakeForm.jsx`
- Create: `src/components/founder-outreach/OutreachCoachPanel.jsx`
- Create: `src/components/founder-outreach/AttachmentPicker.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Register the new route in `src/App.jsx`**

```jsx
import FounderOutreachKit from './pages/FounderOutreachKit';

<Route path="/tools/founder-outreach-kit" element={<FounderOutreachKit />} />
```

- [ ] **Step 2: Create the page shell in `src/pages/FounderOutreachKit.jsx`**

```jsx
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import OutreachWorkspace from '../components/founder-outreach/OutreachWorkspace';

const FounderOutreachKit = () => {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder Outreach Kit"
        description="Turn a vague founder offer into a structured outbound campaign with emails, LinkedIn copy, objections, and exports."
        canonical="/tools/founder-outreach-kit"
      />
      <Navbar />
      <main className="flex-grow pt-16 sm:pt-18 lg:pt-22 pb-6">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-5 lg:px-8">
          <OutreachWorkspace />
        </div>
      </main>
    </div>
  );
};

export default FounderOutreachKit;
```

- [ ] **Step 3: Create the main stateful workspace in `src/components/founder-outreach/OutreachWorkspace.jsx`**

```jsx
import { useMemo, useState } from 'react';
import OutreachProgress from './OutreachProgress';
import OutreachIntakeForm from './OutreachIntakeForm';
import OutreachCoachPanel from './OutreachCoachPanel';
import OutreachOutputTabs from './OutreachOutputTabs';
import SavedCampaignsDrawer from './SavedCampaignsDrawer';
import {
  createOutreachDraft,
  getOutreachFieldFeedback,
  normalizeOutreachInput,
  validateOutreachInput,
} from '../../utils/outreachCampaign';
import {
  createCampaignRecord,
  readSavedCampaigns,
  writeSavedCampaigns,
  deleteSavedCampaign,
} from '../../utils/outreachCampaignStorage';

const STEPS = [
  { id: 'offer', label: 'Offer' },
  { id: 'customer', label: 'Customer' },
  { id: 'pain-proof', label: 'Pain + proof' },
  { id: 'cta-tone', label: 'CTA + tone' },
  { id: 'generate', label: 'Generate' },
];

const FounderOutreachWorkspace = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(createOutreachDraft);
  const [result, setResult] = useState(null);
  const [savedCampaigns, setSavedCampaigns] = useState(() => readSavedCampaigns());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const feedback = useMemo(() => getOutreachFieldFeedback(draft), [draft]);

  async function handleGenerate() {
    const { normalized, missing } = validateOutreachInput(draft);
    if (missing.length > 0) {
      setError(`Missing: ${missing.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/founder-outreach-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to generate campaign.');
      }

      setResult(payload);
    } catch (submitError) {
      setError(submitError.message || 'Failed to generate campaign.');
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!result) return;
    const record = createCampaignRecord({
      input: normalizeOutreachInput(draft),
      output: result,
    });
    const next = [record, ...savedCampaigns].slice(0, 12);
    setSavedCampaigns(next);
    writeSavedCampaigns(next);
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.65fr)]">
      <div className="min-w-0">
        <OutreachProgress steps={STEPS} activeStep={stepIndex} />
        <OutreachIntakeForm
          draft={draft}
          onChange={setDraft}
          stepIndex={stepIndex}
          onNext={() => setStepIndex((value) => Math.min(value + 1, STEPS.length - 1))}
          onBack={() => setStepIndex((value) => Math.max(value - 1, 0))}
          onGenerate={handleGenerate}
          loading={loading}
          error={error}
        />
      </div>
      <div className="min-w-0">
        <OutreachCoachPanel draft={draft} feedback={feedback} result={result} onSave={handleSave} />
        <SavedCampaignsDrawer
          campaigns={savedCampaigns}
          onOpen={(record) => {
            setDraft(record.input);
            setResult(record.output);
          }}
          onDelete={(id) => {
            const next = deleteSavedCampaign(id);
            setSavedCampaigns(next);
          }}
        />
        <OutreachOutputTabs result={result} />
      </div>
    </section>
  );
};

export default FounderOutreachWorkspace;
```

- [ ] **Step 4: Implement the progress header in `src/components/founder-outreach/OutreachProgress.jsx`**

```jsx
const OutreachProgress = ({ steps, activeStep }) => (
  <div className="mb-4 rounded-[20px] border border-brand-black/10 bg-white p-4 shadow-[0_14px_32px_rgba(27,28,26,0.06)]">
    <div className="flex flex-wrap gap-2">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`min-w-[110px] rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
            index === activeStep
              ? 'border-brand-black bg-brand-orange text-white'
              : index < activeStep
                ? 'border-brand-black/20 bg-brand-black text-white'
                : 'border-brand-black/10 bg-brand-cream text-brand-black/50'
          }`}
        >
          {index + 1}. {step.label}
        </div>
      ))}
    </div>
  </div>
);

export default OutreachProgress;
```

- [ ] **Step 5: Build the hybrid step form in `src/components/founder-outreach/OutreachIntakeForm.jsx`**

```jsx
import AttachmentPicker from './AttachmentPicker';

function Field({ label, value, onChange, placeholder, textarea = false }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/55">{label}</span>
      <Tag
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-brand-black/12 bg-brand-cream px-4 py-3 text-sm font-medium text-brand-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] focus:border-brand-black/30 focus:bg-white focus:outline-none"
      />
    </label>
  );
}

const OutreachIntakeForm = ({ draft, onChange, stepIndex, onNext, onBack, onGenerate, loading, error }) => {
  const update = (key, value) => onChange((current) => ({ ...current, [key]: value }));

  return (
    <div className="rounded-[24px] border border-brand-black/10 bg-white p-5 shadow-[0_20px_44px_rgba(27,28,26,0.08)]">
      {stepIndex === 0 && (
        <div className="grid gap-4">
          <Field label="Product or service name" value={draft.productName} onChange={(value) => update('productName', value)} placeholder="Founder Outreach Kit" />
          <Field label="What do you sell?" value={draft.offer} onChange={(value) => update('offer', value)} placeholder="We turn a rough offer into a complete outbound campaign." textarea />
          <Field label="Website URL (optional)" value={draft.websiteUrl} onChange={(value) => update('websiteUrl', value)} placeholder="https://..." />
        </div>
      )}

      {stepIndex === 1 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Who do you sell to?" value={draft.targetCustomer} onChange={(value) => update('targetCustomer', value)} placeholder="Solo SaaS founders" />
          <Field label="Buyer role" value={draft.buyerRole} onChange={(value) => update('buyerRole', value)} placeholder="Founder / CEO" />
          <Field label="Target market or geography" value={draft.geography} onChange={(value) => update('geography', value)} placeholder="US, UK, India" />
          <Field label="Industry (optional)" value={draft.industry} onChange={(value) => update('industry', value)} placeholder="B2B SaaS" />
        </div>
      )}

      {stepIndex === 2 && (
        <div className="grid gap-4">
          <Field label="Main customer pain" value={draft.painPoint} onChange={(value) => update('painPoint', value)} placeholder="They know outbound matters but keep staring at a blank page." textarea />
          <Field label="Desired outcome" value={draft.desiredOutcome} onChange={(value) => update('desiredOutcome', value)} placeholder="Book first 10 sales calls" />
          <Field label="Proof, results, or case study" value={draft.proof} onChange={(value) => update('proof', value)} placeholder="Helped 12 founders ship campaigns in under a day." textarea />
          <AttachmentPicker
            attachments={draft.attachments || []}
            onChange={(attachments) => update('attachments', attachments)}
          />
        </div>
      )}

      {stepIndex === 3 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Offer or pricing" value={draft.pricing} onChange={(value) => update('pricing', value)} placeholder="Free preview, then paid full campaign" />
          <Field label="Call to action" value={draft.cta} onChange={(value) => update('cta', value)} placeholder="Open to a quick teardown?" />
          <Field label="Competitors (optional)" value={draft.competitors} onChange={(value) => update('competitors', value)} placeholder="ChatGPT, Jasper, manual copywriters" />
          <Field label="Trigger event (optional)" value={draft.triggerEvent} onChange={(value) => update('triggerEvent', value)} placeholder="Recently launched, hiring sales, posting about pipeline" />
        </div>
      )}

      {stepIndex === 4 && (
        <div className="grid gap-5">
          <div>
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/55">Tone</span>
            <div className="flex flex-wrap gap-2">
              {['direct', 'warm', 'founder-led', 'bold', 'consultative'].map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => update('tone', tone)}
                  className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                    draft.tone === tone ? 'border-brand-black bg-brand-black text-white' : 'border-brand-black/12 bg-white text-brand-black/60'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/55">Channel</span>
            <div className="flex gap-2">
              {['email', 'linkedin'].map((channel) => {
                const active = (draft.channels || []).includes(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() =>
                      update(
                        'channels',
                        active
                          ? draft.channels.filter((value) => value !== channel)
                          : [...(draft.channels || []), channel]
                      )
                    }
                    className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                      active ? 'border-brand-black bg-brand-orange text-white' : 'border-brand-black/12 bg-white text-brand-black/60'
                    }`}
                  >
                    {channel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm font-bold text-red-600">{error}</p>}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} disabled={stepIndex === 0} className="rounded-full border border-brand-black/12 px-4 py-2 text-sm font-black text-brand-black disabled:opacity-40">
          Back
        </button>
        {stepIndex < 4 ? (
          <button type="button" onClick={onNext} className="rounded-full border border-brand-black bg-brand-black px-5 py-2 text-sm font-black text-white">
            Next
          </button>
        ) : (
          <button type="button" onClick={onGenerate} disabled={loading} className="rounded-full border border-brand-black bg-brand-orange px-5 py-2 text-sm font-black text-white disabled:opacity-60">
            {loading ? 'Generating...' : 'Generate campaign'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OutreachIntakeForm;
```

- [ ] **Step 6: Implement the coaching and attachment helpers**

```jsx
// src/components/founder-outreach/OutreachCoachPanel.jsx
const OutreachCoachPanel = ({ draft, feedback, result, onSave }) => (
  <div className="mb-4 rounded-[24px] border border-brand-black/10 bg-white p-5 shadow-[0_18px_34px_rgba(27,28,26,0.06)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-black tracking-tight-brand">Strategist notes</h2>
        <p className="mt-1 text-sm font-medium text-brand-black/55">
          The tool should coach without blocking. These notes tighten the inputs before you send anything.
        </p>
      </div>
      {result && (
        <button type="button" onClick={onSave} className="rounded-full border border-brand-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em]">
          Save locally
        </button>
      )}
    </div>

    <div className="mt-4 grid gap-3">
      {Object.entries(feedback).map(([key, notes]) => (
        <div key={key} className="rounded-2xl bg-brand-cream px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">{key}</p>
          {notes.length > 0 ? (
            notes.map((note) => (
              <p key={note} className="mt-1 text-sm font-medium text-brand-black/72">{note}</p>
            ))
          ) : (
            <p className="mt-1 text-sm font-medium text-brand-black/48">Strong enough to move forward.</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default OutreachCoachPanel;
```

```jsx
// src/components/founder-outreach/AttachmentPicker.jsx
const AttachmentPicker = ({ attachments, onChange }) => {
  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).slice(0, 4);
    const normalized = await Promise.all(
      files.map(async (file) => {
        const isText = file.type.startsWith('text/') || /\.(txt|md|csv|tsv|json)$/i.test(file.name);
        if (!isText) {
          return { name: file.name, type: file.type, parsed: false, excerpt: '' };
        }
        const text = await file.text();
        return {
          name: file.name,
          type: file.type,
          parsed: true,
          excerpt: String(text || '').trim().slice(0, 1800),
        };
      })
    );
    onChange(normalized);
  }

  return (
    <div className="rounded-2xl border border-dashed border-brand-black/18 bg-brand-cream px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">Attachments</p>
          <p className="text-xs font-medium text-brand-black/48">Text and image context are allowed. Text files are excerpted for MVP.</p>
        </div>
        <label className="rounded-full border border-brand-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] cursor-pointer">
          Add files
          <input type="file" multiple className="hidden" onChange={(event) => handleFiles(event.target.files)} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(attachments || []).map((file) => (
          <span key={file.name} className="rounded-full border border-brand-black/10 bg-white px-3 py-2 text-xs font-bold text-brand-black/70">
            {file.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AttachmentPicker;
```

## Task 4: Build The Tabbed Output, Export, And Saved Campaign Surface

**Files:**
- Create: `src/components/founder-outreach/OutreachOutputTabs.jsx`
- Create: `src/components/founder-outreach/StrategyTab.jsx`
- Create: `src/components/founder-outreach/EmailsTab.jsx`
- Create: `src/components/founder-outreach/LinkedInTab.jsx`
- Create: `src/components/founder-outreach/ObjectionsTab.jsx`
- Create: `src/components/founder-outreach/ExportTab.jsx`
- Create: `src/components/founder-outreach/SavedCampaignsDrawer.jsx`

- [ ] **Step 1: Create the tab container in `src/components/founder-outreach/OutreachOutputTabs.jsx`**

```jsx
import { useMemo, useState } from 'react';
import StrategyTab from './StrategyTab';
import EmailsTab from './EmailsTab';
import LinkedInTab from './LinkedInTab';
import ObjectionsTab from './ObjectionsTab';
import ExportTab from './ExportTab';

const TABS = [
  { id: 'strategy', label: 'Strategy' },
  { id: 'emails', label: 'Emails' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'objections', label: 'Objections' },
  { id: 'export', label: 'Export' },
];

const OutreachOutputTabs = ({ result }) => {
  const [tab, setTab] = useState('strategy');
  const active = useMemo(() => {
    if (!result) return null;
    switch (tab) {
      case 'emails':
        return <EmailsTab result={result} />;
      case 'linkedin':
        return <LinkedInTab result={result} />;
      case 'objections':
        return <ObjectionsTab result={result} />;
      case 'export':
        return <ExportTab result={result} />;
      case 'strategy':
      default:
        return <StrategyTab result={result} />;
    }
  }, [result, tab]);

  return (
    <div className="rounded-[24px] border border-brand-black/10 bg-white p-5 shadow-[0_18px_34px_rgba(27,28,26,0.06)]">
      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
              tab === entry.id ? 'border-brand-black bg-brand-black text-white' : 'border-brand-black/12 bg-brand-cream text-brand-black/55'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {result ? active : <p className="text-sm font-medium text-brand-black/52">Generate a campaign to populate the workspace.</p>}
      </div>
    </div>
  );
};

export default OutreachOutputTabs;
```

- [ ] **Step 2: Implement the strategy tab with `Fix Before Sending` first**

```jsx
const StrategyTab = ({ result }) => (
  <div className="grid gap-4">
    <section className="rounded-2xl bg-brand-cream p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-brand-black/50">Fix Before Sending</h3>
      <ul className="mt-2 grid gap-2">
        {(result.fixBeforeSending || []).map((item) => (
          <li key={item} className="text-sm font-medium text-brand-black/80">{item}</li>
        ))}
      </ul>
    </section>

    <section className="rounded-2xl border border-brand-black/10 p-4">
      <h3 className="text-base font-black">ICP Snapshot</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {Object.entries(result.icpSnapshot || {}).map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-white p-4 shadow-[0_8px_18px_rgba(27,28,26,0.04)]">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">{key}</p>
            <p className="mt-1 text-sm font-medium text-brand-black/75">{value}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="grid gap-3">
      {(result.positioningAngles || []).map((angle) => (
        <article key={angle.name} className="rounded-2xl border border-brand-black/10 p-4">
          <h4 className="text-sm font-black uppercase tracking-[0.12em] text-brand-black/52">{angle.name}</h4>
          <p className="mt-2 text-sm font-medium text-brand-black/75">{angle.angle}</p>
          <p className="mt-2 text-xs font-bold text-brand-black/54">Target: {angle.target}</p>
          <p className="mt-1 text-xs font-medium text-brand-black/56">{angle.whyItWorks}</p>
        </article>
      ))}
    </section>
  </div>
);

export default StrategyTab;
```

- [ ] **Step 3: Implement copy-ready message tabs**

```jsx
// src/components/founder-outreach/EmailsTab.jsx
function copyText(text) {
  return navigator.clipboard.writeText(text);
}

const EmailsTab = ({ result }) => (
  <div className="grid gap-3">
    {(result.emails || []).map((email) => (
      <article key={email.step} className="rounded-2xl border border-brand-black/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">Email {email.step}</p>
            <h4 className="mt-1 text-base font-black">{email.title}</h4>
          </div>
          <button type="button" onClick={() => copyText(`Subject: ${email.subject}\n\n${email.body}`)} className="rounded-full border border-brand-black/12 px-3 py-2 text-xs font-black uppercase tracking-[0.12em]">
            Copy
          </button>
        </div>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-brand-black/42">Subject</p>
        <p className="mt-1 text-sm font-medium text-brand-black/78">{email.subject}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-brand-black/76">{email.body}</p>
      </article>
    ))}
  </div>
);

export default EmailsTab;
```

```jsx
// src/components/founder-outreach/LinkedInTab.jsx
const LinkedInTab = ({ result }) => (
  <div className="grid gap-3">
    {(result.linkedinMessages || []).map((entry) => (
      <article key={entry.step} className="rounded-2xl border border-brand-black/10 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">{entry.step}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-brand-black/76">{entry.body}</p>
      </article>
    ))}
  </div>
);

export default LinkedInTab;
```

```jsx
// src/components/founder-outreach/ObjectionsTab.jsx
const ObjectionsTab = ({ result }) => (
  <div className="grid gap-3">
    {(result.objectionReplies || []).map((entry) => (
      <article key={entry.objection} className="rounded-2xl border border-brand-black/10 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">{entry.objection}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-brand-black/76">{entry.reply}</p>
      </article>
    ))}
  </div>
);

export default ObjectionsTab;
```

- [ ] **Step 4: Implement export and saved campaign controls**

```jsx
// src/components/founder-outreach/ExportTab.jsx
import { buildOutreachCsvRows, buildOutreachCsvString, downloadCsv } from '../../utils/outreachCampaignExport';

const ExportTab = ({ result }) => {
  const rows = buildOutreachCsvRows(result);
  const csv = buildOutreachCsvString(rows);

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={() => downloadCsv('founder-outreach-campaign.csv', csv)}
        className="rounded-full border border-brand-black bg-brand-orange px-4 py-2 text-sm font-black text-white"
      >
        Download CSV
      </button>
      <pre className="overflow-x-auto rounded-2xl bg-brand-black p-4 text-xs text-white">{csv}</pre>
    </div>
  );
};

export default ExportTab;
```

```jsx
// src/components/founder-outreach/SavedCampaignsDrawer.jsx
const SavedCampaignsDrawer = ({ campaigns, onOpen, onDelete }) => (
  <div className="mb-4 rounded-[24px] border border-brand-black/10 bg-white p-5 shadow-[0_18px_34px_rgba(27,28,26,0.06)]">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-black tracking-tight-brand">Saved campaigns</h2>
      <span className="text-xs font-black uppercase tracking-[0.14em] text-brand-black/42">{campaigns.length}</span>
    </div>
    <div className="mt-4 grid gap-3">
      {campaigns.length === 0 ? (
        <p className="text-sm font-medium text-brand-black/52">No local campaigns saved yet.</p>
      ) : (
        campaigns.map((campaign) => (
          <div key={campaign.id} className="flex items-center justify-between gap-3 rounded-2xl bg-brand-cream px-4 py-3">
            <button type="button" onClick={() => onOpen(campaign)} className="min-w-0 text-left">
              <p className="truncate text-sm font-black text-brand-black">{campaign.name}</p>
              <p className="truncate text-xs font-medium text-brand-black/52">{campaign.targetCustomer} • {campaign.buyerRole}</p>
            </button>
            <button type="button" onClick={() => onDelete(campaign.id)} className="rounded-full border border-brand-black/12 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]">
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  </div>
);

export default SavedCampaignsDrawer;
```

## Task 5: Wire The Tool Into Catalog Discovery

**Files:**
- Modify: `src/pages/Products.jsx`
- Modify: `public/products/index.json`
- Create: `public/products/founder-outreach-kit.json`

- [ ] **Step 1: Add the new category to `src/pages/Products.jsx`**

```jsx
const CATEGORIES = ['All', 'Finance', 'Operations', 'Strategy', 'Marketing Tools'];
```

- [ ] **Step 2: Add the tool card entry to `public/products/index.json`**

```json
{
  "id": "founder-outreach-kit",
  "name": "Founder Outreach Kit",
  "description": "Turn a rough founder offer into a full outbound campaign with positioning angles, emails, LinkedIn copy, objections, and exportable rows.",
  "category": "Marketing Tools",
  "productId": "FS012",
  "thumbnail": "/images/strategy.png"
}
```

- [ ] **Step 3: Add the product detail payload in `public/products/founder-outreach-kit.json`**

```json
{
  "slug": "founder-outreach-kit",
  "productId": "FS012",
  "catalogName": "Founder Outreach Kit",
  "catalogDescription": "Turn a rough founder offer into a ready-to-send outbound campaign in 10 minutes.",
  "catalogCategory": "Marketing Tools",
  "title": "Founder Outreach Kit",
  "subtitle": "Go from vague offer to complete outbound campaign in one sitting.",
  "descriptionBody": "Most early founders do not struggle because they lack hustle. They struggle because the offer is fuzzy, the ICP is broad, and every cold email sounds like a recycled SaaS template. Founder Outreach Kit gives you a more useful workflow: diagnose the positioning, tighten the messaging, and generate the campaign assets you can actually send.",
  "section1Title": "A founder outbound workflow, not a one-off email writer",
  "section1Body": "Answer the right intake questions, upload context, get pushed when the positioning is weak, and leave with strategy, email copy, LinkedIn messages, objection handling, and CSV-ready rows.",
  "featuresTitle": "What the tool generates:",
  "features": [
    { "name": "ICP snapshot", "desc": "Summarizes the buyer, trigger, and why this segment should respond." },
    { "name": "Positioning angles", "desc": "Generates three campaign directions before writing the sequence." },
    { "name": "Email + LinkedIn sequences", "desc": "Creates multi-step outbound copy in a founder-native tone." },
    { "name": "Export-ready output", "desc": "Includes copy-friendly sections and spreadsheet-ready rows." }
  ],
  "whyTitle": "Why use this instead of prompting from scratch?",
  "whyPoints": [
    { "title": "Better intake", "desc": "The tool asks for the missing context generic chat prompts usually skip." },
    { "title": "Positioning first", "desc": "Weak messaging gets challenged before the sequence is written." },
    { "title": "Campaign, not single email", "desc": "You leave with follow-ups, objections, and exports, not just one draft." }
  ],
  "footerSummaryTitle": "Beta Access",
  "footerSummaryDetails": "(Free while we refine output quality and workflow).",
  "footerResultTitle": "The Result",
  "footerResultDetails": "A full founder outbound campaign you can edit, save locally, and export.",
  "whatYouGet": [
    "Hybrid guided intake",
    "Fix Before Sending notes",
    "ICP snapshot",
    "3 positioning angles",
    "5-email campaign",
    "10 subject lines",
    "LinkedIn sequence",
    "Objection replies",
    "CSV-ready export"
  ],
  "whoThisIsFor": [
    "Solo SaaS founders",
    "AI agency owners",
    "B2B consultants",
    "Freelancers selling services",
    "Early-stage founders trying to get first 10 customers"
  ],
  "faq": [
    {
      "q": "Does this save my work?",
      "a": "Yes, the MVP saves campaigns locally in your browser so you can reopen and refine them."
    },
    {
      "q": "Is there a payment gate yet?",
      "a": "No. The first working version is intentionally open while we validate the workflow."
    },
    {
      "q": "Can I use attachments?",
      "a": "Yes. Text files are excerpted today, and image-aware context is supported in the UI for future multimodal expansion."
    }
  ],
  "images": [
    "/images/strategy.png"
  ],
  "launchUrl": "/tools/founder-outreach-kit",
  "category": "Marketing Tools"
}
```

- [ ] **Step 4: Verify catalog filtering and launch path manually**

Run: `npm run dev`

Expected: the products page shows a `Marketing Tools` filter, the Outreach Kit card appears under it, the product detail page loads, and the launch CTA opens `/tools/founder-outreach-kit`.

## Task 6: Verify End-To-End Behavior And Clean Up

**Files:**
- Modify: any files above as needed based on verification findings

- [ ] **Step 1: Run lint after all implementation work**

Run: `npm run lint`

Expected: no ESLint errors in the new page, components, utilities, or API file.

- [ ] **Step 2: Run the outreach utility tests again**

Run: `npm run test:outreach`

Expected: normalization, export, and storage tests pass.

- [ ] **Step 3: Run the app and walk the main journey**

Run: `npm run dev`

Expected:
- `/tools/founder-outreach-kit` loads
- step navigation works
- required-field validation is supportive but functional
- generation returns usable output
- tabs switch without layout breakage
- CSV download works
- local save works
- reloading the page preserves saved campaigns

- [ ] **Step 4: Verify the serverless path through a local or deployed environment that supports `/api`**

Run: `npm run dev`

Expected: if local Vite middleware does not execute `/api`, document that the endpoint requires a Vercel-compatible runtime for full end-to-end testing and confirm the frontend still handles failure states gracefully.

- [ ] **Step 5: Tighten any polish gaps found during verification**

```jsx
// Typical fixes to apply if discovered during verification:
// - prevent overflow in long email bodies
// - clamp saved campaign titles
// - preserve draft state during failed submits
// - ensure tab buttons wrap cleanly on mobile
```

## Self-Review

- Spec coverage:
  - standalone tool route: covered in Tasks 3 and 5
  - hybrid intake + coaching: covered in Task 3
  - structured JSON generation: covered in Task 2
  - output tabs: covered in Task 4
  - local saved campaigns: covered in Tasks 1, 3, and 4
  - CSV export: covered in Tasks 1 and 4
  - products integration: covered in Task 5
- Placeholder scan:
  - no `TODO`, `TBD`, or “implement later” language remains in execution steps
- Type consistency:
  - shared names use `productName`, `targetCustomer`, `buyerRole`, `channels`, `fixBeforeSending`, `emails`, `linkedinMessages`, `objectionReplies`, and `csvRows` consistently

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-11-founder-outreach-kit.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
