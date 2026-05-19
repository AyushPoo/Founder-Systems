import {
  DEFAULT_PDF_SUMMARY_MODE,
  PDF_SUMMARY_MODES,
  resolveFounderPdfSummaryApiConfig,
} from './founderPdfSummary.js';
import {
  SAFE_EXPLAINER_MODES,
  resolveFounderSafeExplainerApiConfig,
} from './founderSafeExplainer.js';

export const DEFAULT_DOCUMENT_INTELLIGENCE_MODE = DEFAULT_PDF_SUMMARY_MODE;

export const DOCUMENT_INTELLIGENCE_MODES = [
  ...PDF_SUMMARY_MODES,
  ...SAFE_EXPLAINER_MODES.filter((mode) => mode.id !== DEFAULT_PDF_SUMMARY_MODE),
];

const MODE_LABELS = new Map(
  DOCUMENT_INTELLIGENCE_MODES.map((mode) => [mode.id, mode.label])
);

const FINANCING_MODE_IDS = new Set(
  SAFE_EXPLAINER_MODES.filter((mode) => mode.id !== DEFAULT_PDF_SUMMARY_MODE).map((mode) => mode.id)
);

export function getDocumentIntelligenceModeLabel(modeId) {
  return MODE_LABELS.get(modeId) || 'Founder lens';
}

export function isFinancingDocumentMode(modeId) {
  return FINANCING_MODE_IDS.has(String(modeId || '').trim().toLowerCase());
}

export function getDocumentIntelligenceApiConfig({ mode, env = {}, hostname = '' } = {}) {
  return isFinancingDocumentMode(mode)
    ? resolveFounderSafeExplainerApiConfig({ env, hostname })
    : resolveFounderPdfSummaryApiConfig({ env, hostname });
}
