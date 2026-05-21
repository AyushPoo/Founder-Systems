import { Buffer } from 'node:buffer';
import process from 'node:process';
import {
  normalizeFounderUpdateResponse,
  validateFounderUpdateRequest,
} from '../src/utils/founderUpdateGenerator.js';

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

async function generateFounderUpdate(input) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw createHttpError(503, 'OPENAI_API_KEY is not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [
            ...input.files.map((file) => ({
              type: 'input_file',
              filename: file.filename,
              file_data: file.fileData,
            })),
            {
              type: 'input_text',
              text: buildFounderUpdatePrompt(input),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_object',
        },
      },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      cleanText(payload?.error?.message) ||
      cleanText(extractResponseText(payload)) ||
      `OpenAI request failed with status ${response.status}.`;
    throw createHttpError(502, message);
  }

  return parseModelJson(extractResponseText(payload));
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

    const rawOutput = await generateFounderUpdate(normalized);
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
    const message = cleanText(error?.message) || 'Founder update generation failed.';

    return json(res, statusCode, {
      ok: false,
      error: message,
    });
  }
}
