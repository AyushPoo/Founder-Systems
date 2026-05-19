import assert from 'assert';
import {
  DEFAULT_DOCUMENT_INTELLIGENCE_MODE,
  DOCUMENT_INTELLIGENCE_MODES,
  classifyFounderDocumentType,
  getDocumentIntelligenceApiConfig,
  getDocumentIntelligenceModeLabel,
  isFinancingDocumentMode,
  isWorkspaceDocumentSetMode,
  mapDocumentTypeToSummaryMode,
} from './founderDocumentIntelligence.js';

assert.equal(DEFAULT_DOCUMENT_INTELLIGENCE_MODE, 'auto');
assert.equal(Array.isArray(DOCUMENT_INTELLIGENCE_MODES), true);
assert.equal(DOCUMENT_INTELLIGENCE_MODES.some((mode) => mode.id === 'safe'), true);
assert.equal(DOCUMENT_INTELLIGENCE_MODES.some((mode) => mode.id === 'term-sheet'), true);
assert.equal(getDocumentIntelligenceModeLabel('safe'), 'SAFE');
assert.equal(isFinancingDocumentMode('safe'), true);
assert.equal(isFinancingDocumentMode('term-sheet'), true);
assert.equal(isFinancingDocumentMode('pitch-deck'), false);
assert.equal(isWorkspaceDocumentSetMode(1), false);
assert.equal(isWorkspaceDocumentSetMode(2), true);
assert.equal(classifyFounderDocumentType({ filename: 'seed-safe.pdf', mimeType: 'application/pdf' }), 'safe');
assert.equal(
  classifyFounderDocumentType({
    filename: 'board-model.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }),
  'financial-statement'
);
assert.equal(
  classifyFounderDocumentType({
    filename: 'series-a-term-sheet.pdf',
    mimeType: 'application/pdf',
  }),
  'term-sheet'
);
assert.equal(
  classifyFounderDocumentType({
    filename: 'investor-deck.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }),
  'pitch-deck'
);
assert.equal(mapDocumentTypeToSummaryMode('pitch-deck'), 'pitch-deck');
assert.equal(mapDocumentTypeToSummaryMode('annual-report'), 'annual-report');
assert.equal(mapDocumentTypeToSummaryMode('safe'), 'general');

const standardConfig = getDocumentIntelligenceApiConfig({
  mode: 'pitch-deck',
  fileCount: 1,
  env: { DEV: true },
  hostname: 'localhost',
});

assert.equal(standardConfig.apiUrl, '/api/founder-pdf-summarize');
assert.match(standardConfig.localDevMessage, /VITE_FOUNDER_PDF_SUMMARY_API_URL/i);

const financingConfig = getDocumentIntelligenceApiConfig({
  mode: 'safe',
  fileCount: 1,
  env: { DEV: true },
  hostname: 'localhost',
});

assert.equal(financingConfig.apiUrl, '/api/founder-safe-explainer');
assert.match(financingConfig.localDevMessage, /VITE_FOUNDER_SAFE_EXPLAINER_API_URL/i);

const financingOverrideConfig = getDocumentIntelligenceApiConfig({
  mode: 'term-sheet',
  fileCount: 1,
  env: {
    DEV: true,
    VITE_FOUNDER_SAFE_EXPLAINER_API_URL: 'http://127.0.0.1:8787/api/founder-safe-explainer',
  },
  hostname: 'localhost',
});

assert.equal(
  financingOverrideConfig.apiUrl,
  'http://127.0.0.1:8787/api/founder-safe-explainer'
);
assert.equal(financingOverrideConfig.localDevMessage, '');

const workspaceConfig = getDocumentIntelligenceApiConfig({
  mode: 'safe',
  fileCount: 3,
  env: { DEV: true },
  hostname: 'localhost',
});

assert.equal(workspaceConfig.apiUrl, '/api/founder-pdf-summarize');
assert.match(workspaceConfig.localDevMessage, /VITE_FOUNDER_PDF_SUMMARY_API_URL/i);

console.log('founderDocumentIntelligence tests passed');
