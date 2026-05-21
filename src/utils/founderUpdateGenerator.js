export const MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES = Math.round(3.25 * 1024 * 1024);
export const FOUNDER_UPDATE_ACCEPTED_DOCUMENT_EXTENSIONS = [
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
export const FOUNDER_UPDATE_INPUT_ACCEPT =
  FOUNDER_UPDATE_ACCEPTED_DOCUMENT_EXTENSIONS.join(',');
export const FOUNDER_UPDATE_ACCEPTED_DOCUMENT_MIME_TYPES = [
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

function cleanText(value) {
  return String(value ?? '').trim();
}

function cleanList(values) {
  return Array.isArray(values) ? values.map(cleanText).filter(Boolean) : [];
}

function normalizeFileSize(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, numericValue);
}

function getExtension(filename) {
  const normalized = cleanText(filename).toLowerCase();
  const dotIndex = normalized.lastIndexOf('.');
  return dotIndex >= 0 ? normalized.slice(dotIndex) : '';
}

function deriveFileSizeFromDataUrl(value) {
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

function isAcceptedMimeType(mimeType) {
  return FOUNDER_UPDATE_ACCEPTED_DOCUMENT_MIME_TYPES.includes(cleanText(mimeType).toLowerCase());
}

function isAcceptedExtension(filename) {
  return FOUNDER_UPDATE_ACCEPTED_DOCUMENT_EXTENSIONS.includes(getExtension(filename));
}

function isSupportedFounderUpdateFile({ filename = '', mimeType = '' } = {}) {
  return isAcceptedMimeType(mimeType) || isAcceptedExtension(filename);
}

function normalizeFounderUpdateFile(file = {}, index = 0) {
  const fileData = cleanText(file.fileData);

  return {
    id: cleanText(file.id) || `file-${index + 1}`,
    filename: cleanText(file.filename),
    mimeType: cleanText(file.mimeType).toLowerCase(),
    fileData,
    fileSize: deriveFileSizeFromDataUrl(fileData) || normalizeFileSize(file.fileSize),
  };
}

export function createFounderUpdateDraft() {
  return {
    files: [],
    contextNotes: '',
    pastedNotes: '',
  };
}

export function normalizeFounderUpdateRequest(input = {}) {
  const files = Array.isArray(input.files)
    ? input.files
    : input.filename || input.fileData || input.mimeType
      ? [input]
      : [];

  return {
    ...createFounderUpdateDraft(),
    files: files.map((file, index) => normalizeFounderUpdateFile(file, index)),
    contextNotes: cleanText(input.contextNotes),
    pastedNotes: cleanText(input.pastedNotes),
  };
}

export function validateFounderUpdateRequest(input = {}) {
  const normalized = normalizeFounderUpdateRequest(input);

  if (normalized.files.length === 0 && !normalized.pastedNotes) {
    return {
      normalized,
      isValid: false,
      error: 'Upload at least one founder update file or paste rough period notes.',
      missing: ['files_or_pastedNotes'],
    };
  }

  const invalidFile = normalized.files.find((file) => {
    if (!file.filename || !file.fileData) {
      return true;
    }

    if (!isSupportedFounderUpdateFile({ filename: file.filename, mimeType: file.mimeType })) {
      return true;
    }

    return file.fileSize > MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES;
  });

  if (invalidFile) {
    const tooLarge = invalidFile.fileSize > MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES;
    return {
      normalized,
      isValid: false,
      error: tooLarge
        ? `Keep each file under ${Math.round(MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES / (1024 * 1024) * 10) / 10} MB in the current beta.`
        : 'Upload supported founder documents such as PDF, DOCX, PPTX, XLSX, CSV, or TSV.',
      missing: [],
    };
  }

  return {
    normalized,
    isValid: true,
    error: '',
    missing: [],
  };
}

export function normalizeFounderUpdateResponse(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      error: 'Invalid founder update response.',
    };
  }

  const title = cleanText(payload.title);
  const topline = cleanText(payload.topline);
  const whatChanged = cleanList(payload.whatChanged);
  const wins = cleanList(payload.wins);
  const challenges = cleanList(payload.challenges);
  const metricsAndProof = cleanList(payload.metricsAndProof);
  const nextFocus = cleanList(payload.nextFocus);

  if (!title || !topline || whatChanged.length === 0 || wins.length === 0 || challenges.length === 0) {
    return {
      ok: false,
      error: 'Founder update response is missing required sections.',
    };
  }

  return {
    ok: true,
    title,
    reportingPeriod: cleanText(payload.reportingPeriod),
    topline,
    whatChanged,
    wins,
    challenges,
    metricsAndProof,
    nextFocus,
    asks: cleanList(payload.asks),
    confidenceGaps: cleanList(payload.confidenceGaps),
    extractionNotes: cleanList(payload.extractionNotes),
    sourceFiles: cleanList(payload.sourceFiles),
  };
}

function appendList(lines, title, items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  lines.push(title, '');
  items.forEach((item) => lines.push(`- ${item}`));
  lines.push('');
}

export function buildFounderUpdateMarkdown({ title = '', update = {} }) {
  const normalized = normalizeFounderUpdateResponse(update);
  const safeTitle = cleanText(title) || cleanText(update.title) || 'Founder update';

  if (!normalized.ok) {
    return `# Founder Update: ${safeTitle}\n\nUpdate unavailable.`;
  }

  const lines = [`# Founder Update: ${safeTitle}`, ''];

  if (normalized.reportingPeriod) {
    lines.push(`**Reporting period:** ${normalized.reportingPeriod}`);
    lines.push('');
  }

  lines.push('## Topline', '');
  lines.push(normalized.topline, '');

  appendList(lines, '## What Changed', normalized.whatChanged);
  appendList(lines, '## Wins', normalized.wins);
  appendList(lines, '## Challenges', normalized.challenges);
  appendList(lines, '## Metrics And Proof', normalized.metricsAndProof);
  appendList(lines, '## What Needs Attention Next', normalized.nextFocus);
  appendList(lines, '## Asks Or Support Needed', normalized.asks);
  appendList(lines, '## Confidence Or Gaps', normalized.confidenceGaps);
  appendList(lines, '## Extraction Notes', normalized.extractionNotes);

  if (normalized.sourceFiles.length > 0) {
    lines.push('## Source Files', '');
    normalized.sourceFiles.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  return lines.join('\n').trim();
}
