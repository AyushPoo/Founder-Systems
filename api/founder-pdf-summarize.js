import { Buffer } from 'node:buffer';
import process from 'node:process';
import {
  normalizeFounderPdfSummaryResponse,
  validateFounderPdfSummaryRequest,
} from '../src/utils/founderPdfSummary.js';

const SYSTEM_PROMPT = [
  'You are a founder-specific document analyst.',
  'Read the PDF carefully and summarize only what is actually supported by the document.',
  'Focus on practical clarity, missing proof, risks, and next questions.',
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
  nextQuestions: [''],
  extractionQuality: {
    label: '',
    notes: [''],
  },
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
  };
  const selectedGuidance = modeGuidance[input.mode] || modeGuidance.auto;

  return [
    'Summarize this founder PDF for decision-making.',
    '',
    `Filename: ${input.filename}`,
    `Requested mode: ${input.mode}`,
    `Focus: ${input.focus || 'General summary with no extra emphasis.'}`,
    '',
    ...selectedGuidance,
    '',
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

async function summarizeWithModel(input) {
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
            {
              type: 'input_file',
              filename: input.filename,
              file_data: input.fileData,
            },
            {
              type: 'input_text',
              text: buildUserPrompt(input),
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
    const { normalized, missing, isValid, error } = validateFounderPdfSummaryRequest(requestBody || {});

    if (!isValid) {
      return json(res, 400, {
        ok: false,
        error,
        missing,
      });
    }

    const rawOutput = await summarizeWithModel(normalized);
    const normalizedOutput = normalizeFounderPdfSummaryResponse({
      ...rawOutput,
      mode: rawOutput?.mode || normalized.mode,
      title: rawOutput?.title || normalized.filename,
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
    const message = cleanText(error?.message) || 'Founder PDF summarization failed.';

    return json(res, statusCode, {
      ok: false,
      error: message,
    });
  }
}
