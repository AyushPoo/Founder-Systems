import { Buffer } from 'node:buffer';
import process from 'node:process';

const ONE_HOUR_MS = 60 * 60 * 1000;
const RATE_LIMIT_STORE = globalThis.__founderSystemsRateLimitStore || new Map();

if (!globalThis.__founderSystemsRateLimitStore) {
  globalThis.__founderSystemsRateLimitStore = RATE_LIMIT_STORE;
}

const PRODUCT_POLICIES = {
  'founder-update-generator': {
    modelTier: 'cheap',
    maxRequestsPerWindow: 6,
    windowMs: ONE_HOUR_MS,
    maxOutputTokens: 700,
    temperature: 0.1,
  },
  'founder-document-intelligence': {
    modelTier: 'cheap',
    maxRequestsPerWindow: 4,
    windowMs: ONE_HOUR_MS,
    maxOutputTokens: 850,
    temperature: 0.1,
  },
  'founder-document-intelligence-quality': {
    modelTier: 'quality',
    maxRequestsPerWindow: 3,
    windowMs: ONE_HOUR_MS,
    maxOutputTokens: 1100,
    temperature: 0.1,
  },
  'founder-safe-explainer': {
    modelTier: 'quality',
    maxRequestsPerWindow: 4,
    windowMs: ONE_HOUR_MS,
    maxOutputTokens: 900,
    temperature: 0.1,
  },
  'linkedin-candidate-screener': {
    modelTier: 'cheap',
    maxRequestsPerWindow: 12,
    windowMs: ONE_HOUR_MS,
    maxOutputTokens: 500,
    temperature: 0.05,
  },
  'founder-outreach-kit': {
    modelTier: 'cheap',
    maxRequestsPerWindow: 5,
    windowMs: ONE_HOUR_MS,
    maxOutputTokens: 950,
    temperature: 0.1,
  },
};

const BEDROCK_MODEL_IDS = {
  cheap: 'amazon.nova-micro-v1:0',
  quality: 'anthropic.claude-haiku-4-5-20251001-v1:0',
  premium: 'anthropic.claude-sonnet-4-6',
};

const TEXT_FORMATS = new Set(['txt', 'md', 'html', 'csv']);
const DOCUMENT_FORMATS = new Set(['pdf', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'html', 'txt', 'md']);
const MIME_TYPE_TO_FORMAT = new Map([
  ['application/pdf', 'pdf'],
  ['application/msword', 'doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
  ['application/vnd.ms-excel', 'xls'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
  ['text/csv', 'csv'],
  ['application/csv', 'csv'],
  ['text/plain', 'txt'],
  ['text/markdown', 'md'],
  ['text/html', 'html'],
]);

function cleanText(value) {
  return String(value ?? '').trim();
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

export function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function resolveBedrockApiKey() {
  return (
    cleanText(process.env.AWS_BEARER_TOKEN_BEDROCK) ||
    cleanText(process.env.BEDROCK_API_KEY) ||
    cleanText(process.env.FOUNDER_SYSTEMS_BEDROCK_API_KEY)
  );
}

function resolveBedrockRegion() {
  return (
    cleanText(process.env.BEDROCK_REGION) ||
    cleanText(process.env.AWS_REGION) ||
    'us-east-1'
  );
}

export function getBedrockModelId(modelTier = 'cheap') {
  const normalizedTier = cleanText(modelTier).toLowerCase();
  const envVarName = {
    cheap: 'BEDROCK_MODEL_CHEAP',
    quality: 'BEDROCK_MODEL_QUALITY',
    premium: 'BEDROCK_MODEL_PREMIUM',
  }[normalizedTier];

  const override = envVarName ? cleanText(process.env[envVarName]) : '';
  return override || BEDROCK_MODEL_IDS[normalizedTier] || BEDROCK_MODEL_IDS.cheap;
}

function getProductPolicy(productKey) {
  return PRODUCT_POLICIES[productKey] || PRODUCT_POLICIES['founder-update-generator'];
}

function parseDataUrl(value) {
  const raw = cleanText(value);
  const match = raw.match(/^data:([^;,]+);base64,([\s\S]+)$/i);

  return {
    mimeType: cleanText(match?.[1]).toLowerCase(),
    base64Payload: cleanText(match?.[2]),
  };
}

function getExtension(filename) {
  const normalized = cleanText(filename).toLowerCase();
  const dotIndex = normalized.lastIndexOf('.');
  return dotIndex >= 0 ? normalized.slice(dotIndex + 1) : '';
}

function getDocumentFormat({ filename = '', mimeType = '' } = {}) {
  const normalizedMimeType = cleanText(mimeType).toLowerCase();
  if (MIME_TYPE_TO_FORMAT.has(normalizedMimeType)) {
    return MIME_TYPE_TO_FORMAT.get(normalizedMimeType);
  }

  const extension = getExtension(filename);
  if (extension === 'tsv') {
    return 'txt';
  }
  if (extension === 'json' || extension === 'xml' || extension === 'rtf') {
    return 'txt';
  }
  return extension;
}

function sanitizeDocumentName(index) {
  return `Document-${index + 1}`;
}

function createTextContentBlock(text) {
  return { text };
}

function createDocumentContentBlocks(files = []) {
  const contentBlocks = [];

  files.forEach((file, index) => {
    const filename = cleanText(file?.filename) || `file-${index + 1}`;
    const mimeType = cleanText(file?.mimeType).toLowerCase();
    const { base64Payload } = parseDataUrl(file?.fileData);
    const format = getDocumentFormat({ filename, mimeType });

    if (!base64Payload || !format) {
      return;
    }

    if (DOCUMENT_FORMATS.has(format)) {
      contentBlocks.push({
        document: {
          format,
          name: sanitizeDocumentName(index),
          source: {
            bytes: base64Payload,
          },
        },
      });
      return;
    }

    if (TEXT_FORMATS.has(format) || format === 'txt') {
      const decoded = Buffer.from(base64Payload, 'base64').toString('utf8').trim();
      if (decoded) {
        contentBlocks.push(
          createTextContentBlock(`Document ${index + 1} (${filename})\n${decoded.slice(0, 12000)}`)
        );
      }
      return;
    }

    throw createHttpError(
      400,
      `The current Bedrock runtime cannot read ${filename} directly yet. Convert this file to PDF, DOCX, XLSX, CSV, TXT, HTML, or Markdown first.`
    );
  });

  return contentBlocks;
}

function extractResponseText(payload = {}) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (typeof payload?.choices?.[0]?.message?.content === 'string' && payload.choices[0].message.content.trim()) {
    return payload.choices[0].message.content.trim();
  }

  const content = Array.isArray(payload?.output?.message?.content) ? payload.output.message.content : [];
  const textParts = [];

  content.forEach((part) => {
    if (typeof part?.text === 'string' && part.text.trim()) {
      textParts.push(part.text.trim());
    }
  });

  return textParts.join('\n').trim();
}

export function parseJsonText(text) {
  const raw = cleanText(text);
  if (!raw) {
    throw new Error('Model response did not include JSON text.');
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

    throw new Error('Model response was not valid JSON.');
  }
}

function resolveIdentity(req) {
  const explicitEmail =
    cleanText(req?.headers?.['x-founder-user-email']) ||
    cleanText(req?.headers?.['x-user-email']) ||
    cleanText(req?.body?.userEmail);

  if (explicitEmail) {
    return explicitEmail.toLowerCase();
  }

  const forwardedFor = cleanText(req?.headers?.['x-forwarded-for']);
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return cleanText(req?.socket?.remoteAddress) || 'anonymous';
}

export function consumeProductRateLimit(productKey, req) {
  const policy = getProductPolicy(productKey);
  const identity = resolveIdentity(req);
  const now = Date.now();
  const windowStart = now - policy.windowMs;
  const bucketKey = `${productKey}:${identity}`;
  const timestamps = RATE_LIMIT_STORE.get(bucketKey) || [];
  const activeTimestamps = timestamps.filter((timestamp) => timestamp > windowStart);

  if (activeTimestamps.length >= policy.maxRequestsPerWindow) {
    const retryAfterSeconds = Math.max(1, Math.ceil((activeTimestamps[0] + policy.windowMs - now) / 1000));
    const error = createHttpError(
      429,
      'This tool is temporarily rate-limited to protect model spend. Please try again a little later.'
    );
    error.retryAfterSeconds = retryAfterSeconds;
    error.rateLimit = {
      limit: policy.maxRequestsPerWindow,
      remaining: 0,
      windowMs: policy.windowMs,
      retryAfterSeconds,
    };
    throw error;
  }

  activeTimestamps.push(now);
  RATE_LIMIT_STORE.set(bucketKey, activeTimestamps);

  return {
    limit: policy.maxRequestsPerWindow,
    remaining: Math.max(0, policy.maxRequestsPerWindow - activeTimestamps.length),
    windowMs: policy.windowMs,
    retryAfterSeconds: 0,
  };
}

export function applyRateLimitHeaders(res, rateLimit = {}) {
  if (!res || typeof res.setHeader !== 'function' || !rateLimit || typeof rateLimit !== 'object') {
    return;
  }

  if (Number.isFinite(rateLimit.limit)) {
    res.setHeader('X-RateLimit-Limit', String(rateLimit.limit));
  }
  if (Number.isFinite(rateLimit.remaining)) {
    res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  }
  if (Number.isFinite(rateLimit.windowMs)) {
    res.setHeader('X-RateLimit-Window-Ms', String(rateLimit.windowMs));
  }
  if (Number.isFinite(rateLimit.retryAfterSeconds) && rateLimit.retryAfterSeconds > 0) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
  }
}

export async function invokeFounderJsonModel({
  req,
  productKey,
  modelTier,
  systemPrompt,
  userPrompt,
  files = [],
  maxOutputTokens,
  temperature,
}) {
  const apiKey = resolveBedrockApiKey();

  if (!apiKey) {
    throw createHttpError(503, 'AWS_BEARER_TOKEN_BEDROCK is not configured.');
  }

  const policy = getProductPolicy(productKey);
  const rateLimit = consumeProductRateLimit(productKey, req);
  const region = resolveBedrockRegion();
  const selectedModelTier = modelTier || policy.modelTier;
  const modelId = getBedrockModelId(selectedModelTier);
  const outputTokenCap = clampNumber(
    maxOutputTokens,
    64,
    policy.maxOutputTokens,
    policy.maxOutputTokens
  );
  const payload = {
    system: [createTextContentBlock(systemPrompt)],
    messages: [
      {
        role: 'user',
        content: [createTextContentBlock(userPrompt), ...createDocumentContentBlocks(files)],
      },
    ],
    inferenceConfig: {
      maxTokens: outputTokenCap,
      temperature: clampNumber(temperature, 0, 1, policy.temperature),
    },
    requestMetadata: {
      product: productKey,
      model_tier: selectedModelTier,
    },
  };

  const response = await fetch(
    `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const responsePayload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      cleanText(responsePayload?.message) ||
      cleanText(responsePayload?.error?.message) ||
      cleanText(extractResponseText(responsePayload)) ||
      `Bedrock request failed with status ${response.status}.`;
    const error = createHttpError(502, message);
    error.rateLimit = rateLimit;
    throw error;
  }

  return {
    parsed: parseJsonText(extractResponseText(responsePayload)),
    rateLimit,
    modelId,
  };
}
