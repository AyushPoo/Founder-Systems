export const MAX_PDF_SIZE_BYTES = Math.round(3.25 * 1024 * 1024);
export const DEFAULT_PDF_SUMMARY_MODE = 'auto';
export const ACCEPTED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.rtf',
  '.odt',
  '.ppt',
  '.pptx',
  '.csv',
  '.tsv',
  '.xls',
  '.xlsx',
  '.txt',
  '.md',
  '.json',
  '.html',
  '.xml',
];
export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'application/csv',
  'text/tab-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/html',
  'application/xml',
  'text/xml',
];
export const ACCEPTED_DOCUMENT_INPUT_ACCEPT = ACCEPTED_DOCUMENT_EXTENSIONS.join(',');

export const PDF_SUMMARY_MODES = [
  {
    id: 'auto',
    label: 'Auto-detect',
    description:
      'Read the PDF first, infer what kind of founder document it is, and use the best lens automatically.',
  },
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
  {
    id: 'annual-report',
    label: 'Annual report',
    description:
      'Focus on what changed in the business, management narrative versus numbers, risks, and where to dig deeper.',
  },
  {
    id: 'financial-statement',
    label: 'Financial statement',
    description:
      'Focus on revenue, margins, cash flow quality, balance-sheet pressure, anomalies, and what to inspect next.',
  },
];

const VALID_MODES = new Set(PDF_SUMMARY_MODES.map((mode) => mode.id));

function cleanText(value) {
  return String(value || '').trim();
}

function cleanList(values) {
  return Array.isArray(values) ? values.map(cleanText).filter(Boolean) : [];
}

function cleanMetric(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const label = cleanText(item.label);
  const value = cleanText(item.value);
  const note = cleanText(item.note);

  if (!label || !value) {
    return null;
  }

  return {
    label,
    value,
    note,
  };
}

function cleanBreakdownSection(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const title = cleanText(item.title);
  const summary = cleanText(item.summary);
  const focusPoints = cleanList(item.focusPoints);

  if (!title || !summary) {
    return null;
  }

  return {
    title,
    summary,
    focusPoints,
  };
}

function getExtension(filename) {
  const normalized = cleanText(filename).toLowerCase();
  const dotIndex = normalized.lastIndexOf('.');
  return dotIndex >= 0 ? normalized.slice(dotIndex) : '';
}

export function getFounderPdfSummaryMode(modeId) {
  return PDF_SUMMARY_MODES.find((mode) => mode.id === modeId) || null;
}

export function getFounderPdfSummaryModeLabel(modeId) {
  return getFounderPdfSummaryMode(modeId)?.label || 'Founder lens';
}

function normalizeMode(value, fallback = DEFAULT_PDF_SUMMARY_MODE) {
  const mode = cleanText(value).toLowerCase();
  return VALID_MODES.has(mode) ? mode : fallback;
}

function normalizeFileSize(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, numericValue);
}

export function derivePdfFileSizeFromDataUrl(value) {
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

function parseDataUrlMetadata(value) {
  const match = cleanText(value).match(/^data:([^;,]+);base64,([\s\S]+)$/i);
  return {
    mimeType: cleanText(match?.[1]).toLowerCase(),
    base64Payload: cleanText(match?.[2]),
  };
}

export function isAcceptedDocumentMimeType(mimeType) {
  return ACCEPTED_DOCUMENT_MIME_TYPES.includes(cleanText(mimeType).toLowerCase());
}

export function isAcceptedDocumentExtension(filename) {
  return ACCEPTED_DOCUMENT_EXTENSIONS.includes(getExtension(filename));
}

export function isSupportedFounderDocumentFile({ filename = '', mimeType = '' } = {}) {
  return isAcceptedDocumentMimeType(mimeType) || isAcceptedDocumentExtension(filename);
}

function isAcceptedDocumentDataUrl(value, mimeType, filename) {
  const { mimeType: dataUrlMimeType, base64Payload } = parseDataUrlMetadata(value);
  const normalizedMimeType = cleanText(mimeType).toLowerCase();

  if (!base64Payload) {
    return false;
  }

  if (dataUrlMimeType && normalizedMimeType && dataUrlMimeType !== normalizedMimeType) {
    return false;
  }

  if (dataUrlMimeType && isAcceptedDocumentMimeType(dataUrlMimeType)) {
    return true;
  }

  return (
    (!dataUrlMimeType || dataUrlMimeType === normalizedMimeType) &&
    isSupportedFounderDocumentFile({ filename, mimeType })
  );
}

export function resolveFounderPdfSummaryApiConfig({ env = {}, hostname = '' } = {}) {
  const apiUrlOverride = cleanText(env?.VITE_FOUNDER_PDF_SUMMARY_API_URL);
  const apiUrl = apiUrlOverride || '/api/founder-pdf-summarize';
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
      'Local Vite dev does not serve /api/founder-pdf-summarize. Set VITE_FOUNDER_PDF_SUMMARY_API_URL to a running summary endpoint to exercise this tool locally.',
  };
}

export function createFounderPdfSummaryDraft() {
  return {
    filename: '',
    mimeType: '',
    fileData: '',
    fileSize: 0,
    mode: DEFAULT_PDF_SUMMARY_MODE,
    focus: '',
  };
}

export function normalizeFounderPdfSummaryRequest(input = {}) {
  const fileData = cleanText(input.fileData);
  const derivedFileSize = derivePdfFileSizeFromDataUrl(fileData);

  return {
    ...createFounderPdfSummaryDraft(),
    filename: cleanText(input.filename),
    mimeType: cleanText(input.mimeType).toLowerCase() || 'application/pdf',
    fileData,
    fileSize: derivedFileSize || normalizeFileSize(input.fileSize),
    mode: normalizeMode(input.mode),
    focus: cleanText(input.focus),
  };
}

export function validateFounderPdfSummaryRequest(input = {}) {
  const normalized = normalizeFounderPdfSummaryRequest(input);
  const missing = [];

  if (!normalized.filename) missing.push('filename');
  if (!normalized.fileData) missing.push('fileData');
  if (!normalized.mimeType) missing.push('mimeType');

  if (missing.length > 0) {
    return {
      normalized,
      missing,
      isValid: false,
      error: `Missing required fields: ${missing.join(', ')}`,
    };
  }

  if (!isSupportedFounderDocumentFile(normalized)) {
    return {
      normalized,
      missing: [],
      isValid: false,
      error:
        'Please upload a supported document, deck, or spreadsheet file such as PDF, DOCX, PPTX, XLSX, CSV, or TSV.',
    };
  }

  if (!isAcceptedDocumentDataUrl(normalized.fileData, normalized.mimeType, normalized.filename)) {
    return {
      normalized,
      missing: [],
      isValid: false,
      error: 'Please upload a valid supported document file.',
    };
  }

  if (normalized.fileSize > MAX_PDF_SIZE_BYTES) {
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

export function normalizeFounderPdfSummaryResponse(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Invalid founder PDF summary response.' };
  }

  const executiveSummary = cleanText(payload.executiveSummary);
  const keyTakeaways = cleanList(payload.keyTakeaways);
  const riskFlags = cleanList(payload.riskFlags);
  const focusAreas = cleanList(payload.focusAreas);
  const nextQuestions = cleanList(payload.nextQuestions);
  const keyMetrics = Array.isArray(payload.keyMetrics)
    ? payload.keyMetrics.map(cleanMetric).filter(Boolean)
    : [];
  const breakdownSections = Array.isArray(payload.breakdownSections)
    ? payload.breakdownSections.map(cleanBreakdownSection).filter(Boolean)
    : [];

  if (!executiveSummary || keyTakeaways.length === 0) {
    return {
      ok: false,
      error: 'Founder PDF summary response is missing required sections.',
    };
  }

  return {
    ok: true,
    documentType: cleanText(payload.documentType) || 'Founder PDF',
    title: cleanText(payload.title) || 'Founder PDF Summary',
    mode: normalizeMode(payload.mode, 'general'),
    executiveSummary,
    keyTakeaways,
    riskFlags,
    focusAreas,
    nextQuestions,
    keyMetrics,
    breakdownSections,
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
  lines.push(`**Mode:** ${getFounderPdfSummaryModeLabel(normalized.mode)}`);
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

  if (normalized.focusAreas.length > 0) {
    lines.push('## What To Focus On', '');
    normalized.focusAreas.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (normalized.nextQuestions.length > 0) {
    lines.push('## Next Questions', '');
    normalized.nextQuestions.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (normalized.keyMetrics.length > 0) {
    lines.push('## Key Metrics', '');
    normalized.keyMetrics.forEach((item) => {
      lines.push(`- ${item.label}: ${item.value}${item.note ? ` (${item.note})` : ''}`);
    });
    lines.push('');
  }

  if (normalized.breakdownSections.length > 0) {
    lines.push('## Important Sections', '');
    normalized.breakdownSections.forEach((section) => {
      lines.push(`### ${section.title}`, '');
      lines.push(section.summary, '');
      if (section.focusPoints.length > 0) {
        section.focusPoints.forEach((item) => lines.push(`- ${item}`));
        lines.push('');
      }
    });
  }

  if (normalized.extractionQuality.notes.length > 0) {
    lines.push('## Extraction Notes', '');
    normalized.extractionQuality.notes.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  return lines.join('\n').trim();
}
