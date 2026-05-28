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
import { resolveBackendSession } from './_lib/founderBackendGuard.js';

const SYSTEM_PROMPT = [
  'You are a founder reporting editor.',
  'Turn messy founder materials into one concise, honest founder update.',
  'Prioritize signal, not completeness.',
  'Surface weak evidence instead of hiding it.',
  'Do not invent reporting periods, wins, customers, launches, dates, or causes that are not stated in the source material.',
  'If the reporting period is not explicitly provided, use "Current period" and note the missing period in confidenceGaps.',
  'Treat every claim as evidence-bound: unsupported positives belong in confidenceGaps, not wins.',
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

function cleanList(values) {
  return Array.isArray(values) ? values.map(cleanText).filter(Boolean) : [];
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
    'Only include wins that are directly supported by notes or files.',
    'Do not infer a calendar month or year unless the input states it.',
    'If a metric improved, describe the metric movement without inventing the operational cause.',
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

function splitFounderStatements(value) {
  return cleanText(value)
    .split(/(?<=[.!?])\s+/)
    .map((statement) => cleanText(statement))
    .filter(Boolean)
    .slice(0, 8);
}

function getFounderEvidenceText(input = {}) {
  return [
    cleanText(input.contextNotes),
    cleanText(input.pastedNotes),
    ...(Array.isArray(input.files) ? input.files.map((file) => cleanText(file.filename)) : []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function hasExplicitReportingPeriod(input = {}) {
  const evidence = getFounderEvidenceText(input);
  return /\b(q[1-4]|fy\s?\d{2,4}|20\d{2}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(evidence);
}

function isSupportedByFounderEvidence(claim, evidenceText) {
  const normalizedClaim = cleanText(claim).toLowerCase();
  if (!normalizedClaim) return false;

  const metricSignals = ['mrr', 'arr', 'pipeline', 'cash', 'churn', 'revenue', 'burn', 'runway'];
  if (metricSignals.some((signal) => normalizedClaim.includes(signal) && evidenceText.includes(signal))) {
    return true;
  }

  const ignoredWords = new Set([
    'successfully',
    'contributing',
    'reflects',
    'based',
    'internal',
    'metrics',
    'customer',
    'customers',
    'clients',
  ]);
  const claimWords = normalizedClaim
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 5 && !ignoredWords.has(word));

  const matchedWords = claimWords.filter((word) => evidenceText.includes(word));
  return matchedWords.length >= 2;
}

function firstSupportedWinFromInput(input = {}) {
  const statements = splitFounderStatements(`${input.contextNotes || ''} ${input.pastedNotes || ''}`);
  return statements.find((statement) => /\b(grew|growth|increased|improved|expanded|shipped|signed|won)\b/i.test(statement));
}

function repairFounderUpdateOutput(output, input) {
  const evidenceText = getFounderEvidenceText(input);
  const nextOutput = {
    ...output,
    confidenceGaps: cleanList(output.confidenceGaps),
  };

  if (!hasExplicitReportingPeriod(input)) {
    const suppliedPeriod = cleanText(nextOutput.reportingPeriod);
    if (suppliedPeriod && suppliedPeriod.toLowerCase() !== 'current period') {
      nextOutput.confidenceGaps.push(`Reporting period was not supplied, so the model-proposed period "${suppliedPeriod}" was replaced.`);
    }
    nextOutput.reportingPeriod = 'Current period';
  }

  const wins = cleanList(nextOutput.wins);
  const supportedWins = wins.filter((win) => isSupportedByFounderEvidence(win, evidenceText));
  const removedWins = wins.filter((win) => !supportedWins.includes(win));

  if (removedWins.length > 0) {
    nextOutput.confidenceGaps.push(
      ...removedWins.map((win) => `Unsupported win removed from draft: ${win}`)
    );
  }

  if (supportedWins.length === 0) {
    const inputWin = firstSupportedWinFromInput(input);
    nextOutput.wins = inputWin
      ? [`Founder-provided positive signal: ${inputWin}`]
      : ['No source-backed win was supplied; keep this section cautious.'];
  } else {
    nextOutput.wins = supportedWins;
  }

  return nextOutput;
}

function getReadableFilePreview(file = {}) {
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

  const preview = Buffer.from(base64Payload, 'base64')
    .toString('utf8')
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .slice(0, 4)
    .join(' | ');

  return preview.length > 220 ? `${preview.slice(0, 217).trim()}...` : preview;
}

function buildDegradedFounderUpdate(input, reason) {
  const limitation = cleanText(reason) || 'The live model runtime is unavailable.';
  const statements = splitFounderStatements(input.pastedNotes);
  const sourcePreviews = input.files
    .map((file) => {
      const preview = getReadableFilePreview(file);
      return preview ? `${file.filename}: ${preview}` : '';
    })
    .filter(Boolean);
  const changedItems = statements.slice(0, 2).map((statement) => `Founder-provided note: ${statement}`);
  const statedWin = statements.find((statement) => /rose|grew|shipped|completed|signed|improved|fell/i.test(statement));
  const statedChallenge = statements.find((statement) => /risk|slipped|block|concern|churn|delay|trust/i.test(statement));
  const statedMetric = statements.find((statement) => /[$%]|\b(mrr|arr|burn|pipeline|revenue|cash)\b/i.test(statement));
  const statedAsk = statements.find((statement) => /\bask\b|introduction|need|help/i.test(statement));

  return {
    ok: true,
    title: 'Founder update (lower-confidence runtime fallback)',
    reportingPeriod: 'Current period',
    topline: 'Lower-confidence runtime fallback: your source material was preserved, but model-backed editing is unavailable. Review this draft before sharing.',
    whatChanged: changedItems.length > 0
      ? changedItems
      : ['No written period changes were supplied; uploaded files require manual review while the model runtime is unavailable.'],
    wins: [
      statedWin
        ? `Unverified founder-provided signal: ${statedWin}`
        : 'No verified win could be identified without model-backed interpretation.',
    ],
    challenges: [
      statedChallenge
        ? `Unverified founder-provided risk: ${statedChallenge}`
        : 'Model-backed interpretation is unavailable, so risks require manual review.',
    ],
    metricsAndProof: [
      statedMetric
        ? `Unverified founder-provided metric: ${statedMetric}`
        : sourcePreviews[0]
          ? `Readable source preview (unverified): ${sourcePreviews[0]}`
          : 'No metrics were verified while the model runtime is unavailable.',
    ],
    nextFocus: [
      cleanText(input.contextNotes)
        ? `Requested emphasis: ${cleanText(input.contextNotes)}`
        : 'Review the source inputs directly and rerun once model-backed editing is restored.',
    ],
    asks: statedAsk ? [`Founder-provided ask: ${statedAsk}`] : [],
    confidenceGaps: ['No model-backed interpretation or evidence validation was performed in this fallback output.'],
    extractionNotes: [
      `Lower-confidence runtime fallback: ${limitation}`,
      ...sourcePreviews.map((preview) => `Readable source preview retained: ${preview}`),
    ],
    sourceFiles: input.files.map((file) => file.filename),
    runtime: {
      fallbackUsed: true,
      fallbackReason: limitation,
    },
  };
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

    let modelResult;
    try {
      modelResult = await generateFounderUpdate(req, normalized);
    } catch (error) {
      if (error?.statusCode === 503 && /aws_bearer_token_bedrock/i.test(cleanText(error.message))) {
        await resolveBackendSession({ req });
        return json(res, 200, buildDegradedFounderUpdate(normalized, error.message));
      }

      throw error;
    }

    applyRateLimitHeaders(res, modelResult.rateLimit);
    const rawOutput = modelResult.parsed;
    const repairedOutput = repairFounderUpdateOutput(rawOutput, normalized);
    const normalizedOutput = normalizeFounderUpdateResponse({
      ...repairedOutput,
      title: repairedOutput?.title || 'Founder update',
      sourceFiles:
        Array.isArray(repairedOutput?.sourceFiles) && repairedOutput.sourceFiles.length > 0
          ? repairedOutput.sourceFiles
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
