export const MAX_SAFE_EXPLAINER_PDF_SIZE_BYTES = Math.round(3.25 * 1024 * 1024);
export const DEFAULT_SAFE_EXPLAINER_MODE = 'auto';
export const SAFE_EXPLAINER_DISCLAIMER =
  'Educational only. This is not legal advice and should not replace review by qualified counsel.';

export const SAFE_EXPLAINER_MODES = [
  {
    id: 'auto',
    label: 'Auto-detect',
    description:
      'Read the financing PDF first, infer the closest lens, and explain it using the right founder context.',
  },
  {
    id: 'safe',
    label: 'SAFE',
    description: 'Focus on cap, discount, MFN, pro rata, side letters, and founder-sensitive terms.',
  },
  {
    id: 'term-sheet',
    label: 'Term sheet',
    description:
      'Focus on economics, liquidation preference, governance, protective provisions, and founder control.',
  },
  {
    id: 'convertible-note',
    label: 'Convertible note',
    description:
      'Focus on maturity, interest, conversion mechanics, security, and founder obligations.',
  },
];

const VALID_MODES = new Set(SAFE_EXPLAINER_MODES.map((mode) => mode.id));

function cleanText(value) {
  return String(value || '').trim();
}

function cleanList(values) {
  return Array.isArray(values) ? values.map(cleanText).filter(Boolean) : [];
}

function cleanClauseHighlight(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const clause = cleanText(item.clause);
  const value = cleanText(item.value);
  const explanation = cleanText(item.explanation);
  const founderImpact = cleanText(item.founderImpact);

  if (!clause || !explanation) {
    return null;
  }

  return {
    clause,
    value,
    explanation,
    founderImpact,
  };
}

export function getFounderSafeExplainerMode(modeId) {
  return SAFE_EXPLAINER_MODES.find((mode) => mode.id === modeId) || null;
}

export function getFounderSafeExplainerModeLabel(modeId) {
  return getFounderSafeExplainerMode(modeId)?.label || 'Financing doc';
}

function normalizeMode(value, fallback = DEFAULT_SAFE_EXPLAINER_MODE) {
  const mode = cleanText(value).toLowerCase();
  return VALID_MODES.has(mode) ? mode : fallback;
}

function normalizeFileSize(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, numericValue);
}

export function deriveSafeExplainerFileSizeFromDataUrl(value) {
  const fileData = cleanText(value);

  if (!fileData) {
    return 0;
  }

  const match = fileData.match(/^data:[^;,]+;base64,([\s\S]+)$/i);
  const base64Payload = cleanText(match?.[1]).replace(/\s+/g, '');

  if (!base64Payload) {
    return 0;
  }

  const paddingLength = base64Payload.endsWith('==') ? 2 : base64Payload.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64Payload.length * 3) / 4) - paddingLength);
}

function isPdfDataUrl(value) {
  return /^data:application\/pdf;base64,[\s\S]+$/i.test(cleanText(value));
}

export function resolveFounderSafeExplainerApiConfig({ env = {}, hostname = '' } = {}) {
  const apiUrlOverride = cleanText(env?.VITE_FOUNDER_SAFE_EXPLAINER_API_URL);
  const apiUrl = apiUrlOverride || '/api/founder-safe-explainer';
  const normalizedHostname = cleanText(hostname).toLowerCase();
  const isLocalDevHost =
    env?.DEV === true && ['localhost', '127.0.0.1', '::1'].includes(normalizedHostname);

  if (!isLocalDevHost || apiUrlOverride) {
    return {
      apiUrl,
      localDevMessage: '',
    };
  }

  return {
    apiUrl,
    localDevMessage:
      'Local Vite dev does not serve /api/founder-safe-explainer. Set VITE_FOUNDER_SAFE_EXPLAINER_API_URL to a running explainer endpoint to exercise this tool locally.',
  };
}

export function createFounderSafeExplainerDraft() {
  return {
    filename: '',
    mimeType: '',
    fileData: '',
    fileSize: 0,
    mode: DEFAULT_SAFE_EXPLAINER_MODE,
    roundContext: '',
    focus: '',
  };
}

export function normalizeFounderSafeExplainerRequest(input = {}) {
  const fileData = cleanText(input.fileData);
  const derivedFileSize = deriveSafeExplainerFileSizeFromDataUrl(fileData);

  return {
    ...createFounderSafeExplainerDraft(),
    filename: cleanText(input.filename),
    mimeType: cleanText(input.mimeType) || 'application/pdf',
    fileData,
    fileSize: derivedFileSize || normalizeFileSize(input.fileSize),
    mode: normalizeMode(input.mode),
    roundContext: cleanText(input.roundContext),
    focus: cleanText(input.focus),
  };
}

export function validateFounderSafeExplainerRequest(input = {}) {
  const normalized = normalizeFounderSafeExplainerRequest(input);
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

  if (!isPdfDataUrl(normalized.fileData)) {
    return {
      normalized,
      missing: [],
      isValid: false,
      error: 'Please upload a valid PDF file.',
    };
  }

  if (normalized.fileSize > MAX_SAFE_EXPLAINER_PDF_SIZE_BYTES) {
    return {
      normalized,
      missing: [],
      isValid: false,
      error: 'Please upload a PDF smaller than 3.3 MB for the current direct-upload beta.',
    };
  }

  return {
    normalized,
    missing: [],
    isValid: true,
    error: '',
  };
}

export function normalizeFounderSafeExplainerResponse(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Invalid SAFE / term sheet explainer response.' };
  }

  const summary = cleanText(payload.summary);
  const clauseHighlights = Array.isArray(payload.clauseHighlights)
    ? payload.clauseHighlights.map(cleanClauseHighlight).filter(Boolean)
    : [];

  if (!summary || clauseHighlights.length === 0) {
    return {
      ok: false,
      error: 'SAFE / term sheet explainer response is missing required sections.',
    };
  }

  return {
    ok: true,
    documentType: cleanText(payload.documentType) || 'Financing document',
    title: cleanText(payload.title) || 'SAFE / Term Sheet Explainer',
    mode: normalizeMode(payload.mode, 'safe'),
    summary,
    clauseHighlights,
    founderWatchouts: cleanList(payload.founderWatchouts),
    unusualClauses: cleanList(payload.unusualClauses),
    counselQuestions: cleanList(payload.counselQuestions),
    extractionQuality: {
      label: cleanText(payload?.extractionQuality?.label) || 'unknown',
      notes: cleanList(payload?.extractionQuality?.notes),
    },
    disclaimer: cleanText(payload.disclaimer) || SAFE_EXPLAINER_DISCLAIMER,
  };
}

export function buildFounderSafeExplainerMarkdown({ filename = '', analysis = {} }) {
  const safeFilename = cleanText(filename) || 'document.pdf';
  const normalized = normalizeFounderSafeExplainerResponse(analysis);

  if (!normalized.ok) {
    return `# SAFE / Term Sheet Explainer: ${safeFilename}\n\nAnalysis unavailable.`;
  }

  const lines = [`# SAFE / Term Sheet Explainer: ${safeFilename}`, ''];

  lines.push(`**Document type:** ${normalized.documentType}`);
  lines.push(`**Mode:** ${getFounderSafeExplainerModeLabel(normalized.mode)}`);
  lines.push(`**Disclaimer:** ${normalized.disclaimer}`);
  lines.push('');
  lines.push('## Plain-English Summary', '');
  lines.push(normalized.summary, '');
  lines.push('## Clause Highlights', '');

  normalized.clauseHighlights.forEach((item) => {
    lines.push(`### ${item.clause}`);
    if (item.value) {
      lines.push(`- Reported value: ${item.value}`);
    }
    lines.push(`- Explanation: ${item.explanation}`);
    if (item.founderImpact) {
      lines.push(`- Founder impact: ${item.founderImpact}`);
    }
    lines.push('');
  });

  if (normalized.founderWatchouts.length > 0) {
    lines.push('## Founder Watch-outs', '');
    normalized.founderWatchouts.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (normalized.unusualClauses.length > 0) {
    lines.push('## Unusual Clauses', '');
    normalized.unusualClauses.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (normalized.counselQuestions.length > 0) {
    lines.push('## Lawyer Discussion Checklist', '');
    normalized.counselQuestions.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (normalized.extractionQuality.notes.length > 0) {
    lines.push('## Extraction Notes', '');
    normalized.extractionQuality.notes.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  return lines.join('\n').trim();
}
