import assert from 'assert';
import { Buffer } from 'node:buffer';
import {
  DEFAULT_SAFE_EXPLAINER_MODE,
  MAX_SAFE_EXPLAINER_PDF_SIZE_BYTES,
  SAFE_EXPLAINER_MODES,
  buildFounderSafeExplainerMarkdown,
  createFounderSafeExplainerDraft,
  deriveSafeExplainerFileSizeFromDataUrl,
  getFounderSafeExplainerModeLabel,
  normalizeFounderSafeExplainerRequest,
  normalizeFounderSafeExplainerResponse,
  resolveFounderSafeExplainerApiConfig,
  validateFounderSafeExplainerRequest,
} from './founderSafeExplainer.js';

function createPdfDataUrl(byteLength) {
  return `data:application/pdf;base64,${Buffer.alloc(byteLength).toString('base64')}`;
}

const draft = createFounderSafeExplainerDraft();
assert.equal(draft.mode, DEFAULT_SAFE_EXPLAINER_MODE);
assert.equal(draft.roundContext, '');
assert.equal(draft.focus, '');

assert.equal(Array.isArray(SAFE_EXPLAINER_MODES), true);
assert.equal(SAFE_EXPLAINER_MODES.some((mode) => mode.id === 'auto'), true);
assert.equal(SAFE_EXPLAINER_MODES.some((mode) => mode.id === 'safe'), true);
assert.equal(MAX_SAFE_EXPLAINER_PDF_SIZE_BYTES, Math.round(3.25 * 1024 * 1024));
assert.equal(getFounderSafeExplainerModeLabel('term-sheet'), 'Term sheet');

const normalized = normalizeFounderSafeExplainerRequest({
  filename: 'seed-safe.pdf',
  mimeType: 'application/pdf',
  fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
  fileSize: 1024,
  mode: 'safe',
  roundContext: 'Pre-seed extension',
  focus: 'Flag anything founder-unfriendly',
});

assert.equal(normalized.filename, 'seed-safe.pdf');
assert.equal(normalized.mode, 'safe');
assert.equal(normalized.roundContext, 'Pre-seed extension');
assert.equal(normalized.focus, 'Flag anything founder-unfriendly');

const invalidModeNormalized = normalizeFounderSafeExplainerRequest({
  filename: 'term-sheet.pdf',
  mimeType: 'application/pdf',
  fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
  fileSize: 512,
  mode: 'weird-mode',
});

assert.equal(invalidModeNormalized.mode, DEFAULT_SAFE_EXPLAINER_MODE);

const missingFile = validateFounderSafeExplainerRequest({
  filename: '',
  mimeType: '',
  fileData: '',
  fileSize: 0,
  mode: 'safe',
});

assert.equal(missingFile.isValid, false);
assert.match(missingFile.missing.join(', '), /filename/i);

const oversized = validateFounderSafeExplainerRequest({
  filename: 'large.pdf',
  mimeType: 'application/pdf',
  fileData: createPdfDataUrl(MAX_SAFE_EXPLAINER_PDF_SIZE_BYTES + 1),
  fileSize: 1,
  mode: 'safe',
});

assert.equal(oversized.isValid, false);
assert.match(oversized.error, /smaller than/i);

const invalidPdfPayload = validateFounderSafeExplainerRequest({
  filename: 'fake.pdf',
  mimeType: 'application/pdf',
  fileData: 'data:text/plain;base64,SGVsbG8=',
  fileSize: 8,
  mode: 'safe',
});

assert.equal(invalidPdfPayload.isValid, false);
assert.match(invalidPdfPayload.error, /pdf/i);

assert.equal(
  deriveSafeExplainerFileSizeFromDataUrl(createPdfDataUrl(3210)),
  3210
);

const localDevApiConfig = resolveFounderSafeExplainerApiConfig({
  env: { DEV: true },
  hostname: 'localhost',
});

assert.equal(localDevApiConfig.apiUrl, '/api/founder-safe-explainer');
assert.match(localDevApiConfig.localDevMessage, /VITE_FOUNDER_SAFE_EXPLAINER_API_URL/i);

const normalizedResponse = normalizeFounderSafeExplainerResponse({
  documentType: 'SAFE',
  title: 'Seed SAFE explainer',
  mode: 'safe',
  summary: 'This SAFE is straightforward on economics but leaves control side letters unclear.',
  clauseHighlights: [
    {
      clause: 'Valuation cap',
      value: '$8M',
      explanation: 'The SAFE converts at no more than an $8M company valuation.',
      founderImpact: 'This cap shapes how much dilution founders can face at conversion.',
    },
  ],
  founderWatchouts: ['MFN language could let later investor terms flow back into this SAFE.'],
  unusualClauses: ['A board observer right appears alongside an otherwise standard SAFE.'],
  counselQuestions: ['Does the board observer right survive after the priced round?'],
  extractionQuality: {
    label: 'high',
    notes: ['The PDF text was machine-readable.'],
  },
});

assert.equal(normalizedResponse.ok, true);
assert.equal(normalizedResponse.mode, 'safe');
assert.equal(normalizedResponse.clauseHighlights.length, 1);
assert.equal(normalizedResponse.clauseHighlights[0].clause, 'Valuation cap');
assert.match(normalizedResponse.disclaimer, /not legal advice/i);

const markdown = buildFounderSafeExplainerMarkdown({
  filename: 'seed-safe.pdf',
  analysis: normalizedResponse,
});

assert.match(markdown, /^# SAFE \/ Term Sheet Explainer: seed-safe\.pdf/m);
assert.match(markdown, /## Plain-English Summary/m);
assert.match(markdown, /## Clause Highlights/m);
assert.match(markdown, /\*\*Mode:\*\* SAFE/m);
assert.match(markdown, /## Lawyer Discussion Checklist/m);

console.log('founderSafeExplainer tests passed');
