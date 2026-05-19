import assert from 'assert';
import {
  DEFAULT_DOCUMENT_INTELLIGENCE_MODE,
  DOCUMENT_INTELLIGENCE_MODES,
  getDocumentIntelligenceApiConfig,
  getDocumentIntelligenceModeLabel,
  isFinancingDocumentMode,
} from './founderDocumentIntelligence.js';

assert.equal(DEFAULT_DOCUMENT_INTELLIGENCE_MODE, 'auto');
assert.equal(Array.isArray(DOCUMENT_INTELLIGENCE_MODES), true);
assert.equal(DOCUMENT_INTELLIGENCE_MODES.some((mode) => mode.id === 'safe'), true);
assert.equal(DOCUMENT_INTELLIGENCE_MODES.some((mode) => mode.id === 'term-sheet'), true);
assert.equal(getDocumentIntelligenceModeLabel('safe'), 'SAFE');
assert.equal(isFinancingDocumentMode('safe'), true);
assert.equal(isFinancingDocumentMode('term-sheet'), true);
assert.equal(isFinancingDocumentMode('pitch-deck'), false);

const standardConfig = getDocumentIntelligenceApiConfig({
  mode: 'pitch-deck',
  env: { DEV: true },
  hostname: 'localhost',
});

assert.equal(standardConfig.apiUrl, '/api/founder-pdf-summarize');
assert.match(standardConfig.localDevMessage, /VITE_FOUNDER_PDF_SUMMARY_API_URL/i);

const financingConfig = getDocumentIntelligenceApiConfig({
  mode: 'safe',
  env: { DEV: true },
  hostname: 'localhost',
});

assert.equal(financingConfig.apiUrl, '/api/founder-safe-explainer');
assert.match(financingConfig.localDevMessage, /VITE_FOUNDER_SAFE_EXPLAINER_API_URL/i);

const financingOverrideConfig = getDocumentIntelligenceApiConfig({
  mode: 'term-sheet',
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

console.log('founderDocumentIntelligence tests passed');
