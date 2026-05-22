# Non-Financial Thumbnail Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the weak non-financial product thumbnails with one unified Founder Systems diagram-cover system across the catalog and product detail pages.

**Architecture:** Generate all non-financial product covers from one shared SVG cover renderer plus a per-product visual spec manifest, then repoint the catalog and detail metadata to those generated covers. Remove the current screenshot-led special casing for these products so cards and detail media behave like one coherent system instead of a mix of screenshots, generic placeholders, and one-off visuals.

**Tech Stack:** Vite React frontend, static JSON product metadata, Node-based asset generation scripts, SVG assets, lightweight Node verification scripts, existing product catalog/detail pages.

---

## File Structure

### Existing files to modify
- `E:\Work\Founder-Systems-main-merge\src\components\ProductCard.jsx`
  - Remove screenshot-led thumbnail behavior for the non-financial batch and make the card chrome work for one shared diagram-cover system.
- `E:\Work\Founder-Systems-main-merge\src\pages\ProductDetail.jsx`
  - Ensure non-financial detail galleries can safely show the new cover first and stop relying on old generic fallback art.
- `E:\Work\Founder-Systems-main-merge\public\product-data\index.json`
  - Repoint non-financial `thumbnail` paths to the new generated SVG covers.
- `E:\Work\Founder-Systems-main-merge\public\product-data\founder-spec-generator.json`
  - Add the new generated cover as the first media item.
- `E:\Work\Founder-Systems-main-merge\public\product-data\founder-outreach-kit.json`
  - Add the new generated cover as the first media item.
- `E:\Work\Founder-Systems-main-merge\public\product-data\founder-pdf-summarizer.json`
  - Add `images` with the new generated cover and stop leaking generic `strategy.png`.
- `E:\Work\Founder-Systems-main-merge\public\product-data\founder-update-generator.json`
  - Add `images` with the new generated cover.
- `E:\Work\Founder-Systems-main-merge\public\product-data\linkedin-candidate-screener.json`
  - Add `images` with the new generated cover.
- `E:\Work\Founder-Systems-main-merge\public\product-data\founder-command-center.json`
  - Add `images` with the new generated cover.
- `E:\Work\Founder-Systems-main-merge\public\product-data\marketing-agent.json`
  - Add `images` with the new generated cover.
- `E:\Work\Founder-Systems-main-merge\public\product-data\finance-agent.json`
  - Add `images` with the new generated cover.
- `E:\Work\Founder-Systems-main-merge\public\product-data\ops-agent.json`
  - Add `images` with the new generated cover.
- `E:\Work\Founder-Systems-main-merge\public\product-data\promptdeck-ai.json`
  - Add the new generated cover as the first media item.
- `E:\Work\Founder-Systems-main-merge\package.json`
  - Add scripts for generating and verifying the thumbnail batch.

### New source/config files to create
- `E:\Work\Founder-Systems-main-merge\scripts\thumbnail-product-specs.mjs`
  - Source of truth for the ten non-financial products, their labels, diagram motifs, chip labels, and composition families.
- `E:\Work\Founder-Systems-main-merge\scripts\render-non-financial-thumbnails.mjs`
  - Shared SVG renderer plus the batch generator that writes all covers to `public/images/products/<slug>/thumbnail.svg`.
- `E:\Work\Founder-Systems-main-merge\scripts\verify-non-financial-thumbnails.mjs`
  - Lightweight assertions that every target product uses a generated SVG cover and no target still points at `/images/strategy.png`, `/images/systems.png`, `/images/finance.png`, or preview PNGs.

### Generated asset files to create
- `E:\Work\Founder-Systems-main-merge\public\images\products\founder-spec-generator\thumbnail.svg`
- `E:\Work\Founder-Systems-main-merge\public\images\products\founder-outreach-kit\thumbnail.svg`
- `E:\Work\Founder-Systems-main-merge\public\images\products\founder-pdf-summarizer\thumbnail.svg`
- `E:\Work\Founder-Systems-main-merge\public\images\products\founder-update-generator\thumbnail.svg`
- `E:\Work\Founder-Systems-main-merge\public\images\products\linkedin-candidate-screener\thumbnail.svg`
- `E:\Work\Founder-Systems-main-merge\public\images\products\founder-command-center\thumbnail.svg`
- `E:\Work\Founder-Systems-main-merge\public\images\products\marketing-agent\thumbnail.svg`
- `E:\Work\Founder-Systems-main-merge\public\images\products\finance-agent\thumbnail.svg`
- `E:\Work\Founder-Systems-main-merge\public\images\products\ops-agent\thumbnail.svg`
- `E:\Work\Founder-Systems-main-merge\public\images\products\promptdeck-ai\thumbnail.svg`

### Verification targets
- Catalog grid at `/products`
- Individual detail pages for the ten non-financial products
- Build output from `npm.cmd run build`
- Static metadata check from `npm.cmd run test:thumbnail-refresh`

## Product Scope

This plan covers exactly these ten products:
- `founder-spec-generator`
- `founder-outreach-kit`
- `founder-pdf-summarizer`
- `founder-update-generator`
- `linkedin-candidate-screener`
- `founder-command-center`
- `marketing-agent`
- `finance-agent`
- `ops-agent`
- `promptdeck-ai`

It explicitly does **not** touch:
- financial model thumbnails
- guide covers
- About page portrait
- payment/provider logos

## Visual System Rules

Every generated cover should use:
- cream background
- thin black linework
- one restrained orange accent
- small uppercase label
- one central diagram
- one support band with chips or markers

Composition family by product:
- `founder-spec-generator` → flow/sequence
- `founder-outreach-kit` → flow/sequence
- `founder-pdf-summarizer` → profile/grid/signal
- `founder-update-generator` → panel/frame
- `linkedin-candidate-screener` → profile/grid/signal
- `founder-command-center` → panel/frame
- `marketing-agent` → profile/grid/signal
- `finance-agent` → profile/grid/signal
- `ops-agent` → flow/sequence
- `promptdeck-ai` → panel/frame

---

### Task 1: Build the thumbnail spec manifest and verification harness

**Files:**
- Create: `E:\Work\Founder-Systems-main-merge\scripts\thumbnail-product-specs.mjs`
- Create: `E:\Work\Founder-Systems-main-merge\scripts\verify-non-financial-thumbnails.mjs`
- Modify: `E:\Work\Founder-Systems-main-merge\package.json`

- [ ] **Step 1: Write the failing verification script**

Create `E:\Work\Founder-Systems-main-merge\scripts\verify-non-financial-thumbnails.mjs`:

```js
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const catalogPath = path.join(repoRoot, 'public', 'product-data', 'index.json');
const blockedThumbnails = new Set([
  '/images/strategy.png',
  '/images/systems.png',
  '/images/finance.png',
  '/images/products/founder-spec-generator/preview-1.png',
  '/images/products/founder-outreach-kit/preview-1.png',
  '/images/products/promptdeck-ai/preview-1.png',
]);

const targetIds = new Set([
  'founder-spec-generator',
  'founder-outreach-kit',
  'founder-pdf-summarizer',
  'founder-update-generator',
  'linkedin-candidate-screener',
  'founder-command-center',
  'marketing-agent',
  'finance-agent',
  'ops-agent',
  'promptdeck-ai',
]);

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const failures = [];

for (const product of catalog) {
  if (!targetIds.has(product.id)) continue;
  if (!product.thumbnail?.endsWith('/thumbnail.svg')) {
    failures.push(`${product.id} thumbnail should point to a generated thumbnail.svg`);
  }
  if (blockedThumbnails.has(product.thumbnail)) {
    failures.push(`${product.id} still points to blocked fallback art: ${product.thumbnail}`);
  }
  const absoluteAssetPath = path.join(repoRoot, 'public', product.thumbnail.replace(/^\//, ''));
  if (!existsSync(absoluteAssetPath)) {
    failures.push(`${product.id} is missing generated file at ${absoluteAssetPath}`);
  }
}

if (failures.length > 0) {
  console.error('Non-financial thumbnail verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Non-financial thumbnail verification passed.');
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `node E:\Work\Founder-Systems-main-merge\scripts\verify-non-financial-thumbnails.mjs`

Expected: FAIL with messages showing the ten target products still use old fallback images or preview PNGs.

- [ ] **Step 3: Write the product spec manifest**

Create `E:\Work\Founder-Systems-main-merge\scripts\thumbnail-product-specs.mjs`:

```js
export const NON_FINANCIAL_THUMBNAIL_SPECS = [
  {
    id: 'founder-spec-generator',
    label: 'Strategy',
    badge: 'Decision Map',
    composition: 'flow',
    titleMarker: 'Scope the move',
    chips: ['Idea', 'Scope', 'GTM'],
    motif: 'branch-map',
  },
  {
    id: 'founder-outreach-kit',
    label: 'Marketing',
    badge: 'Campaign Flow',
    composition: 'flow',
    titleMarker: 'Tighten the sequence',
    chips: ['Email', 'LinkedIn', 'Proof'],
    motif: 'message-lanes',
  },
  {
    id: 'founder-pdf-summarizer',
    label: 'Documents',
    badge: 'Signal Grid',
    composition: 'signal',
    titleMarker: 'Extract what matters',
    chips: ['Docs', 'Sheets', 'Clauses'],
    motif: 'layered-docs',
  },
  {
    id: 'founder-update-generator',
    label: 'Reporting',
    badge: 'Update Frame',
    composition: 'panel',
    titleMarker: 'Turn signals into story',
    chips: ['Wins', 'Risks', 'Metrics'],
    motif: 'summary-panels',
  },
  {
    id: 'linkedin-candidate-screener',
    label: 'Hiring',
    badge: 'Role Fit',
    composition: 'signal',
    titleMarker: 'Profile in context',
    chips: ['Fit', 'Gaps', 'Notes'],
    motif: 'profile-grid',
  },
  {
    id: 'founder-command-center',
    label: 'Workspace',
    badge: 'Control Layer',
    composition: 'panel',
    titleMarker: 'One connected snapshot',
    chips: ['Health', 'Actions', 'Sync'],
    motif: 'dashboard-modules',
  },
  {
    id: 'marketing-agent',
    label: 'Operator',
    badge: 'Campaign Rhythm',
    composition: 'signal',
    titleMarker: 'Ship the next campaign',
    chips: ['Positioning', 'Channels', 'Cadence'],
    motif: 'campaign-grid',
  },
  {
    id: 'finance-agent',
    label: 'Operator',
    badge: 'Planning Bands',
    composition: 'signal',
    titleMarker: 'Keep the math close',
    chips: ['Runway', 'Budget', 'Reports'],
    motif: 'finance-grid',
  },
  {
    id: 'ops-agent',
    label: 'Operator',
    badge: 'Workflow Path',
    composition: 'flow',
    titleMarker: 'Reduce fragile handoffs',
    chips: ['SOPs', 'Cadence', 'Handoffs'],
    motif: 'workflow-chain',
  },
  {
    id: 'promptdeck-ai',
    label: 'Decks',
    badge: 'Slide Frame',
    composition: 'panel',
    titleMarker: 'Build the deck faster',
    chips: ['Story', 'Slides', 'Export'],
    motif: 'slide-stack',
  },
];
```

- [ ] **Step 4: Add package scripts for generation and verification**

Modify `E:\Work\Founder-Systems-main-merge\package.json`:

```json
{
  "scripts": {
    "generate:non-financial-thumbnails": "node scripts/render-non-financial-thumbnails.mjs",
    "test:thumbnail-refresh": "node scripts/verify-non-financial-thumbnails.mjs"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add E:/Work/Founder-Systems-main-merge/scripts/thumbnail-product-specs.mjs E:/Work/Founder-Systems-main-merge/scripts/verify-non-financial-thumbnails.mjs E:/Work/Founder-Systems-main-merge/package.json
git commit -m "test: add non-financial thumbnail verification harness"
```

### Task 2: Build the shared SVG cover renderer and generate the ten assets

**Files:**
- Create: `E:\Work\Founder-Systems-main-merge\scripts\render-non-financial-thumbnails.mjs`
- Modify: `E:\Work\Founder-Systems-main-merge\scripts\thumbnail-product-specs.mjs`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\founder-spec-generator\thumbnail.svg`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\founder-outreach-kit\thumbnail.svg`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\founder-pdf-summarizer\thumbnail.svg`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\founder-update-generator\thumbnail.svg`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\linkedin-candidate-screener\thumbnail.svg`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\founder-command-center\thumbnail.svg`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\marketing-agent\thumbnail.svg`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\finance-agent\thumbnail.svg`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\ops-agent\thumbnail.svg`
- Create: `E:\Work\Founder-Systems-main-merge\public\images\products\promptdeck-ai\thumbnail.svg`

- [ ] **Step 1: Write the renderer skeleton**

Create `E:\Work\Founder-Systems-main-merge\scripts\render-non-financial-thumbnails.mjs`:

```js
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { NON_FINANCIAL_THUMBNAIL_SPECS } from './thumbnail-product-specs.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const cream = '#f7f1e7';
const black = '#1b1c1a';
const orange = '#ff6a1a';
const soft = '#ded5c7';

function renderChip(text, x, y, width) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="42" rx="21" fill="#ffffff" stroke="${soft}" />
    <text x="${x + width / 2}" y="${y + 27}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${black}">
      ${text}
    </text>
  `;
}

function renderCover(spec) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="1600" height="1200" viewBox="0 0 1600 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1600" height="1200" fill="${cream}" />
    <rect x="124" y="118" width="340" height="62" rx="31" fill="#ffffff" stroke="${soft}" />
    <text x="294" y="157" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="5" fill="${black}">
      ${spec.label.toUpperCase()}
    </text>
    <text x="124" y="250" font-family="Arial, sans-serif" font-size="36" font-weight="700" letter-spacing="6" fill="${black}">
      ${spec.badge.toUpperCase()}
    </text>
    ${renderComposition(spec)}
    ${renderSupportBand(spec)}
  </svg>`;
}

function renderSupportBand(spec) {
  return `
    <rect x="140" y="1000" width="1320" height="120" rx="40" fill="#ffffff" stroke="${soft}" />
    ${renderChip(spec.chips[0], 190, 1039, 180)}
    ${renderChip(spec.chips[1], 400, 1039, 180)}
    ${renderChip(spec.chips[2], 610, 1039, 180)}
    <rect x="1090" y="1028" width="230" height="52" rx="26" fill="${orange}" />
    <text x="1205" y="1061" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">
      ${spec.titleMarker}
    </text>
  `;
}
```

- [ ] **Step 2: Implement the three composition families and motif switches**

Extend `E:\Work\Founder-Systems-main-merge\scripts\render-non-financial-thumbnails.mjs`:

```js
function renderComposition(spec) {
  if (spec.composition === 'panel') return renderPanelComposition(spec);
  if (spec.composition === 'flow') return renderFlowComposition(spec);
  return renderSignalComposition(spec);
}

function renderPanelComposition(spec) {
  return `
    <rect x="180" y="330" width="1240" height="560" rx="56" fill="#fffdf9" stroke="${black}" stroke-width="4" />
    <rect x="250" y="410" width="360" height="260" rx="34" fill="#ffffff" stroke="${soft}" />
    <rect x="650" y="410" width="520" height="170" rx="34" fill="#ffffff" stroke="${soft}" />
    <rect x="650" y="610" width="520" height="180" rx="34" fill="#ffffff" stroke="${soft}" />
    <rect x="1210" y="410" width="120" height="380" rx="24" fill="${orange}" opacity="0.92" />
    <path d="M298 470H560" stroke="${black}" stroke-width="4" stroke-linecap="round" />
    <path d="M298 530H520" stroke="${soft}" stroke-width="4" stroke-linecap="round" />
    <path d="M298 590H545" stroke="${soft}" stroke-width="4" stroke-linecap="round" />
    <path d="M702 480H1118" stroke="${black}" stroke-width="4" stroke-linecap="round" />
    <path d="M702 540H1050" stroke="${soft}" stroke-width="4" stroke-linecap="round" />
    <path d="M702 676H1118" stroke="${black}" stroke-width="4" stroke-linecap="round" />
    <path d="M702 736H990" stroke="${soft}" stroke-width="4" stroke-linecap="round" />
  `;
}

function renderFlowComposition(spec) {
  return `
    <rect x="210" y="430" width="260" height="260" rx="40" fill="#ffffff" stroke="${black}" stroke-width="4" />
    <rect x="580" y="330" width="310" height="180" rx="40" fill="#ffffff" stroke="${soft}" />
    <rect x="580" y="610" width="310" height="180" rx="40" fill="#ffffff" stroke="${soft}" />
    <rect x="1010" y="430" width="340" height="260" rx="40" fill="#ffffff" stroke="${black}" stroke-width="4" />
    <path d="M470 560H560" stroke="${black}" stroke-width="6" stroke-linecap="round" />
    <path d="M470 560C525 560 525 420 580 420" stroke="${orange}" stroke-width="6" stroke-linecap="round" />
    <path d="M470 560C525 560 525 700 580 700" stroke="${orange}" stroke-width="6" stroke-linecap="round" />
    <path d="M890 420H970" stroke="${black}" stroke-width="6" stroke-linecap="round" />
    <path d="M890 700H970" stroke="${black}" stroke-width="6" stroke-linecap="round" />
    <circle cx="470" cy="560" r="16" fill="${orange}" stroke="${black}" stroke-width="4" />
    <circle cx="970" cy="420" r="16" fill="#ffffff" stroke="${black}" stroke-width="4" />
    <circle cx="970" cy="700" r="16" fill="#ffffff" stroke="${black}" stroke-width="4" />
  `;
}

function renderSignalComposition(spec) {
  return `
    <rect x="210" y="350" width="420" height="520" rx="48" fill="#ffffff" stroke="${black}" stroke-width="4" />
    <rect x="710" y="350" width="650" height="520" rx="48" fill="#fffdf9" stroke="${black}" stroke-width="4" />
    <rect x="760" y="420" width="250" height="110" rx="28" fill="#ffffff" stroke="${soft}" />
    <rect x="1040" y="420" width="250" height="110" rx="28" fill="${orange}" opacity="0.9" />
    <rect x="760" y="580" width="530" height="90" rx="28" fill="#ffffff" stroke="${soft}" />
    <rect x="760" y="710" width="530" height="90" rx="28" fill="#ffffff" stroke="${soft}" />
    <circle cx="420" cy="540" r="84" fill="#ffffff" stroke="${soft}" />
    <path d="M320 730H520" stroke="${black}" stroke-width="4" stroke-linecap="round" />
    <path d="M320 778H492" stroke="${soft}" stroke-width="4" stroke-linecap="round" />
    <path d="M810 470H930" stroke="${black}" stroke-width="4" stroke-linecap="round" />
    <path d="M810 628H1210" stroke="${black}" stroke-width="4" stroke-linecap="round" />
    <path d="M810 758H1184" stroke="${soft}" stroke-width="4" stroke-linecap="round" />
  `;
}
```

- [ ] **Step 3: Add the batch writer**

Finish `E:\Work\Founder-Systems-main-merge\scripts\render-non-financial-thumbnails.mjs`:

```js
for (const spec of NON_FINANCIAL_THUMBNAIL_SPECS) {
  const productDir = path.join(repoRoot, 'public', 'images', 'products', spec.id);
  mkdirSync(productDir, { recursive: true });
  const outputPath = path.join(productDir, 'thumbnail.svg');
  writeFileSync(outputPath, renderCover(spec), 'utf8');
  console.log(`Generated ${outputPath}`);
}
```

- [ ] **Step 4: Run the generator and inspect output files**

Run: `node E:\Work\Founder-Systems-main-merge\scripts\render-non-financial-thumbnails.mjs`

Expected: PASS with ten `Generated ...thumbnail.svg` lines.

- [ ] **Step 5: Commit**

```bash
git add E:/Work/Founder-Systems-main-merge/scripts/thumbnail-product-specs.mjs E:/Work/Founder-Systems-main-merge/scripts/render-non-financial-thumbnails.mjs E:/Work/Founder-Systems-main-merge/public/images/products
git commit -m "feat: generate non-financial thumbnail cover system"
```

### Task 3: Repoint catalog and product-detail metadata to the new covers

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\index.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\founder-spec-generator.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\founder-outreach-kit.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\founder-pdf-summarizer.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\founder-update-generator.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\linkedin-candidate-screener.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\founder-command-center.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\marketing-agent.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\finance-agent.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\ops-agent.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\promptdeck-ai.json`

- [ ] **Step 1: Update the catalog thumbnails**

Modify the non-financial entries in `E:\Work\Founder-Systems-main-merge\public\product-data\index.json`:

```json
{
  "id": "founder-spec-generator",
  "thumbnail": "/images/products/founder-spec-generator/thumbnail.svg"
},
{
  "id": "founder-outreach-kit",
  "thumbnail": "/images/products/founder-outreach-kit/thumbnail.svg"
},
{
  "id": "founder-pdf-summarizer",
  "thumbnail": "/images/products/founder-pdf-summarizer/thumbnail.svg"
},
{
  "id": "founder-update-generator",
  "thumbnail": "/images/products/founder-update-generator/thumbnail.svg"
},
{
  "id": "linkedin-candidate-screener",
  "thumbnail": "/images/products/linkedin-candidate-screener/thumbnail.svg"
},
{
  "id": "founder-command-center",
  "thumbnail": "/images/products/founder-command-center/thumbnail.svg"
},
{
  "id": "marketing-agent",
  "thumbnail": "/images/products/marketing-agent/thumbnail.svg"
},
{
  "id": "finance-agent",
  "thumbnail": "/images/products/finance-agent/thumbnail.svg"
},
{
  "id": "ops-agent",
  "thumbnail": "/images/products/ops-agent/thumbnail.svg"
},
{
  "id": "promptdeck-ai",
  "thumbnail": "/images/products/promptdeck-ai/thumbnail.svg"
}
```

- [ ] **Step 2: Add the new cover first in detail-page media arrays**

Update the product detail JSON files so the new cover is first, while keeping real previews after it where useful:

```json
{
  "slug": "founder-spec-generator",
  "images": [
    "/images/products/founder-spec-generator/thumbnail.svg",
    "/images/products/founder-spec-generator/preview-1.png",
    "/images/products/founder-spec-generator/preview-2.png",
    "/images/products/founder-spec-generator/preview-3.png"
  ]
}
```

```json
{
  "slug": "founder-outreach-kit",
  "images": [
    "/images/products/founder-outreach-kit/thumbnail.svg",
    "/images/products/founder-outreach-kit/preview-1.png",
    "/images/products/founder-outreach-kit/preview-2.png",
    "/images/products/founder-outreach-kit/preview-3.png",
    "/images/products/founder-outreach-kit/preview-4.png"
  ]
}
```

```json
{
  "id": "promptdeck-ai",
  "images": [
    "/images/products/promptdeck-ai/thumbnail.svg",
    "/images/products/promptdeck-ai/preview-1.png",
    "/images/products/promptdeck-ai/preview-2.png",
    "/images/products/promptdeck-ai/preview-3.png",
    "/images/products/promptdeck-ai/preview-4.png"
  ]
}
```

For products with no preview gallery yet, add a single-item `images` array:

```json
{
  "slug": "founder-update-generator",
  "images": [
    "/images/products/founder-update-generator/thumbnail.svg"
  ]
}
```

- [ ] **Step 3: Remove the last generic fallback references from the target batch**

Make sure these paths are no longer used by the ten target product JSON files:

```txt
/images/strategy.png
/images/systems.png
/images/finance.png
```

- [ ] **Step 4: Run verification to confirm metadata now passes**

Run: `node E:\Work\Founder-Systems-main-merge\scripts\verify-non-financial-thumbnails.mjs`

Expected: PASS with `Non-financial thumbnail verification passed.`

- [ ] **Step 5: Commit**

```bash
git add E:/Work/Founder-Systems-main-merge/public/product-data/index.json E:/Work/Founder-Systems-main-merge/public/product-data/founder-spec-generator.json E:/Work/Founder-Systems-main-merge/public/product-data/founder-outreach-kit.json E:/Work/Founder-Systems-main-merge/public/product-data/founder-pdf-summarizer.json E:/Work/Founder-Systems-main-merge/public/product-data/founder-update-generator.json E:/Work/Founder-Systems-main-merge/public/product-data/linkedin-candidate-screener.json E:/Work/Founder-Systems-main-merge/public/product-data/founder-command-center.json E:/Work/Founder-Systems-main-merge/public/product-data/marketing-agent.json E:/Work/Founder-Systems-main-merge/public/product-data/finance-agent.json E:/Work/Founder-Systems-main-merge/public/product-data/ops-agent.json E:/Work/Founder-Systems-main-merge/public/product-data/promptdeck-ai.json
git commit -m "feat: repoint non-financial products to generated covers"
```

### Task 4: Remove screenshot-led card behavior and align catalog/detail rendering

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\src\components\ProductCard.jsx`
- Modify: `E:\Work\Founder-Systems-main-merge\src\pages\ProductDetail.jsx`

- [ ] **Step 1: Write the minimal card rendering change**

Update `E:\Work\Founder-Systems-main-merge\src\components\ProductCard.jsx` so the ten target products are no longer treated as screenshot-led:

```jsx
const SCREENSHOT_LED_PRODUCTS = new Set([]);

const ProductCard = ({ id, thumbnail, isComingSoon, category, name, description, priceUsd, priceInr, creditPrice, isBundle }) => {
  const artDirection = PRODUCT_ART_DIRECTION[id] || FALLBACK_ART_DIRECTION;
  const chips = artDirection.chips?.slice(0, 3) || [];

  return (
    <div className="card-elevated group flex flex-col overflow-hidden bg-white">
      <Link to={`/products/${id}`} className="relative block aspect-[4/3] w-full overflow-hidden border-b-2 border-brand-black bg-brand-black">
        <img
          src={thumbnail}
          alt={name}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02] ${isComingSoon ? 'grayscale-[0.2] opacity-85' : ''}`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.05)_48%,rgba(15,23,42,0.12)_100%)]" />
        {chips.length > 0 ? (
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="inline-flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full border-2 border-brand-black bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Link>
    </div>
  );
};
```

- [ ] **Step 2: Update detail gallery fallback rules**

Adjust `E:\Work\Founder-Systems-main-merge\src\pages\ProductDetail.jsx` so old generic art remains blocked but the new SVG covers are allowed into the gallery:

```jsx
const NON_PRODUCT_GALLERY_IMAGES = new Set([
  '/images/hero.png',
  '/images/strategy.png',
  '/images/systems.png',
  '/images/finance.png',
]);

const galleryImages = Array.from(
  new Set(
    (product?.images || [])
      .filter(Boolean)
      .filter((imagePath) => !NON_PRODUCT_GALLERY_IMAGES.has(imagePath))
  )
);
```

- [ ] **Step 3: Run the targeted verification command**

Run: `node E:\Work\Founder-Systems-main-merge\scripts\verify-non-financial-thumbnails.mjs`

Expected: PASS, with no blocked generic paths left in the target batch.

- [ ] **Step 4: Run the full app build**

Run: `npm.cmd run build`

Expected: PASS, with the product catalog and detail pages compiling successfully against the new SVG assets.

- [ ] **Step 5: Commit**

```bash
git add E:/Work/Founder-Systems-main-merge/src/components/ProductCard.jsx E:/Work/Founder-Systems-main-merge/src/pages/ProductDetail.jsx
git commit -m "style: align product cards with new non-financial covers"
```

### Task 5: Visual verification and cleanup pass

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\index.json`
- Modify: `E:\Work\Founder-Systems-main-merge\public\product-data\*.json` as needed
- Modify: `E:\Work\Founder-Systems-main-merge\scripts\thumbnail-product-specs.mjs` as needed
- Modify: `E:\Work\Founder-Systems-main-merge\scripts\render-non-financial-thumbnails.mjs` as needed

- [ ] **Step 1: Start the local preview**

Run: `npm.cmd run dev`

Expected: Vite dev server starts successfully on the local preview URL.

- [ ] **Step 2: Check the catalog grid visually**

Open and inspect:

```txt
http://localhost:4173/products
```

Expected:
- all ten target products use custom diagram covers
- no target still looks like a reused generic fallback
- cover crops look centered at card size
- the grid feels like one family rather than a mixed asset pile

- [ ] **Step 3: Check representative detail pages visually**

Open and inspect:

```txt
http://localhost:4173/products/founder-spec-generator
http://localhost:4173/products/founder-pdf-summarizer
http://localhost:4173/products/founder-command-center
http://localhost:4173/products/promptdeck-ai
```

Expected:
- the new cover appears as the first media item
- previews still appear after the cover where the product has real screenshots
- no generic `strategy.png`, `systems.png`, or `finance.png` appears in the gallery

- [ ] **Step 4: Make one final generator/config polish pass if needed**

If any cover feels too similar or crops poorly, adjust only the generator/spec values in:

```js
export const NON_FINANCIAL_THUMBNAIL_SPECS = [
  {
    id: 'founder-command-center',
    badge: 'Control Layer',
    titleMarker: 'One connected snapshot',
    chips: ['Health', 'Actions', 'Sync'],
  }
];
```

Then rerun:

```bash
node E:\Work\Founder-Systems-main-merge\scripts\render-non-financial-thumbnails.mjs
node E:\Work\Founder-Systems-main-merge\scripts\verify-non-financial-thumbnails.mjs
npm.cmd run build
```

- [ ] **Step 5: Commit**

```bash
git add E:/Work/Founder-Systems-main-merge/scripts/thumbnail-product-specs.mjs E:/Work/Founder-Systems-main-merge/scripts/render-non-financial-thumbnails.mjs E:/Work/Founder-Systems-main-merge/public/images/products E:/Work/Founder-Systems-main-merge/public/product-data E:/Work/Founder-Systems-main-merge/src/components/ProductCard.jsx E:/Work/Founder-Systems-main-merge/src/pages/ProductDetail.jsx
git commit -m "feat: refresh non-financial product thumbnails"
```

## Self-Review

### Spec coverage
- Unified diagram-led cover system: covered by Tasks 1 and 2.
- Ten-product non-financial batch: covered by Tasks 2 and 3.
- Replace generic fallback usage: covered by Tasks 1, 3, and 4.
- Product catalog and detail-page coverage: covered by Tasks 3, 4, and 5.
- Consistent rollout instead of a half-state: enforced by Task 1 verification and Task 5 visual review.

### Placeholder scan
- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Every task has explicit file paths, commands, and code snippets.
- The verification commands are concrete and tied to expected outcomes.

### Type consistency
- Product ids match `public/product-data/index.json`.
- Generated asset naming is consistently `public/images/products/<slug>/thumbnail.svg`.
- The verification script expects the same naming convention the generator writes.

## Notes for the Implementer

- Do not touch the four financial product thumbnails in this pass.
- Do not touch guide covers in this pass.
- Keep the new covers text-light. Let the page title explain the product.
- If one product still needs real UI proof, keep screenshots in its `images` array after the cover instead of using a screenshot as the catalog thumbnail.

