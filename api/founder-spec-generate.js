import { Buffer } from 'node:buffer';
import {
  applyRateLimitHeaders,
  createHttpError,
  invokeFounderJsonModel,
} from './_lib/founderAiRuntime.js';
import { resolveBackendSession } from './_lib/founderBackendGuard.js';

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
    excludedFeatures: '',
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

function buildDegradedFinalPlan(body, reason) {
  const contextLines = recentConversation(body)
    .filter((line) => line.toLowerCase().startsWith('user:'))
    .map((line) => line.replace(/^user:\s*/i, ''))
    .filter((line) => !/^generate the founder verdict and spec now\.?$/i.test(line));
  const lineBudget = contextLines.length
    ? Math.floor((800 - (contextLines.length * 3)) / contextLines.length)
    : 0;
  const statedContext = contextLines
    .map((line) => (
      `- ${line.length > lineBudget ? `${line.slice(0, lineBudget - 3).trim()}...` : line}`
    ))
    .join('\n');
  const limitation = cleanText(reason) || 'The live model runtime is unavailable.';

  return {
    ok: true,
    mode: 'show_recommendation',
    stage: 'final_verdict',
    activePanel: 'action_plan',
    confidence: 'low',
    session: {
      mode: cleanText(body.mode || body?.session?.mode) || 'messy_idea',
      answers: Array.isArray(body?.session?.answers) ? body.session.answers : [],
    },
    runtime: {
      turnType: 'fast',
      fallbackUsed: true,
      fallbackReason: limitation,
    },
    recommendation: {
      title: 'Validate the narrowest promised outcome first',
      summary: 'This is a lower-confidence provisional plan based only on the context you supplied; validate trust and willingness to pay before building integrations.',
    },
    evidence: [
      {
        title: 'Founder-provided context',
        summary: statedContext || 'No detailed context was available.',
      },
    ],
    inference: [
      'The painful workflow and payment willingness still require direct validation.',
      'Trust in uploaded data is a gating assumption, not proven demand.',
    ],
    challenge: {
      summary: 'Do not broaden into a full dashboard before proving one recurring decision memo earns trust.',
    },
    founderFit: {
      fitSummary: 'Proceed only with customer conversations and a lightweight manual prototype until evidence improves.',
    },
    actionPlan: {
      firstWeek: [
        'Interview reachable target users about their current workflow and trust objections.',
        'Create one manual output example using anonymized or synthetic data.',
      ],
      next30Days: [
        'Test one narrow deliverable and a concrete price with at least five target users.',
        'Proceed to integrations only after repeated usage or paid intent appears.',
      ],
    },
    verdict: {
      standing: 'Validate before building',
      rationale: 'The concept is specific enough to test, but evidence is not yet strong enough for confident implementation.',
    },
    brief: {
      problem: statedContext || 'A founder workflow needs clearer proof before implementation.',
      icp: 'Use the narrowly described user segment from the founder context.',
      wedge: 'Deliver one trusted recurring decision brief before expanding the product.',
      mvpScope: 'Manual or lightweight generation of one concise decision memo from supplied context.',
      excludedFeatures: 'Do not build broad dashboards, live integrations, or workflow automation before demand and trust are validated.',
      pricingHypothesis: 'Test willingness to pay directly before committing to a price point.',
      gtmPlan: 'Start with reachable users already named in the founder context.',
      next30Days: 'Run interviews, deliver manual samples, test price, and document objections.',
      risks: 'Data trust, weak evidence of urgency, and premature integrations.',
    },
    markdown: [
      '# Founder Strategy Brief (Lower-Confidence Runtime Fallback)',
      '',
      '## Runtime Unavailable',
      limitation,
      '',
      '## Context Used',
      statedContext || 'No detailed founder context was available.',
      '',
      '## Current Verdict',
      'Validate before building. The concept is specific enough to test, but demand and trust are not proven.',
      '',
      '## Narrow MVP',
      'Deliver one trusted recurring decision brief manually or with a lightweight prototype before expanding into integrations.',
      '',
      '## 30-Day Validation Plan',
      '- Interview reachable target users about their current process and trust objections.',
      '- Share one manual sample created from safe data.',
      '- Test willingness to pay for the narrow outcome.',
      '- Only proceed to integration work after repeated usage or paid intent.',
    ].join('\n'),
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

    await resolveBackendSession({ req });

    let modelResult;
    try {
      modelResult = await invokeFounderJsonModel({
        req,
        productKey: 'founder-spec-generator',
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildPrompt(body),
        maxOutputTokens: 2400,
        modelTier: 'quality',
      });
    } catch (error) {
      if (Number.isInteger(error?.statusCode) && error.statusCode >= 500) {
        applyRateLimitHeaders(res, error?.rateLimit);
        return json(res, 200, buildDegradedFinalPlan(body, error.message));
      }
      throw error;
    }

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
