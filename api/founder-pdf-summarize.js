import { Buffer } from 'node:buffer';
import process from 'node:process';
import {
  normalizeFounderPdfSummaryRequest,
  normalizeFounderPdfSummaryResponse,
  validateFounderPdfSummaryRequest,
} from '../src/utils/founderPdfSummary.js';
import {
  createWorkspaceFileAnalysisFromFinancing,
  createWorkspaceFileAnalysisFromSummary,
  normalizeFounderDocumentWorkspaceResponse,
  validateFounderDocumentWorkspaceRequest,
} from '../src/utils/founderDocumentWorkspace.js';
import {
  classifyFounderDocumentType,
  isFinancingDocumentMode,
  mapDocumentTypeToSummaryMode,
} from '../src/utils/founderDocumentIntelligence.js';
import { normalizeFounderSafeExplainerRequest } from '../src/utils/founderSafeExplainer.js';
import { explainFounderSafeDocument } from './founder-safe-explainer.js';
import {
  applyRateLimitHeaders,
  invokeFounderJsonModel,
} from './_lib/founderAiRuntime.js';
import { resolveBackendSession } from './_lib/founderBackendGuard.js';

const SYSTEM_PROMPT = [
  'You are a founder-specific document analyst.',
  'Read the file carefully and analyze only what is actually supported by the document.',
  'Go beyond generic summary: explain what matters, what changed, what looks weak, and what to focus on next.',
  'Do not give legal or financial certainty.',
  'Always return valid JSON only.',
].join('\n');

const RESPONSE_SHAPE = {
  documentType: '',
  title: '',
  mode: 'general',
  executiveSummary: '',
  keyTakeaways: [''],
  riskFlags: [''],
  focusAreas: [''],
  nextQuestions: [''],
  keyMetrics: [
    {
      label: '',
      value: '',
      note: '',
    },
  ],
  breakdownSections: [
    {
      title: '',
      summary: '',
      focusPoints: [''],
    },
  ],
  extractionQuality: {
    label: '',
    notes: [''],
  },
};

const WORKSPACE_RESPONSE_SHAPE = {
  workspaceTitle: '',
  filesAnalyzed: [''],
  overallRead: '',
  whatMattersMost: [''],
  contradictions: [''],
  missingProof: [''],
  watchouts: [''],
  priorityQuestions: [''],
  nextActions: [''],
  extractionNotes: [''],
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isJsonParseError(error) {
  return error instanceof SyntaxError;
}

async function readJsonBody(req) {
  if (req?.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req?.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw createHttpError(400, `Malformed JSON request body: ${cleanText(error.message) || 'Unable to parse JSON.'}`);
    }
  }

  const chunks = [];

  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', resolve);
    req.on('error', reject);
  });

  const rawText = Buffer.concat(chunks).toString('utf8').trim();
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw createHttpError(400, `Malformed JSON request body: ${cleanText(error.message) || 'Unable to parse JSON.'}`);
  }
}

function buildUserPrompt(input) {
  const modeGuidance = {
    auto: [
      'Mode guidance: auto-detect',
      'Infer the document type from the PDF before summarizing it.',
      'Choose the closest lens from: general, pitch-deck, investor-memo, grant-doc, market-report.',
      'Set the mode field in your JSON to the lens you actually used after reading the document.',
      'If the PDF does not clearly match one category, fall back to general.',
    ],
    general: [
      'Mode guidance: general',
      'Focus on the document purpose, the clearest useful takeaways, missing proof, practical risks, and the next questions a founder should answer.',
    ],
    'pitch-deck': [
      'Mode guidance: pitch-deck',
      'Focus on story clarity, traction proof, investor credibility gaps, major risks, and the next investor questions this deck invites.',
    ],
    'investor-memo': [
      'Mode guidance: investor-memo',
      'Focus on market, business model, evidence quality, diligence gaps, risks, and the next questions an investor would ask before conviction.',
    ],
    'grant-doc': [
      'Mode guidance: grant-doc',
      'Focus on eligibility, deliverables, timeline realism, compliance or execution risks, missing proof, and the next questions needed before submission.',
    ],
    'market-report': [
      'Mode guidance: market-report',
      'Focus on relevant market signals, founder implications, weak evidence, risks in the readout, and the next questions that matter for decisions.',
    ],
    'annual-report': [
      'Mode guidance: annual-report',
      'Focus on revenue, margin movement, cash generation, debt or balance-sheet pressure, auditor or governance flags, management claims versus reported numbers, and what deserves deeper inspection.',
    ],
    'financial-statement': [
      'Mode guidance: financial-statement',
      'Focus on what changed in revenue, gross margin, operating margin, cash flow, working capital, leverage, and any anomalies or contradictions that deserve follow-up.',
    ],
  };
  const selectedGuidance = modeGuidance[input.mode] || modeGuidance.auto;

  return [
    'Analyze this founder document for decision-making.',
    '',
    `Filename: ${input.filename}`,
    `File type: ${input.mimeType}`,
    `Requested mode: ${input.mode}`,
    `Focus: ${input.focus || 'General summary with no extra emphasis.'}`,
    '',
    ...selectedGuidance,
    '',
    'For every document, give specific value beyond a generic summary.',
    'Use focusAreas for the highest-leverage things the founder should inspect, challenge, or verify next.',
    'If the document is financial, prefer concrete explanations of number movement, pressure points, and contradictions.',
    'Return JSON only.',
    'Match this shape and keep every top-level key present:',
    JSON.stringify(RESPONSE_SHAPE, null, 2),
    '',
    'Use concise bullet-ready phrasing for list items.',
    'If the PDF is ambiguous or extraction quality is weak, say that in extractionQuality.notes.',
  ].join('\n');
}

function extractResponseText(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputItems = Array.isArray(payload.output) ? payload.output : [];
  const textParts = [];

  outputItems.forEach((item) => {
    if (typeof item?.content === 'string' && item.content.trim()) {
      textParts.push(item.content.trim());
      return;
    }

    const contentItems = Array.isArray(item?.content) ? item.content : [];
    contentItems.forEach((content) => {
      if (typeof content?.text === 'string' && content.text.trim()) {
        textParts.push(content.text.trim());
      } else if (typeof content?.text?.value === 'string' && content.text.value.trim()) {
        textParts.push(content.text.value.trim());
      }
    });
  });

  return textParts.join('\n').trim();
}

function parseModelJson(text) {
  const raw = cleanText(text);
  if (!raw) {
    throw new Error('OpenAI response did not include JSON text.');
  }

  try {
    return JSON.parse(raw);
  } catch {
    const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      return JSON.parse(fencedMatch[1].trim());
    }

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }

    throw new Error('OpenAI response was not valid JSON.');
  }
}

function mergeDetailedBreakdown(basePayload, detailPayload) {
  return {
    ...basePayload,
    keyMetrics: Array.isArray(detailPayload?.keyMetrics) ? detailPayload.keyMetrics : [],
    breakdownSections: Array.isArray(detailPayload?.breakdownSections)
      ? detailPayload.breakdownSections
      : [],
  };
}

async function requestJsonModel(req, { productKey, userPrompt, files = [], modelTier, maxOutputTokens, usage }) {
  const result = await invokeFounderJsonModel({
    req,
    productKey,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    files,
    modelTier,
    maxOutputTokens,
    usage,
  });

  return result;
}

async function summarizeWithModel(req, input) {
  const modelTier =
    input.mode === 'annual-report' || input.mode === 'financial-statement' ? 'quality' : 'cheap';

  return requestJsonModel(req, {
    productKey:
      modelTier === 'quality'
        ? 'founder-document-intelligence-quality'
        : 'founder-document-intelligence',
    userPrompt: buildUserPrompt(input),
    files: [input],
    modelTier,
    maxOutputTokens: modelTier === 'quality' ? 1800 : 1400,
  });
}

async function summarizeLongDocumentWithModel(req, input) {
  const baseSummaryResult = await summarizeWithModel(req, input);
  const detailPromptInput = {
    ...input,
    focus: [
      input.focus,
      'Return the most important sections, important numbers, and where a founder should look more closely.',
    ]
      .filter(Boolean)
      .join(' '),
  };

  const detailResponseResult = await summarizeWithModel(req, detailPromptInput);

  return {
    parsed: mergeDetailedBreakdown(baseSummaryResult.parsed, detailResponseResult.parsed),
    rateLimit: detailResponseResult.rateLimit,
  };
}

function buildWorkspaceSynthesisPrompt({ focus = '', fileAnalyses = [], invalidFiles = [] } = {}) {
  return [
    'Synthesize this founder document workspace into one founder-facing brief.',
    '',
    `Focus: ${focus || 'General founder-oriented synthesis.'}`,
    '',
    'You are given normalized fileAnalyses rather than raw files.',
    'Use them to identify contradictions, missing proof, repeated risks, priority questions, and the next best actions.',
    'If some files were rejected or weakly extracted, mention that in extractionNotes without overstating certainty.',
    'Return JSON only.',
    'Match this shape and keep every top-level key present:',
    JSON.stringify(WORKSPACE_RESPONSE_SHAPE, null, 2),
    '',
    `fileAnalyses: ${JSON.stringify(fileAnalyses, null, 2)}`,
    `invalidFiles: ${JSON.stringify(invalidFiles, null, 2)}`,
  ].join('\n');
}

async function summarizeWorkspaceWithModel(req, { focus = '', fileAnalyses = [], invalidFiles = [] } = {}) {
  return requestJsonModel(req, {
    productKey: 'founder-document-intelligence-quality',
    userPrompt: buildWorkspaceSynthesisPrompt({
      focus,
      fileAnalyses,
      invalidFiles,
    }),
    modelTier: 'quality',
    maxOutputTokens: 2400,
    usage: {
      action: 'analyze_workspace',
    },
  });
}

function getReadableFallbackExcerpt(file = {}) {
  const readableTypes = new Set([
    'text/csv',
    'application/csv',
    'text/tab-separated-values',
    'text/plain',
    'text/markdown',
    'application/json',
    'text/html',
    'application/xml',
    'text/xml',
  ]);

  if (!readableTypes.has(cleanText(file.mimeType).toLowerCase())) {
    return '';
  }

  const base64Payload = cleanText(file.fileData).match(/^data:[^;,]+;base64,([\s\S]+)$/i)?.[1];
  if (!base64Payload) {
    return '';
  }

  const excerpt = Buffer.from(base64Payload, 'base64')
    .toString('utf8')
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .slice(0, 4)
    .join(' | ');

  return excerpt.length > 220 ? `${excerpt.slice(0, 217).trim()}...` : excerpt;
}

function buildDegradedWorkspaceAnalysis(requestBody, reason) {
  const validation = validateFounderDocumentWorkspaceRequest(requestBody || {});
  const limitation = cleanText(reason) || 'The live model runtime is unavailable.';
  const fileAnalyses = validation.validFiles.map((file) => {
    const detectedType = classifyFounderDocumentType(file);
    const excerpt = getReadableFallbackExcerpt(file);

    return {
      fileId: file.id,
      filename: file.filename,
      detectedType,
      summary: excerpt
        ? `Lower-confidence runtime fallback: readable content was accepted (${excerpt}). No model interpretation was performed.`
        : `Lower-confidence runtime fallback: ${file.filename} was accepted, but its content could not be interpreted without the model runtime.`,
      strongestSignals: excerpt
        ? [`Readable source preview: ${excerpt}`]
        : [`${file.filename} was accepted for analysis.`],
      concerns: ['Model-backed document interpretation is currently unavailable.'],
      focusAreas: ['Review the source file directly and rerun analysis once the model runtime is restored.'],
      extractionQuality: {
        label: excerpt ? 'limited' : 'unavailable',
        notes: [`Runtime unavailable: ${limitation}`],
      },
      keyMetrics: [],
      clauseHighlights: [],
    };
  });

  return {
    ok: true,
    workspaceTitle: 'Founder document workspace (lower-confidence fallback)',
    filesAnalyzed: validation.validFiles.map((file) => file.filename),
    overallRead: 'Lower-confidence runtime fallback: the upload set was accepted, but model-backed document interpretation is unavailable. Review the source material manually before making decisions.',
    whatMattersMost: [
      'No AI-derived claims have been made while the document-analysis runtime is unavailable.',
      ...validation.validFiles.map((file) => `${file.filename} was accepted as ${classifyFounderDocumentType(file)}.`),
    ],
    contradictions: ['Contradictions cannot be verified while model-backed analysis is unavailable.'],
    missingProof: ['A model-backed interpretation is required before treating this workspace as analyzed.'],
    watchouts: ['Do not treat this fallback as financial, legal, or diligence-quality analysis.'],
    priorityQuestions: ['Which claims need manual verification before this workspace can be used for a decision?'],
    nextActions: [
      'Review the uploaded files directly for immediate decisions.',
      'Restore the model runtime configuration and rerun this workspace analysis.',
    ],
    fileAnalyses,
    extractionNotes: [`Lower-confidence runtime fallback: ${limitation}`],
    runtime: {
      fallbackUsed: true,
      fallbackReason: limitation,
    },
  };
}

async function analyzeWorkspaceFile(req, file, focus) {
  let detectedType = classifyFounderDocumentType({
    filename: file.filename,
    mimeType: file.mimeType,
  });

  if (isFinancingDocumentMode(detectedType) && file.mimeType !== 'application/pdf') {
    detectedType = 'general-founder-doc';
  }

  if (isFinancingDocumentMode(detectedType)) {
    const financingInput = normalizeFounderSafeExplainerRequest({
      filename: file.filename,
      mimeType: file.mimeType,
      fileData: file.fileData,
      fileSize: file.fileSize,
      mode: detectedType,
      roundContext: file.roundContext,
      focus: focus || file.focus,
    });
    const financingOutput = await explainFounderSafeDocument(financingInput, req);
    const financingRateLimit = financingOutput.__rateLimit;
    delete financingOutput.__rateLimit;

    return {
      analysis: createWorkspaceFileAnalysisFromFinancing({
        file,
        detectedType,
        analysis: financingOutput,
      }),
      rateLimit: financingRateLimit,
    };
  }

  const summaryMode = mapDocumentTypeToSummaryMode(detectedType);
  const summaryInput = normalizeFounderPdfSummaryRequest({
    filename: file.filename,
    mimeType: file.mimeType,
    fileData: file.fileData,
    fileSize: file.fileSize,
    mode: summaryMode,
    focus: focus || file.focus,
  });

  const rawOutput =
    summaryMode === 'annual-report'
      ? await summarizeLongDocumentWithModel(req, summaryInput)
      : await summarizeWithModel(req, summaryInput);

  const normalizedOutput = normalizeFounderPdfSummaryResponse({
    ...rawOutput.parsed,
    mode: rawOutput.parsed?.mode || summaryInput.mode,
    title: rawOutput.parsed?.title || summaryInput.filename,
  });

  if (!normalizedOutput.ok) {
    throw createHttpError(502, normalizedOutput.error);
  }

  return {
    analysis: createWorkspaceFileAnalysisFromSummary({
    file,
    detectedType,
    summary: normalizedOutput,
    }),
    rateLimit: rawOutput.rateLimit,
  };
}

async function analyzeWorkspaceRequest(req, requestBody) {
  const validation = validateFounderDocumentWorkspaceRequest(requestBody || {});
  const { normalized, validFiles, invalidFiles } = validation;

  if (validFiles.length === 0) {
    throw createHttpError(
      400,
      validation.error || 'Upload at least one supported founder document file.'
    );
  }

  const fileAnalyses = [];
  let latestRateLimit = null;

  for (const file of validFiles) {
    const result = await analyzeWorkspaceFile(req, file, normalized.focus);
    fileAnalyses.push(result.analysis);
    latestRateLimit = result.rateLimit || latestRateLimit;
  }

  const workspaceRawOutput = await summarizeWorkspaceWithModel(req, {
    focus: normalized.focus,
    fileAnalyses,
    invalidFiles,
  });

  const normalizedOutput = normalizeFounderDocumentWorkspaceResponse({
    ...workspaceRawOutput.parsed,
    workspaceTitle: workspaceRawOutput.parsed?.workspaceTitle || 'Founder document workspace',
    filesAnalyzed:
      Array.isArray(workspaceRawOutput.parsed?.filesAnalyzed) && workspaceRawOutput.parsed.filesAnalyzed.length > 0
        ? workspaceRawOutput.parsed.filesAnalyzed
        : validFiles.map((file) => file.filename),
    fileAnalyses,
    extractionNotes: [
      ...(Array.isArray(workspaceRawOutput.parsed?.extractionNotes)
        ? workspaceRawOutput.parsed.extractionNotes
        : []),
      ...invalidFiles.map((file) => `${file.filename || 'Unsupported file'}: ${file.error}`),
    ],
  });

  if (!normalizedOutput.ok) {
    throw createHttpError(502, normalizedOutput.error);
  }

  return {
    ...normalizedOutput,
    __rateLimit: workspaceRawOutput.rateLimit || latestRateLimit,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const requestBody = await readJsonBody(req);
    if (Array.isArray(requestBody?.files)) {
      try {
        const workspaceOutput = await analyzeWorkspaceRequest(req, requestBody);
        applyRateLimitHeaders(res, workspaceOutput.__rateLimit);
        delete workspaceOutput.__rateLimit;
        return json(res, 200, workspaceOutput);
      } catch (error) {
        if (error?.statusCode === 503 && /aws_bearer_token_bedrock/i.test(cleanText(error.message))) {
          await resolveBackendSession({ req });
          return json(res, 200, buildDegradedWorkspaceAnalysis(requestBody, error.message));
        }

        throw error;
      }
    }

    const { normalized, missing, isValid, error } = validateFounderPdfSummaryRequest(requestBody || {});

    if (!isValid) {
      return json(res, 400, {
        ok: false,
        error,
        missing,
      });
    }

    const rawOutput =
      normalized.mode === 'annual-report'
        ? await summarizeLongDocumentWithModel(req, normalized)
        : await summarizeWithModel(req, normalized);
    const normalizedOutput = normalizeFounderPdfSummaryResponse({
      ...rawOutput.parsed,
      mode: rawOutput.parsed?.mode || normalized.mode,
      title: rawOutput.parsed?.title || normalized.filename,
    });

    if (!normalizedOutput.ok) {
      return json(res, 502, normalizedOutput);
    }

    applyRateLimitHeaders(res, rawOutput.rateLimit);
    return json(res, 200, normalizedOutput);
  } catch (error) {
    if (error?.statusCode === 400 || isJsonParseError(error)) {
      return json(res, 400, {
        ok: false,
        error: cleanText(error?.message) || 'Malformed JSON request body.',
      });
    }

    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    applyRateLimitHeaders(res, error?.rateLimit);
    const message = cleanText(error?.message) || 'Founder PDF summarization failed.';

    return json(res, statusCode, {
      ok: false,
      error: message,
    });
  }
}
