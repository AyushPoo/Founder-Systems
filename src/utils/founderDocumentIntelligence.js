import {
  DEFAULT_PDF_SUMMARY_MODE,
  PDF_SUMMARY_MODES,
  resolveFounderPdfSummaryApiConfig,
} from './founderPdfSummary.js';
import {
  FOUNDER_FINANCING_DOCUMENT_TYPES,
  SAFE_EXPLAINER_MODES,
  isFounderFinancingDocumentType,
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

const FINANCING_MODE_IDS = new Set(FOUNDER_FINANCING_DOCUMENT_TYPES);

const DOCUMENT_TYPE_TO_SUMMARY_MODE = {
  'pitch-deck': 'pitch-deck',
  'investor-memo': 'investor-memo',
  'grant-document': 'grant-doc',
  'market-report': 'market-report',
  'annual-report': 'annual-report',
  'financial-statement': 'financial-statement',
  'strategy-doc': 'general',
  'ops-doc': 'general',
  contract: 'general',
  'general-founder-doc': 'general',
};

export function getDocumentIntelligenceModeLabel(modeId) {
  return MODE_LABELS.get(modeId) || 'Founder lens';
}

export function isFinancingDocumentMode(modeId) {
  return isFounderFinancingDocumentType(modeId);
}

export function isWorkspaceDocumentSetMode(fileCount = 0) {
  return Number(fileCount) > 1;
}

function cleanText(value) {
  return String(value || '').trim();
}

function getLowerFilename(input = {}) {
  return cleanText(input.filename).toLowerCase();
}

function getLowerMimeType(input = {}) {
  return cleanText(input.mimeType).toLowerCase();
}

function hasSpreadsheetMime(mimeType) {
  return (
    mimeType.includes('spreadsheetml') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv' ||
    mimeType === 'application/csv' ||
    mimeType === 'text/tab-separated-values'
  );
}

export function classifyFounderDocumentType(input = {}) {
  const filename = getLowerFilename(input);
  const mimeType = getLowerMimeType(input);

  if (/(^|[\s._-])safe([\s._-]|$)/i.test(filename)) {
    return 'safe';
  }

  if (/term[\s._-]?sheet/i.test(filename)) {
    return 'term-sheet';
  }

  if (/convertible[\s._-]?note|bridge[\s._-]?note|promissory[\s._-]?note/i.test(filename)) {
    return 'convertible-note';
  }

  if (/annual[\s._-]?report|10-k|10q|audited/i.test(filename)) {
    return 'annual-report';
  }

  if (/financial|p&l|cash[\s._-]?flow|balance[\s._-]?sheet|board[\s._-]?model|metrics/i.test(filename)) {
    return 'financial-statement';
  }

  if (hasSpreadsheetMime(mimeType) || /\.(xlsx|xls|csv|tsv)$/i.test(filename)) {
    return 'financial-statement';
  }

  if (/pitch[\s._-]?deck|deck|fundraise/i.test(filename) || /\.(ppt|pptx)$/i.test(filename)) {
    return 'pitch-deck';
  }

  if (/memo|investment[\s._-]?note|investment[\s._-]?brief/i.test(filename)) {
    return 'investor-memo';
  }

  if (/grant|rfp|proposal/i.test(filename)) {
    return 'grant-document';
  }

  if (/market[\s._-]?report|industry[\s._-]?report|research[\s._-]?report/i.test(filename)) {
    return 'market-report';
  }

  if (/agreement|contract|msa|nda|sow|order[\s._-]?form/i.test(filename)) {
    return 'contract';
  }

  if (/strategy|roadmap|plan/i.test(filename)) {
    return 'strategy-doc';
  }

  if (/ops|operating|hiring|playbook|process/i.test(filename)) {
    return 'ops-doc';
  }

  return 'general-founder-doc';
}

export function mapDocumentTypeToSummaryMode(documentType) {
  const normalizedType = cleanText(documentType).toLowerCase();
  return DOCUMENT_TYPE_TO_SUMMARY_MODE[normalizedType] || 'general';
}

export function getDocumentIntelligenceApiConfig({
  mode,
  env = {},
  hostname = '',
  fileCount = 1,
} = {}) {
  if (isWorkspaceDocumentSetMode(fileCount)) {
    return resolveFounderPdfSummaryApiConfig({ env, hostname });
  }

  return FINANCING_MODE_IDS.has(cleanText(mode).toLowerCase())
    ? resolveFounderSafeExplainerApiConfig({ env, hostname })
    : resolveFounderPdfSummaryApiConfig({ env, hostname });
}
