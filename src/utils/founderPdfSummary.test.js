import assert from 'assert';
import { Buffer } from 'node:buffer';
import {
  ACCEPTED_DOCUMENT_EXTENSIONS,
  ACCEPTED_DOCUMENT_MIME_TYPES,
  DEFAULT_PDF_SUMMARY_MODE,
  PDF_SUMMARY_MODES,
  MAX_PDF_SIZE_BYTES,
  buildFounderPdfSummaryMarkdown,
  createFounderPdfSummaryDraft,
  derivePdfFileSizeFromDataUrl,
  getFounderPdfSummaryModeLabel,
  normalizeFounderPdfSummaryRequest,
  normalizeFounderPdfSummaryResponse,
  resolveFounderPdfSummaryApiConfig,
  validateFounderPdfSummaryRequest,
} from './founderPdfSummary.js';

function createPdfDataUrl(byteLength) {
  return `data:application/pdf;base64,${Buffer.alloc(byteLength).toString('base64')}`;
}

const draft = createFounderPdfSummaryDraft();
assert.equal(draft.mode, DEFAULT_PDF_SUMMARY_MODE);
assert.equal(draft.focus, '');
assert.equal(draft.filename, '');

assert.equal(Array.isArray(PDF_SUMMARY_MODES), true);
assert.equal(PDF_SUMMARY_MODES.some((mode) => mode.id === 'auto'), true);
assert.equal(PDF_SUMMARY_MODES.some((mode) => mode.id === 'pitch-deck'), true);
assert.equal(PDF_SUMMARY_MODES.some((mode) => mode.id === 'annual-report'), true);
assert.equal(PDF_SUMMARY_MODES.some((mode) => mode.id === 'financial-statement'), true);
assert.equal(MAX_PDF_SIZE_BYTES, Math.round(3.25 * 1024 * 1024));
assert.equal(getFounderPdfSummaryModeLabel('pitch-deck'), 'Pitch deck');
assert.equal(ACCEPTED_DOCUMENT_EXTENSIONS.includes('.xlsx'), true);
assert.equal(
  ACCEPTED_DOCUMENT_MIME_TYPES.includes(
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ),
  true
);

const normalized = normalizeFounderPdfSummaryRequest({
  filename: 'deck.pdf',
  mimeType: 'application/pdf',
  fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
  fileSize: 1024,
  mode: 'pitch-deck',
  focus: 'Focus on market clarity',
});

assert.equal(normalized.filename, 'deck.pdf');
assert.equal(normalized.mimeType, 'application/pdf');
assert.equal(normalized.mode, 'pitch-deck');
assert.equal(normalized.focus, 'Focus on market clarity');

const xlsxNormalized = normalizeFounderPdfSummaryRequest({
  filename: 'board-metrics.xlsx',
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  fileData:
    'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,QUJDRA==',
  fileSize: 1024,
  mode: 'financial-statement',
  focus: 'Explain margin movement',
});

assert.equal(xlsxNormalized.mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
assert.equal(xlsxNormalized.mode, 'financial-statement');

const invalidModeNormalized = normalizeFounderPdfSummaryRequest({
  filename: 'memo.pdf',
  mimeType: 'application/pdf',
  fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
  fileSize: 512,
  mode: 'wrong-mode',
});

assert.equal(invalidModeNormalized.mode, DEFAULT_PDF_SUMMARY_MODE);

const negativeFileSizeNormalized = normalizeFounderPdfSummaryRequest({
  filename: 'notes.pdf',
  mimeType: 'application/pdf',
  fileData: '',
  fileSize: -42,
  mode: 'general',
});

assert.equal(negativeFileSizeNormalized.fileSize, 0);

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

assert.equal(oversized.isValid, true);
assert.equal(oversized.normalized.fileSize, 9);

const oversizedViaPayload = validateFounderPdfSummaryRequest({
  filename: 'payload-large.pdf',
  mimeType: 'application/pdf',
  fileData: createPdfDataUrl(MAX_PDF_SIZE_BYTES + 1),
  fileSize: 1,
  mode: 'general',
  focus: '',
});

assert.equal(oversizedViaPayload.isValid, false);
assert.match(oversizedViaPayload.error, /smaller than/i);

const validPptxPayload = validateFounderPdfSummaryRequest({
  filename: 'investor-update.pptx',
  mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  fileData:
    'data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,QUJDRA==',
  fileSize: 4,
  mode: 'investor-memo',
  focus: '',
});

assert.equal(validPptxPayload.isValid, true);

const invalidPdfPayload = validateFounderPdfSummaryRequest({
  filename: 'fake.pdf',
  mimeType: 'application/pdf',
  fileData: 'data:text/plain;base64,SGVsbG8=',
  fileSize: 8,
  mode: 'general',
  focus: '',
});

assert.equal(invalidPdfPayload.isValid, false);
assert.match(invalidPdfPayload.error, /valid|supported|document/i);

assert.equal(
  derivePdfFileSizeFromDataUrl(createPdfDataUrl(3210)),
  3210
);

const localDevApiConfig = resolveFounderPdfSummaryApiConfig({
  env: { DEV: true },
  hostname: 'localhost',
});

assert.equal(localDevApiConfig.apiUrl, '/api/founder-pdf-summarize');
assert.match(localDevApiConfig.localDevMessage, /VITE_FOUNDER_PDF_SUMMARY_API_URL/i);

const overrideApiConfig = resolveFounderPdfSummaryApiConfig({
  env: {
    DEV: true,
    VITE_FOUNDER_PDF_SUMMARY_API_URL: 'http://127.0.0.1:8787/api/founder-pdf-summarize',
  },
  hostname: 'localhost',
});

assert.equal(
  overrideApiConfig.apiUrl,
  'http://127.0.0.1:8787/api/founder-pdf-summarize'
);
assert.equal(overrideApiConfig.localDevMessage, '');

const normalizedResponse = normalizeFounderPdfSummaryResponse({
  documentType: 'pitch deck',
  title: 'Seed deck summary',
  mode: 'pitch-deck',
  executiveSummary: 'The deck is clear on the problem but weak on proof.',
  keyTakeaways: ['Problem is clear', 'Traction proof is thin'],
  riskFlags: ['Traction slide lacks hard numbers'],
  focusAreas: ['Verify whether retention claims are backed by cohort data.'],
  nextQuestions: ['What retention evidence exists?'],
  extractionQuality: {
    label: 'mixed',
    notes: ['Several pages were image-heavy.'],
  },
});

assert.equal(normalizedResponse.ok, true);
assert.equal(normalizedResponse.mode, 'pitch-deck');
assert.equal(normalizedResponse.keyTakeaways.length, 2);
assert.equal(normalizedResponse.focusAreas.length, 1);
assert.equal(normalizedResponse.extractionQuality.label, 'mixed');

const annualReportResponse = normalizeFounderPdfSummaryResponse({
  documentType: 'Annual report',
  title: 'FY25 annual report',
  mode: 'annual-report',
  executiveSummary: 'Growth remained solid, but cash conversion and leverage need closer inspection.',
  keyTakeaways: ['Revenue grew 22% year over year'],
  riskFlags: ['Receivables expanded faster than revenue'],
  focusAreas: ['Check whether operating cash flow is lagging earnings quality.'],
  nextQuestions: ['What drove the jump in receivables?'],
  keyMetrics: [
    {
      label: 'Revenue growth',
      value: '22%',
      note: 'Reported year over year increase.',
    },
  ],
  breakdownSections: [
    {
      title: 'Financial performance',
      summary: 'Revenue rose, but margin expansion did not fully follow.',
      focusPoints: ['Separate pricing gains from mix shifts.'],
    },
  ],
  extractionQuality: {
    label: 'high',
    notes: ['The report was machine-readable.'],
  },
});

assert.equal(annualReportResponse.ok, true);
assert.equal(annualReportResponse.keyMetrics.length, 1);
assert.equal(annualReportResponse.breakdownSections.length, 1);
assert.equal(annualReportResponse.breakdownSections[0].title, 'Financial performance');

const markdown = buildFounderPdfSummaryMarkdown({
  filename: 'seed-deck.pdf',
  summary: normalizedResponse,
});

assert.match(markdown, /^# Founder PDF Summary: seed-deck\.pdf/m);
assert.match(markdown, /## Executive Summary/m);
assert.match(markdown, /## Key Takeaways/m);
assert.match(markdown, /## What To Focus On/m);
assert.match(markdown, /\*\*Mode:\*\* Pitch deck/m);

const annualReportMarkdown = buildFounderPdfSummaryMarkdown({
  filename: 'fy25-annual-report.pdf',
  summary: annualReportResponse,
});

assert.match(annualReportMarkdown, /## Key Metrics/m);
assert.match(annualReportMarkdown, /## Important Sections/m);
assert.match(annualReportMarkdown, /### Financial performance/m);

console.log('founderPdfSummary tests passed');
