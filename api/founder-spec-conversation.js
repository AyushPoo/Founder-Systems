import { Buffer } from 'node:buffer';
import {
  applyRateLimitHeaders,
  createHttpError,
  invokeFounderJsonModel,
} from './_lib/founderAiRuntime.js';

function cleanText(value) {
  return String(value ?? '').trim();
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req?.body && typeof req.body === 'object') return req.body;
  if (typeof req?.body === 'string' && req.body.trim()) return JSON.parse(req.body);

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', resolve);
    req.on('error', reject);
  });

  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

function getUserMessages(body = {}) {
  const sessionMessages = Array.isArray(body?.session?.messages) ? body.session.messages : [];
  return [
    ...sessionMessages.filter((entry) => entry?.role === 'user').map((entry) => cleanText(entry.content)),
    cleanText(body.message),
  ].filter(Boolean);
}

function getAttachmentFiles(body = {}) {
  const attachments = Array.isArray(body?.attachments) ? body.attachments : [];
  const MAX_FILE_DATA_LENGTH = 500000; // Cap to avoid input_too_large
  return attachments
    .filter((att) => att?.fileData && att?.parsed && att.fileData.length <= MAX_FILE_DATA_LENGTH)
    .map((att) => ({
      filename: att.name || 'document.pdf',
      mimeType: att.type || 'application/pdf',
      fileData: att.fileData,
    }));
}

function hasDocumentAttachments(body = {}) {
  const attachments = Array.isArray(body?.attachments) ? body.attachments : [];
  return attachments.some((att) => att?.fileData && att?.parsed);
}

function includesAny(text, terms) {
  const normalized = cleanText(text).toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function buildQuestion({ mode, joined, userCount }) {
  if (mode === 'no_idea') {
    if (userCount <= 1) {
      return {
        id: 'closest_user_group',
        prompt: 'Which group of people or companies can you reach fastest for the first 10 discovery conversations?',
        helperText: 'The fastest reachable group matters more than the biggest possible market right now.',
        placeholder: 'Example: bootstrapped SaaS founders in India, HR teams at 200-person companies...',
      };
    }
    return {
      id: 'painful_moment',
      prompt: 'What painful moment would make that group actively look for a better way this month?',
      helperText: 'Name the trigger or repeated frustration, not the broad category.',
    };
  }

  if (mode === 'messy_idea') {
    if (userCount <= 1) {
      return {
        id: 'weakest_assumption',
        prompt: 'Which assumption feels weakest right now: buyer urgency, distribution, willingness to pay, or your ability to deliver the first version?',
        helperText: 'Pick the riskiest assumption so the plan review can pressure-test the right thing.',
      };
    }
    return {
      id: 'first_proof',
      prompt: 'What proof would make you comfortable spending the next 30 days on this instead of changing direction?',
      helperText: 'A paid pilot, repeated usage, warm intros, or a manual delivery result are all valid answers.',
    };
  }

  if (userCount <= 1) {
    if (includesAny(joined, ['churn', 'retention', 'onboarding', 'payment', 'cash'])) {
      return {
        id: 'sharpest_retention_signal',
        prompt: 'Which signal is most painful for the buyer right now: churn risk, onboarding delay, payment delay, or customer escalation?',
        helperText: 'The first wedge should attach to the signal that already changes a founder decision.',
      };
    }
    if (includesAny(joined, ['outreach', 'sales', 'pipeline', 'leads'])) {
      return {
        id: 'first_distribution_asset',
        prompt: 'What distribution asset can you use immediately: warm founders, a niche community, existing customers, or manual outbound?',
        helperText: 'The first plan gets much stronger when it starts from a real reachable audience.',
      };
    }
    return {
      id: 'distribution_asset',
      prompt: 'What is your strongest real distribution asset for this idea today?',
      helperText: 'Examples: 6 warm users, a community, founder credibility, customer access, or a manual service path.',
    };
  }

  return {
    id: 'manual_validation',
    prompt: 'What is the smallest manual version you can deliver to prove the buyer wants this before building integrations?',
    helperText: 'Describe the concierge or spreadsheet-backed version that could be delivered this week.',
  };
}

function buildRecommendation({ mode, userMessages, joined }) {
  const retention = includesAny(joined, ['churn', 'retention', 'onboarding', 'payment', 'cash', 'mrr']);
  const hasDistribution = includesAny(joined, ['warm', 'community', 'contacts', 'founders', 'manual', 'concierge']);
  const title = retention
    ? 'Validate the retention-risk wedge manually first'
    : 'Validate the narrowest buyer pain before building';
  const summary = hasDistribution
    ? 'You have enough reachable-user signal for a provisional plan. Keep the first version manual, prove repeated use or paid intent, then build integrations only around the signal users trust.'
    : 'The idea is specific enough to test, but the distribution path still needs proof. Start with discovery and one manual sample before committing to product build.';

  return {
    ok: true,
    mode: 'show_recommendation',
    stage: 'planning',
    activePanel: 'action_plan',
    confidence: hasDistribution ? 'medium' : 'low',
    session: {
      mode,
      answers: userMessages.map((value, index) => ({ questionId: `answer_${index + 1}`, value })),
    },
    runtime: {
      turnType: 'fast',
      fallbackUsed: false,
      fallbackReason: '',
    },
    recommendation: { title, summary },
    evidence: [
      {
        title: 'Founder-provided signal',
        summary: userMessages.slice(-3).join(' '),
      },
    ],
    inference: [
      hasDistribution
        ? 'Reachable founder access makes concierge validation realistic.'
        : 'Distribution is still the biggest missing proof.',
      retention
        ? 'Retention risk is concrete enough to become the first wedge if buyers already act on it.'
        : 'The wedge should be tied to one painful, repeated buyer moment.',
    ],
    challenge: {
      summary: 'Do not build a broad dashboard or integration layer until one manual output earns trust and repeat usage.',
    },
    founderFit: {
      fitSummary: hasDistribution
        ? 'Founder fit is credible because the first users are reachable without paid acquisition.'
        : 'Founder fit is not yet proven because the first reachable audience is unclear.',
    },
    actionPlan: {
      firstWeek: [
        'Run 5 focused discovery calls with the narrowest reachable buyer group.',
        retention
          ? 'Manually produce one retention-risk memo from existing notes and metrics.'
          : 'Manually produce one sample deliverable that shows the promised change.',
      ],
      next30Days: [
        'Test willingness to pay or repeated usage before building integrations.',
        'Write down objections, trust concerns, and the exact trigger that caused interest.',
      ],
    },
    verdict: {
      standing: hasDistribution ? 'Proceed with manual validation' : 'Validate distribution first',
      rationale: summary,
    },
    brief: {
      problem: userMessages[0] || 'The founder has a direction that needs sharper validation.',
      icp: retention ? 'Bootstrapped B2B SaaS founders with visible retention or cash-collection pressure.' : 'The narrowest reachable buyer segment named by the founder.',
      wedge: retention ? 'A weekly retention-risk decision memo before a full dashboard.' : 'One manual outcome that proves the buyer wants the promise.',
      mvpScope: 'Concierge/manual delivery, one clear output, no integrations until trust is proven.',
      excludedFeatures: 'Broad dashboards, live integrations, workflow automation, and multi-person workspace complexity.',
      pricingHypothesis: 'Test a paid pilot or low-friction monthly memo before committing to software pricing.',
      gtmPlan: hasDistribution ? 'Start from warm founders and community contacts.' : 'Build a reachable list before product work.',
      next30Days: 'Interview, deliver manual samples, test price, document objections, and only then scope v1.',
      risks: 'Trust in source data, unclear urgency, and premature integration work.',
    },
    markdown: '',
  };
}

const AI_CONVERSATION_SYSTEM_PROMPT = [
  'You are Founder Strategy Copilot. The founder attached a document. Read it and respond.',
  'Return ONLY valid JSON. Keep it short. No markdown, no explanation outside JSON.',
  'Shape: {"ok":true,"mode":"ask_question","stage":"exploring","activePanel":"map","confidence":"low",',
  '"question":{"id":"doc_followup","prompt":"YOUR ONE QUESTION","helperText":"SHORT HELPER"},',
  '"advisory":{"whatIHeard":"2-SENTENCE SUMMARY OF WHAT THE DOCUMENT SAYS","currentRead":"YOUR READ ON VIABILITY"},',
  '"evidence":[{"title":"From the document","summary":"KEY FACTS YOU EXTRACTED"}],',
  '"inference":["ONE INSIGHT"],"recommendation":{"title":"SHORT TITLE","summary":"ONE SENTENCE"}}',
].join('\n');

const AI_RECOMMEND_SYSTEM_PROMPT = [
  'You are Founder Strategy Copilot. Produce a strategy recommendation based on the attached document and conversation.',
  'Return ONLY valid JSON. Be concise. No markdown outside JSON.',
  'Shape: {"ok":true,"mode":"show_recommendation","stage":"planning","activePanel":"action_plan",',
  '"confidence":"medium","recommendation":{"title":"string","summary":"string"},',
  '"evidence":[{"title":"string","summary":"string"}],"inference":["string"],',
  '"challenge":{"summary":"string"},"founderFit":{"fitSummary":"string"},',
  '"actionPlan":{"firstWeek":["string"],"next30Days":["string"]},',
  '"verdict":{"standing":"string","rationale":"string"},',
  '"brief":{"problem":"string","icp":"string","wedge":"string","mvpScope":"string","excludedFeatures":"string","pricingHypothesis":"string","gtmPlan":"string","next30Days":"string","risks":"string"}}',
].join('\n');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const body = await readJsonBody(req);
    const mode = cleanText(body.mode || body?.session?.mode) || 'known_idea';
    const userMessages = getUserMessages(body);
    const joined = userMessages.join(' ');
    const hasDocuments = hasDocumentAttachments(body);
    const shouldRecommend =
      userMessages.length >= 2 ||
      body.requestFinal === true ||
      /generate|verdict|plan|spec|final/i.test(cleanText(body.message));

    // If documents are attached, use the AI model (Bedrock can read PDFs natively)
    if (hasDocuments) {
      const files = getAttachmentFiles(body);
      const userPrompt = [
        `Mode: ${mode}`,
        `Founder message: ${cleanText(body.message) || 'Attached a document for review.'}`,
        userMessages.length > 1 ? `Previous context: ${userMessages.slice(0, -1).join(' | ')}` : '',
        shouldRecommend ? 'The founder has enough signal. Produce a recommendation now.' : 'Ask one sharp follow-up question based on what you read in the document.',
      ].filter(Boolean).join('\n');

      try {
        const modelResult = await invokeFounderJsonModel({
          req,
          productKey: 'founder-spec-generator',
          systemPrompt: shouldRecommend ? AI_RECOMMEND_SYSTEM_PROMPT : AI_CONVERSATION_SYSTEM_PROMPT,
          userPrompt,
          files,
          maxOutputTokens: shouldRecommend ? 2400 : 1400,
          modelTier: 'quality',
          usage: { skipGuard: true },
        });

        applyRateLimitHeaders(res, modelResult.rateLimit);
        const result = modelResult.parsed;

        // Ensure session data is included
        result.session = {
          mode,
          answers: userMessages.map((value, index) => ({ questionId: `answer_${index + 1}`, value })),
        };
        result.runtime = { turnType: 'ai', fallbackUsed: false, fallbackReason: '' };

        return json(res, 200, result);
      } catch (aiError) {
        // AI failed — fall through to rule-based handler silently
        // Do NOT propagate the raw error to the user
        applyRateLimitHeaders(res, aiError?.rateLimit);
        // Return a helpful response that acknowledges the document
        if (!shouldRecommend) {
          return json(res, 200, {
            ok: true,
            mode: 'ask_question',
            stage: 'exploring',
            activePanel: 'map',
            confidence: 'low',
            session: {
              mode,
              answers: userMessages.map((value, index) => ({ questionId: `answer_${index + 1}`, value })),
            },
            runtime: { turnType: 'fast', fallbackUsed: true, fallbackReason: 'Document analysis took too long. Using lightweight mode.' },
            question: {
              id: 'doc_context',
              prompt: 'I received your document but could not fully analyze it this time. Can you tell me in one sentence what the core product does and who the first buyer is?',
              helperText: 'A short plain-language summary helps me give you a sharper strategy read.',
            },
            advisory: {
              whatIHeard: `You attached ${files[0]?.filename || 'a document'}.`,
              currentRead: 'The document was received but the deeper analysis hit a limit. A text summary from you will let me continue.',
            },
            evidence: [],
            inference: [],
          });
        }
      }
    }

    // Rule-based fallback (no documents or AI failed)
    if (shouldRecommend) {
      return json(res, 200, buildRecommendation({ mode, userMessages, joined }));
    }

    return json(res, 200, {
      ok: true,
      mode: 'ask_question',
      stage: 'exploring',
      activePanel: 'map',
      confidence: 'low',
      session: {
        mode,
        answers: userMessages.map((value, index) => ({ questionId: `answer_${index + 1}`, value })),
      },
      runtime: {
        turnType: 'fast',
        fallbackUsed: false,
        fallbackReason: '',
      },
      question: buildQuestion({ mode, joined, userCount: userMessages.length }),
      advisory: {
        whatIHeard: userMessages[0] || '',
        currentRead: 'There is enough signal to ask one sharper validation question before producing the plan.',
        nextQuestion: '',
      },
      evidence: [],
      inference: [],
    });
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: cleanText(error?.message) || 'Founder strategy conversation failed.',
    });
  }
}
