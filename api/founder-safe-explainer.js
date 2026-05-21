import { Buffer } from 'node:buffer';
import process from 'node:process';
import {
  SAFE_EXPLAINER_DISCLAIMER,
  normalizeFounderSafeExplainerResponse,
  validateFounderSafeExplainerRequest,
} from '../src/utils/founderSafeExplainer.js';
import {
  applyRateLimitHeaders,
  createHttpError,
  invokeFounderJsonModel,
} from './_lib/founderAiRuntime.js';

const SYSTEM_PROMPT = [
  'You are a founder-focused financing document explainer.',
  'Explain only what is actually supported by the uploaded PDF.',
  'Translate dense financing clauses into plain English without pretending to be legal counsel.',
  'Highlight founder-sensitive terms, unusual provisions, and questions for a lawyer.',
  'Do not provide legal advice or certainty.',
  'Always return valid JSON only.',
].join('\n');

const RESPONSE_SHAPE = {
  documentType: '',
  title: '',
  mode: 'safe',
  summary: '',
  clauseHighlights: [
    {
      clause: '',
      value: '',
      explanation: '',
      founderImpact: '',
    },
  ],
  founderWatchouts: [''],
  unusualClauses: [''],
  counselQuestions: [''],
  extractionQuality: {
    label: '',
    notes: [''],
  },
  disclaimer: SAFE_EXPLAINER_DISCLAIMER,
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function cleanText(value) {
  return String(value ?? '').trim();
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
      throw createHttpError(
        400,
        `Malformed JSON request body: ${cleanText(error.message) || 'Unable to parse JSON.'}`
      );
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
    throw createHttpError(
      400,
      `Malformed JSON request body: ${cleanText(error.message) || 'Unable to parse JSON.'}`
    );
  }
}

function buildUserPrompt(input) {
  const modeGuidance = {
    auto: [
      'Mode guidance: auto-detect',
      'Infer whether this is closest to a SAFE, a term sheet, or a convertible note.',
      'Set the mode field to the lens you actually used after reading the document.',
      'If uncertain, choose the closest financing document lens and say what stayed ambiguous.',
    ],
    safe: [
      'Mode guidance: SAFE',
      'Focus on valuation cap, discount, MFN, pro rata, side letters, investor rights, and anything unusual for founders.',
    ],
    'term-sheet': [
      'Mode guidance: term-sheet',
      'Focus on valuation, option pool treatment, liquidation preference, governance, protective provisions, and founder control.',
    ],
    'convertible-note': [
      'Mode guidance: convertible-note',
      'Focus on maturity, interest, conversion triggers, repayment risk, security, and any founder obligations.',
    ],
  };

  const selectedGuidance = modeGuidance[input.mode] || modeGuidance.auto;

  return [
    'Explain this startup financing PDF for a founder.',
    '',
    `Filename: ${input.filename}`,
    `Requested mode: ${input.mode}`,
    `Round context: ${input.roundContext || 'Not provided.'}`,
    `Focus: ${input.focus || 'General founder-oriented explanation.'}`,
    '',
    ...selectedGuidance,
    '',
    'Use this glossary when relevant so outputs stay stable:',
    '- Valuation cap: maximum valuation used for SAFE conversion pricing.',
    '- Discount: percentage reduction applied at conversion.',
    '- MFN: lets the investor benefit from better later SAFE terms.',
    '- Pro rata: investor right to maintain ownership in later rounds.',
    '- Liquidation preference: payout priority before common shareholders.',
    '- Protective provisions: actions requiring investor approval.',
    '',
    'Return JSON only.',
    'Match this shape and keep every top-level key present:',
    JSON.stringify(RESPONSE_SHAPE, null, 2),
    '',
    'Keep clauseHighlights concrete and clause-first.',
    'If the PDF is ambiguous or the scan quality is weak, say that in extractionQuality.notes.',
    `Set disclaimer to exactly: ${SAFE_EXPLAINER_DISCLAIMER}`,
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

async function explainWithModel(req, input) {
  return invokeFounderJsonModel({
    req,
    productKey: 'founder-safe-explainer',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(input),
    files: [input],
    maxOutputTokens: 900,
    modelTier: 'quality',
  });
}

export async function explainFounderSafeDocument(input, req) {
  const modelResult = await explainWithModel(req, input);
  const rawOutput = modelResult.parsed;
  const normalizedOutput = normalizeFounderSafeExplainerResponse({
    ...rawOutput,
    mode: rawOutput?.mode || input.mode,
    title: rawOutput?.title || input.filename,
    disclaimer: rawOutput?.disclaimer || SAFE_EXPLAINER_DISCLAIMER,
  });

  if (!normalizedOutput.ok) {
    throw createHttpError(502, normalizedOutput.error);
  }

  return {
    ...normalizedOutput,
    __rateLimit: modelResult.rateLimit,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const requestBody = await readJsonBody(req);
    const { normalized, missing, isValid, error } = validateFounderSafeExplainerRequest(
      requestBody || {}
    );

    if (!isValid) {
      return json(res, 400, {
        ok: false,
        error,
        missing,
      });
    }

    const normalizedOutput = await explainFounderSafeDocument(normalized, req);
    applyRateLimitHeaders(res, normalizedOutput.__rateLimit);
    delete normalizedOutput.__rateLimit;
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
    const message = cleanText(error?.message) || 'SAFE / term sheet explainer failed.';

    return json(res, statusCode, {
      ok: false,
      error: message,
    });
  }
}
