import { Buffer } from 'node:buffer';
import {
  applyRateLimitHeaders,
  createHttpError,
  invokeFounderJsonModel,
} from './_lib/founderAiRuntime.js';

const SYSTEM_PROMPT = [
  'You are Founder Strategy Copilot, producing the final decision-grade strategy brief.',
  'Use only the founder context supplied. State unknowns as assumptions or validation risks.',
  'Do not ask another question in this response.',
  'Return valid JSON only.',
].join('\n');

const RESPONSE_SHAPE = {
  mode: 'show_recommendation',
  stage: 'final_verdict',
  activePanel: 'action_plan',
  confidence: 'medium',
  recommendation: { title: '', summary: '' },
  evidence: [{ claim: '', basis: '' }],
  inference: [''],
  challenge: { summary: '' },
  founderFit: { fitSummary: '' },
  actionPlan: { firstWeek: [''], next30Days: [''] },
  verdict: { standing: '', rationale: '' },
  brief: {
    problem: '',
    icp: '',
    wedge: '',
    mvpScope: '',
    pricingHypothesis: '',
    gtmPlan: '',
    next30Days: '',
    risks: '',
  },
  markdown: '',
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function cleanText(value) {
  return String(value ?? '').trim();
}

async function readJsonBody(req) {
  if (req?.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req?.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw createHttpError(400, `Malformed JSON request body: ${cleanText(error.message)}`);
    }
  }

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', resolve);
    req.on('error', reject);
  });

  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    throw createHttpError(400, `Malformed JSON request body: ${cleanText(error.message)}`);
  }
}

function recentConversation(body) {
  return Array.isArray(body?.session?.messages)
    ? body.session.messages
        .slice(-10)
        .map((entry) => `${cleanText(entry?.role) || 'user'}: ${cleanText(entry?.content).slice(0, 900)}`)
        .filter((line) => !line.endsWith(': '))
    : [];
}

function buildPrompt(body) {
  return [
    'Create the final founder strategy brief now.',
    `Selected mode: ${cleanText(body.mode || body?.session?.mode) || 'messy_idea'}`,
    'Conversation:',
    ...recentConversation(body),
    `Final request: ${cleanText(body.message) || 'Generate the final founder strategy brief.'}`,
    '',
    'Return a complete JSON object matching this shape:',
    JSON.stringify(RESPONSE_SHAPE),
    'Keep the brief specific, concise, honest about evidence gaps, and usable for a 30-day decision.',
    'The markdown field must contain a readable export-ready brief with headings.',
  ].join('\n');
}

function normalizeFinalPlan(rawOutput, body) {
  const output = rawOutput && typeof rawOutput === 'object' ? rawOutput : {};
  const markdown = cleanText(output.markdown);
  const recommendationSummary = cleanText(output?.recommendation?.summary);
  const verdictStanding = cleanText(output?.verdict?.standing);

  if (!markdown || (!recommendationSummary && !verdictStanding)) {
    return {
      ok: false,
      error: 'The final strategy brief was incomplete. Please retry generation.',
    };
  }

  return {
    ok: true,
    ...output,
    mode: 'show_recommendation',
    stage: 'final_verdict',
    activePanel: 'action_plan',
    session: {
      mode: cleanText(body.mode || body?.session?.mode) || 'messy_idea',
      answers: Array.isArray(body?.session?.answers) ? body.session.answers : [],
    },
    markdown,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const body = await readJsonBody(req);
    if (body?.requestFinal !== true || recentConversation(body).length === 0) {
      return json(res, 400, {
        ok: false,
        error: 'A final strategy brief requires conversation context first.',
      });
    }

    const modelResult = await invokeFounderJsonModel({
      req,
      productKey: 'founder-spec-generator',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildPrompt(body),
      maxOutputTokens: 1200,
      modelTier: 'quality',
    });
    applyRateLimitHeaders(res, modelResult.rateLimit);
    const normalized = normalizeFinalPlan(modelResult.parsed, body);

    if (!normalized.ok) {
      return json(res, 502, normalized);
    }

    return json(res, 200, normalized);
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    applyRateLimitHeaders(res, error?.rateLimit);
    return json(res, statusCode, {
      ok: false,
      error: cleanText(error?.message) || 'Founder strategy brief generation failed.',
    });
  }
}
