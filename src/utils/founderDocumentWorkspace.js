import {
  DEFAULT_PDF_SUMMARY_MODE,
  MAX_PDF_SIZE_BYTES,
  derivePdfFileSizeFromDataUrl,
  validateFounderPdfSummaryRequest,
} from './founderPdfSummary.js';

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

function normalizeWorkspaceFile(input = {}, index = 0) {
  const fileData = cleanText(input.fileData);

  return {
    id: cleanText(input.id) || `file-${index + 1}`,
    filename: cleanText(input.filename),
    mimeType: cleanText(input.mimeType).toLowerCase(),
    fileData,
    fileSize: derivePdfFileSizeFromDataUrl(fileData) || normalizeFileSize(input.fileSize),
    mode: cleanText(input.mode).toLowerCase() || DEFAULT_PDF_SUMMARY_MODE,
    roundContext: cleanText(input.roundContext),
    focus: cleanText(input.focus),
  };
}

function normalizeFileAnalysis(item = {}) {
  const extractionQuality = {
    label: cleanText(item?.extractionQuality?.label) || 'unknown',
    notes: cleanList(item?.extractionQuality?.notes),
  };

  const fileId = cleanText(item.fileId);
  const filename = cleanText(item.filename);
  const detectedType = cleanText(item.detectedType);
  const summary = cleanText(item.summary);
  const strongestSignals = cleanList(item.strongestSignals);
  const concerns = cleanList(item.concerns);
  const focusAreas = cleanList(item.focusAreas);

  if (!fileId || !filename || !detectedType || !summary) {
    return null;
  }

  return {
    fileId,
    filename,
    detectedType,
    summary,
    strongestSignals,
    concerns,
    focusAreas,
    extractionQuality,
    keyMetrics: Array.isArray(item.keyMetrics)
      ? item.keyMetrics
          .map((metric) => {
            const label = cleanText(metric?.label);
            const value = cleanText(metric?.value);
            const note = cleanText(metric?.note);

            if (!label || !value) {
              return null;
            }

            return { label, value, note };
          })
          .filter(Boolean)
      : [],
    clauseHighlights: Array.isArray(item.clauseHighlights)
      ? item.clauseHighlights
          .map((clause) => {
            const clauseName = cleanText(clause?.clause);
            const value = cleanText(clause?.value);
            const explanation = cleanText(clause?.explanation);
            const founderImpact = cleanText(clause?.founderImpact);

            if (!clauseName || !explanation) {
              return null;
            }

            return {
              clause: clauseName,
              value,
              explanation,
              founderImpact,
            };
          })
          .filter(Boolean)
      : [],
  };
}

export function createFounderDocumentWorkspaceDraft() {
  return {
    files: [],
    focus: '',
  };
}

export function normalizeFounderDocumentWorkspaceRequest(input = {}) {
  const incomingFiles = Array.isArray(input.files)
    ? input.files
    : input.filename || input.fileData || input.mimeType
      ? [input]
      : [];

  return {
    ...createFounderDocumentWorkspaceDraft(),
    files: incomingFiles.map((file, index) => normalizeWorkspaceFile(file, index)),
    focus: cleanText(input.focus),
  };
}

export function validateFounderDocumentWorkspaceRequest(input = {}) {
  const normalized = normalizeFounderDocumentWorkspaceRequest(input);

  if (normalized.files.length === 0) {
    return {
      normalized,
      validFiles: [],
      invalidFiles: [],
      isValid: false,
      error: 'Upload at least one supported founder document file.',
    };
  }

  const validFiles = [];
  const invalidFiles = [];

  normalized.files.forEach((file) => {
    const validation = validateFounderPdfSummaryRequest(file);

    if (validation.isValid) {
      validFiles.push({
        ...file,
        mimeType: validation.normalized.mimeType,
        fileSize: validation.normalized.fileSize,
      });
      return;
    }

    invalidFiles.push({
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      error: validation.error,
    });
  });

  const isValid = validFiles.length > 0 && invalidFiles.length === 0;

  return {
    normalized,
    validFiles,
    invalidFiles,
    isValid,
    error:
      validFiles.length === 0
        ? invalidFiles[0]?.error || 'Upload at least one supported founder document file.'
        : invalidFiles.length > 0
          ? 'One or more files could not be analyzed. Remove the unsupported files and try again.'
          : '',
  };
}

export function normalizeFounderDocumentWorkspaceResponse(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      error: 'Invalid founder document workspace response.',
    };
  }

  const workspaceTitle = cleanText(payload.workspaceTitle);
  const overallRead = cleanText(payload.overallRead);
  const whatMattersMost = cleanList(payload.whatMattersMost);
  const fileAnalyses = Array.isArray(payload.fileAnalyses)
    ? payload.fileAnalyses.map(normalizeFileAnalysis).filter(Boolean)
    : [];

  if (!workspaceTitle || !overallRead || whatMattersMost.length === 0 || fileAnalyses.length === 0) {
    return {
      ok: false,
      error: 'Founder document workspace response is missing required sections.',
    };
  }

  return {
    ok: true,
    workspaceTitle,
    filesAnalyzed: cleanList(payload.filesAnalyzed),
    overallRead,
    whatMattersMost,
    contradictions: cleanList(payload.contradictions),
    missingProof: cleanList(payload.missingProof),
    watchouts: cleanList(payload.watchouts),
    priorityQuestions: cleanList(payload.priorityQuestions),
    nextActions: cleanList(payload.nextActions),
    fileAnalyses,
    extractionNotes: cleanList(payload.extractionNotes),
  };
}

export function createWorkspaceFileAnalysisFromSummary({
  file = {},
  detectedType = 'general-founder-doc',
  summary = {},
} = {}) {
  return normalizeFileAnalysis({
    fileId: cleanText(file.id),
    filename: cleanText(file.filename),
    detectedType: cleanText(detectedType) || 'general-founder-doc',
    summary: cleanText(summary.executiveSummary),
    strongestSignals: cleanList(summary.keyTakeaways),
    concerns: cleanList(summary.riskFlags),
    focusAreas: cleanList(summary.focusAreas),
    extractionQuality: summary.extractionQuality,
    keyMetrics: Array.isArray(summary.keyMetrics) ? summary.keyMetrics : [],
  });
}

export function createWorkspaceFileAnalysisFromFinancing({
  file = {},
  detectedType = 'safe',
  analysis = {},
} = {}) {
  return normalizeFileAnalysis({
    fileId: cleanText(file.id),
    filename: cleanText(file.filename),
    detectedType: cleanText(detectedType) || 'safe',
    summary: cleanText(analysis.summary),
    strongestSignals: Array.isArray(analysis.clauseHighlights)
      ? analysis.clauseHighlights
          .map((clause) =>
            cleanText(clause?.value)
              ? `${cleanText(clause?.clause)}: ${cleanText(clause?.value)}`
              : cleanText(clause?.clause)
          )
          .filter(Boolean)
      : [],
    concerns: [...cleanList(analysis.founderWatchouts), ...cleanList(analysis.unusualClauses)],
    focusAreas: cleanList(analysis.counselQuestions),
    extractionQuality: analysis.extractionQuality,
    clauseHighlights: Array.isArray(analysis.clauseHighlights) ? analysis.clauseHighlights : [],
  });
}

function appendList(lines, title, items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  lines.push(title, '');
  items.forEach((item) => lines.push(`- ${item}`));
  lines.push('');
}

export function buildFounderDocumentWorkspaceMarkdown({ workspaceName = '', analysis = {} }) {
  const normalized = normalizeFounderDocumentWorkspaceResponse(analysis);
  const safeWorkspaceName = cleanText(workspaceName) || cleanText(analysis.workspaceTitle) || 'Workspace';

  if (!normalized.ok) {
    return `# Founder Document Intelligence: ${safeWorkspaceName}\n\nWorkspace analysis unavailable.`;
  }

  const lines = [`# Founder Document Intelligence: ${safeWorkspaceName}`, ''];

  if (normalized.filesAnalyzed.length > 0) {
    lines.push(`**Files analyzed:** ${normalized.filesAnalyzed.join(', ')}`);
    lines.push('');
  }

  lines.push('## Overall Read', '');
  lines.push(normalized.overallRead, '');

  appendList(lines, '## What Matters Most', normalized.whatMattersMost);
  appendList(lines, '## Cross-File Contradictions', normalized.contradictions);
  appendList(lines, '## Missing Proof Or Missing Documents', normalized.missingProof);
  appendList(lines, '## Watch-Outs', normalized.watchouts);
  appendList(lines, '## Priority Questions', normalized.priorityQuestions);
  appendList(lines, '## Suggested Next Actions', normalized.nextActions);

  lines.push('## File Analyses', '');

  normalized.fileAnalyses.forEach((fileAnalysis) => {
    lines.push(`### ${fileAnalysis.filename}`, '');
    lines.push(`**Detected type:** ${fileAnalysis.detectedType}`);
    lines.push('');
    lines.push(fileAnalysis.summary, '');
    appendList(lines, '#### Strongest Signals', fileAnalysis.strongestSignals);
    appendList(lines, '#### Concerns', fileAnalysis.concerns);
    appendList(lines, '#### What To Inspect Next', fileAnalysis.focusAreas);

    if (fileAnalysis.keyMetrics.length > 0) {
      lines.push('#### Key Metrics', '');
      fileAnalysis.keyMetrics.forEach((metric) => {
        lines.push(`- ${metric.label}: ${metric.value}${metric.note ? ` (${metric.note})` : ''}`);
      });
      lines.push('');
    }

    if (fileAnalysis.clauseHighlights.length > 0) {
      lines.push('#### Clause Highlights', '');
      fileAnalysis.clauseHighlights.forEach((clause) => {
        lines.push(
          `- ${clause.clause}${clause.value ? `: ${clause.value}` : ''} - ${clause.explanation}${
            clause.founderImpact ? ` (${clause.founderImpact})` : ''
          }`
        );
      });
      lines.push('');
    }

    appendList(lines, '#### Extraction Notes', fileAnalysis.extractionQuality.notes);
  });

  appendList(lines, '## Workspace Extraction Notes', normalized.extractionNotes);

  return lines.join('\n').trim();
}

export { MAX_PDF_SIZE_BYTES };
