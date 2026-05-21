import { Buffer } from 'node:buffer';
import process from 'node:process';
import {
  normalizeFounderUpdateResponse,
  validateFounderUpdateRequest,
} from '../src/utils/founderUpdateGenerator.js';
import {
  applyRateLimitHeaders,
  createHttpError,
  invokeFounderJsonModel,
} from './_lib/founderAiRuntime.js';

const SYSTEM_PROMPT = [
  'You are a founder reporting editor.',
  'Turn messy founder materials into one concise, honest founder update.',
  'Prioritize signal, not completeness.',
  'Surface weak evidence instead of hiding it.',
  'Always return valid JSON only.',
].join('\n');

const RESPONSE_SHAPE = {
  title: '',
  reportingPeriod: '',
  topline: '',
  whatChanged: [''],
  wins: [''],
  challenges: [''],
  metricsAndProof: [''],
  nextFocus: [''],
  asks: [''],
  confidenceGaps: [''],
  extractionNotes: [''],
  sourceFiles: [''],
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

function buildFounderUpdatePrompt(input) {
  return [
    'Create one polished founder update from this mixed input set.',
    '',
    `Context notes: ${input.contextNotes || 'No extra context provided.'}`,
    `Pasted rough notes: ${input.pastedNotes || 'No pasted rough notes provided.'}`,
    `Source files: ${input.files.map((file) => file.filename).join(', ')}`,
    '',
    'Return one founder-ready update with signal-first sections.',
    'Match this shape and keep every top-level key present:',
    JSON.stringify(RESPONSE_SHAPE, null, 2),
    '',
    'Use concise list items and honest caveats.',
    'Prefer operating signal over filler.',
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

async function generateFounderUpdate(req, input) {
  const result = await invokeFounderJsonModel({
    req,
    productKey: 'founder-update-generator',
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildFounderUpdatePrompt(input),
    files: input.files,
    maxOutputTokens: 700,
    modelTier: 'cheap',
  });

  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const requestBody = await readJsonBody(req);
    const { normalized, isValid, error } = validateFounderUpdateRequest(requestBody || {});

    if (!isValid) {
      return json(res, 400, {
        ok: false,
        error,
      });
    }

    const modelResult = await generateFounderUpdate(req, normalized);
    applyRateLimitHeaders(res, modelResult.rateLimit);
    const rawOutput = modelResult.parsed;
    const normalizedOutput = normalizeFounderUpdateResponse({
      ...rawOutput,
      title: rawOutput?.title || 'Founder update',
      sourceFiles:
        Array.isArray(rawOutput?.sourceFiles) && rawOutput.sourceFiles.length > 0
          ? rawOutput.sourceFiles
          : normalized.files.map((file) => file.filename),
    });

    if (!normalizedOutput.ok) {
      return json(res, 502, normalizedOutput);
    }

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
    const message = cleanText(error?.message) || 'Founder update generation failed.';

    return json(res, statusCode, {
      ok: false,
      error: message,
    });
  }
}
