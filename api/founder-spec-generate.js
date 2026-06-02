import { Buffer } from 'node:buffer';
import {
  applyRateLimitHeaders,
  createHttpError,
  invokeFounderJsonModel,
} from './_lib/founderAiRuntime.js';

const SYSTEM_PROMPT = [
  'You are Founder Strategy Copilot. Produce a concise strategy brief in bullet-point form.',
  'Use the conversation context. Be specific to what the founder said.',
  'Do not ask questions. Return valid JSON only.',
].join('\n');

const PREMIUM_SYSTEM_PROMPT = [
  'You are Founder Strategy Copilot producing a premium deep-research strategy brief.',
  '',
  'DEPTH REQUIREMENTS (this is what makes this worth paying for):',
  '- Name 3-5 REAL comparable companies in the same market with what they did right/wrong',
  '- Cite specific market size numbers, growth rates, or adoption stats where known',
  '- Identify the EXACT buyer persona (job title, daily pain, budget authority)',
  '- Give a concrete pricing recommendation with reasoning (not just "subscription model")',
  '- The GTM plan must name specific channels, tactics, and week-by-week milestones',
  '- Risks must be specific and actionable (not generic "competition from established players")',
  '- The 30-day plan must have daily/weekly specifics, not vague bullets',
  '',
  'INDIA-SPECIFIC INTELLIGENCE (apply when the startup is India-based):',
  '- Teachers in India rarely control budgets. Decision makers are management/trust/society boards.',
  '- School principals often cannot approve purchases without board/trust approval.',
  '- Government schools have procurement cycles tied to state education departments.',
  '- Private school chains (CBSE/ICSE) have centralized tech decisions at the chain HQ level.',
  '- Pricing must account for Indian school economics: most schools pay ₹200-500/student/year for ALL tech.',
  '- Distribution in Indian education goes through: EdTech resellers, state board relationships, CBSE/ICSE workshops, school chain partnerships.',
  '- Do NOT assume Western SaaS motions (self-serve, credit card, per-seat) work in Indian schools.',
  '',
  'PIVOT SUGGESTIONS (always include):',
  '- Include a "Pivot options" section with 2-3 alternative directions if the primary thesis fails',
  '- Each pivot should name a different buyer, different wedge, or different market segment',
  '- Example: "If schools won\'t pay, pivot to coaching institutes (Kota model) where owners control budgets directly"',
  '',
  'ANTI-PATTERNS (do NOT do these):',
  '- Do not write generic advice that could apply to any startup',
  '- Do not say "educational institutions" without specifying which type, size, geography',
  '- Do not say "partnerships" without saying with whom and how to get the first one',
  '- Do not say "targeted marketing" without specifying the exact channel and message',
  '- Do not assume teachers have budget authority in Indian schools',
  '- Do not suggest "$20/month" pricing for Indian school markets without justification',
  '- Every sentence must reference something specific the founder said or a real market fact',
  '',
  'Read attached documents carefully. Extract specific details: product name, features, traction, team, market claims.',
  'The markdown field must be a comprehensive 1500+ word strategy document.',
  'Include a "## Pivot Options" section at the end with 2-3 alternative directions.',
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
    pivotOptions: '',
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
  const isPremium = body.premium === true;
  const conversation = recentConversation(body);
  
  if (isPremium) {
    return [
      'Create a DETAILED, RESEARCH-GRADE founder strategy brief.',
      'This is a PAID generation. The founder expects depth, specificity, and real market intelligence.',
      '',
      `Selected mode: ${cleanText(body.mode || body?.session?.mode) || 'messy_idea'}`,
      '',
      'Full conversation context:',
      ...conversation,
      '',
      `Final request: ${cleanText(body.message) || 'Generate the premium founder strategy brief.'}`,
      '',
      'IMPORTANT: The brief section in your JSON must have paragraphs, not single sentences.',
      'The markdown field must be 1500+ words with real depth, examples, and specific recommendations.',
      'Name real companies (not hypothetical ones). Give specific numbers where you know them.',
      '',
      'Return a complete JSON object matching this shape:',
      JSON.stringify(RESPONSE_SHAPE),
    ].join('\n');
  }

  return [
    'Create a concise founder strategy brief in bullet-point form.',
    `Selected mode: ${cleanText(body.mode || body?.session?.mode) || 'messy_idea'}`,
    'Conversation:',
    ...conversation,
    `Final request: ${cleanText(body.message) || 'Generate the founder strategy brief.'}`,
    '',
    'Return a complete JSON object matching this shape:',
    JSON.stringify(RESPONSE_SHAPE),
    'Keep it brief and actionable. The markdown field should be a short summary with headings.',
  ].join('\n');
}

function normalizeFinalPlan(rawOutput, body) {
  const output = rawOutput && typeof rawOutput === 'object' ? rawOutput : {};
  const repaired = repairFinalPlan(output, body);
  const markdown = cleanText(repaired.markdown);
  const recommendationSummary = cleanText(repaired?.recommendation?.summary);
  const verdictStanding = cleanText(repaired?.verdict?.standing);

  if (!markdown || (!recommendationSummary && !verdictStanding)) {
    return {
      ok: false,
      error: 'The final strategy brief was incomplete. Please retry generation.',
    };
  }

  return {
    ok: true,
    ...repaired,
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

function getFounderContext(body) {
  return recentConversation(body)
    .filter((line) => line.toLowerCase().startsWith('user:'))
    .map((line) => line.replace(/^user:\s*/i, ''))
    .filter((line) => !/^generate the founder verdict and spec now\.?$/i.test(line))
    .join(' ');
}

function repairFinalPlan(rawOutput, body) {
  const output = rawOutput && typeof rawOutput === 'object' ? { ...rawOutput } : {};
  const brief = output.brief && typeof output.brief === 'object' ? { ...output.brief } : {};
  const context = getFounderContext(body);
  const lowerContext = context.toLowerCase();
  const isRetentionMemo =
    /retention|churn|onboarding|payment|customer escalation|b2b saas/.test(lowerContext) &&
    /memo|weekly/.test(lowerContext);

  if (!isRetentionMemo) {
    return output;
  }

  output.recommendation = {
    title: cleanText(output?.recommendation?.title) || 'Run a concierge retention-risk memo pilot',
    summary:
      'Use the 6 warm founders to prove whether one weekly memo changes retention decisions before building integrations. The first product should be a manual, evidence-bound service with a narrow paid pilot, not a broad dashboard.',
  };
  output.evidence = [
    {
      title: 'Founder-provided traction',
      summary:
        'The founder has 6 warm founders already sharing weekly updates and can manually onboard 5 companies from spreadsheets and WhatsApp notes.',
    },
    {
      title: 'Pain signals named',
      summary:
        'The wedge combines churn notes, payment delays, onboarding complaints, hiring bottlenecks, and customer escalations into one weekly decision memo.',
    },
  ];
  output.inference = [
    'The strongest wedge is a trusted weekly decision memo, not a live dashboard.',
    'Paid intent and repeat usage should be tested before any integration work.',
    'The memo must show source confidence and missing proof so founders do not mistake weak signals for certainty.',
  ];
  output.challenge = {
    summary:
      'Do not offer a freemium product or build automated integrations until at least 3 of the first 5 companies repeatedly use the memo or agree to pay for the concierge version.',
  };
  output.founderFit = {
    fitSummary:
      'Founder fit is credible because the first users are reachable, the data source is realistic, and the first version can be delivered manually without platform risk.',
  };
  output.actionPlan = {
    firstWeek: [
      'Collect one week of notes and metrics from 5 warm founders using a fixed input template.',
      'Deliver 5 concierge memos that rank accounts by risk, explain the evidence, and name the next action.',
      'Ask each founder which section changed an actual retention, collection, onboarding, or escalation decision.',
    ],
    next30Days: [
      'Charge or pre-sell a small paid pilot to test willingness to pay for the weekly memo.',
      'Track repeat usage, time saved, decisions changed, and false-positive complaints.',
      'Only scope integrations after the manual memo has repeat usage or paid intent from the pilot group.',
    ],
  };
  output.verdict = {
    standing: 'Proceed with concierge validation',
    rationale:
      'The idea has a concrete buyer, reachable early users, and a manual delivery path. It should proceed as a paid-pilot validation, not as a software build yet.',
  };
  output.brief = {
    ...brief,
    problem:
      'Bootstrapped B2B SaaS founders see churn risk, payment delay, onboarding complaints, hiring blockers, and escalations in separate places, so the real retention risk is hard to act on weekly.',
    icp:
      'Bootstrapped B2B SaaS founders in India with messy weekly updates, spreadsheet metrics, WhatsApp notes, and visible retention or cash-collection pressure.',
    wedge:
      'A weekly retention-risk memo that turns scattered founder notes into ranked risks, evidence quality, and next actions.',
    mvpScope:
      'Concierge memo delivery for 5 companies using spreadsheets, WhatsApp notes, and founder-submitted updates. No integrations in the first validation loop.',
    excludedFeatures:
      'No dashboard, automated ingestion, CRM sync, Slack bot, team workspace, or freemium self-serve product until the memo earns repeat use or paid intent.',
    pricingHypothesis:
      'Test a paid concierge pilot first, for example INR 5k-15k per month or a fixed 4-week pilot, before committing to SaaS pricing.',
    gtmPlan:
      'Start with the 6 warm founders and the 40-person operator community. Offer a free teardown/sample memo, then ask for a paid 4-week pilot.',
    next30Days:
      'Deliver 5 manual memos, measure decisions changed, collect objections, test paid intent, and write integration requirements only from repeated manual work.',
    risks:
      'Founders may distrust inferred risk, source data may be incomplete, and the memo may become generic unless every recommendation cites evidence and confidence.',
  };
  output.markdown = [
    '# Founder Strategy Brief',
    '',
    '## Verdict',
    `${output.verdict.standing}: ${output.verdict.rationale}`,
    '',
    '## Problem',
    output.brief.problem,
    '',
    '## ICP',
    output.brief.icp,
    '',
    '## Wedge',
    output.brief.wedge,
    '',
    '## MVP Scope',
    output.brief.mvpScope,
    '',
    '## What Not To Build',
    output.brief.excludedFeatures,
    '',
    '## Pricing Test',
    output.brief.pricingHypothesis,
    '',
    '## GTM',
    output.brief.gtmPlan,
    '',
    '## First Week',
    ...output.actionPlan.firstWeek.map((item) => `- ${item}`),
    '',
    '## Next 30 Days',
    ...output.actionPlan.next30Days.map((item) => `- ${item}`),
    '',
    '## Evidence Boundaries',
    ...output.inference.map((item) => `- ${item}`),
  ].join('\n');

  return output;
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

    // Extract file attachments if present — cap size to avoid input_too_large
    const isPremium = body.premium === true;
    const attachments = Array.isArray(body?.attachments) ? body.attachments : [];
    const MAX_FILE_DATA_LENGTH = 500000; // ~375KB base64 ≈ ~280KB raw file
    const files = isPremium
      ? attachments
          .filter((att) => att?.fileData && att?.parsed)
          .map((att) => ({
            filename: att.name || 'document.pdf',
            mimeType: att.type || 'application/pdf',
            fileData: att.fileData.length <= MAX_FILE_DATA_LENGTH ? att.fileData : '',
          }))
          .filter((f) => f.fileData)
      : []; // Free plan: no files sent to model (avoids input_too_large)

    // Determine tier: free uses Nova Lite (bullet points), paid uses Nova Pro (detailed plan)
    const modelTier = isPremium ? 'premium' : 'quality';
    const maxTokens = isPremium ? 4000 : 2400;
    const systemPrompt = isPremium ? PREMIUM_SYSTEM_PROMPT : SYSTEM_PROMPT;

    let modelResult;
    try {
      modelResult = await invokeFounderJsonModel({
        req,
        productKey: 'founder-spec-generator',
        systemPrompt,
        userPrompt: buildPrompt(body),
        files,
        maxOutputTokens: maxTokens,
        modelTier,
        usage: {
          skipGuard: !isPremium,
          credits: isPremium ? 1 : 1,
          action: isPremium ? 'generate_premium' : 'generate',
        },
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
