import { Buffer } from 'node:buffer';
import process from 'node:process';
import {
  normalizeOutreachInput,
  normalizeOutreachOutput,
  validateOutreachInput,
} from '../src/utils/outreachCampaign.js';
import { buildOutreachCsvRows } from '../src/utils/outreachCampaignExport.js';
import {
  applyRateLimitHeaders,
  invokeFounderJsonModel,
} from './_lib/founderAiRuntime.js';

const SYSTEM_PROMPT = [
  'You are a founder-led outbound strategist.',
  'Be specific, concise, and plain-spoken.',
  'Challenge weak positioning before writing copy.',
  'Avoid generic SaaS filler, fake familiarity, placeholders, greetings, signatures, and spammy claims.',
  'Keep outputs compact and practical.',
  'Limit the campaign to 4 emails, 6 subject lines, 3 LinkedIn messages, and 4 objection replies.',
  'Keep each email under 90 words, each subject line under 7 words, each objection reply under 35 words.',
  'LinkedIn rules: connection request must NOT pitch the product — write one short observational sentence about their world or a shared context (under 200 characters). The Day 2 message opens with curiosity, not a follow-up. The Day 5 message asks one direct question only.',
  'Always return valid JSON only.',
].join('\n');

const RESPONSE_SHAPE = {
  diagnosticNotes: [''],
  fixBeforeSending: [''],
  icpSnapshot: {
    customer: '',
    buyerRole: '',
    painIntensity: '',
    buyingTrigger: '',
    whyTheyRespond: '',
  },
  positioningAngles: [
    {
      name: '',
      target: '',
      angle: '',
      whyItWorks: '',
      openingStyle: '',
    },
  ],
  emails: [
    {
      step: 1,
      title: '',
      subject: '',
      body: '',
      delayDays: 0,
    },
  ],
  subjectLines: [''],
  linkedinMessages: [
    {
      step: '',
      body: '',
    },
  ],
  objectionReplies: [
    {
      objection: '',
      reply: '',
    },
  ],
  csvRows: [],
};

const MAX_PROMPT_FIELD_CHARS = 320;
const MAX_PROMPT_LONG_FIELD_CHARS = 600;
const MAX_PROMPT_LIST_ITEMS = 6;
const MAX_PROMPT_ATTACHMENTS = 2;
const MAX_ATTACHMENT_EXCERPT_CHARS = 1400;
const MIN_USEFUL_EMAIL_CHARS = 120;

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

function limitPromptText(value, maxLength = MAX_PROMPT_FIELD_CHARS) {
  const text = cleanText(value);
  if (!text || text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function limitPromptList(values, itemMaxLength = MAX_PROMPT_FIELD_CHARS) {
  return cleanList(values)
    .slice(0, MAX_PROMPT_LIST_ITEMS)
    .map((value) => limitPromptText(value, itemMaxLength));
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
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

function collectAttachmentContext(attachments = []) {
  const lines = [];

  attachments.slice(0, MAX_PROMPT_ATTACHMENTS).forEach((file) => {
    if (!file || typeof file !== 'object') {
      return;
    }

    const name = limitPromptText(file.name, 80) || 'Untitled attachment';
    const excerpt = limitPromptText(file.excerpt, MAX_ATTACHMENT_EXCERPT_CHARS);
    const fileType = limitPromptText(file.type, 40);

    if (excerpt) {
      lines.push(`Attachment: ${name}\nType: ${fileType || 'unknown'}\nExcerpt:\n${excerpt}`);
      return;
    }

    lines.push(`Attachment: ${name}\nType: ${fileType || 'unknown'}\nExcerpt unavailable.`);
  });

  return lines.join('\n\n');
}

function buildUserPrompt(input, attachments = [], previousOutcomes = '') {
  const attachmentContext = collectAttachmentContext(attachments);
  const objections = limitPromptList(input.objections, 120);
  const channels = limitPromptList(input.channels, 40);
  const promptLines = [
    'Create a founder outbound campaign from this intake.',
    `Product name: ${limitPromptText(input.productName, 120)}`,
    `Offer: ${limitPromptText(input.offer, MAX_PROMPT_LONG_FIELD_CHARS)}`,
    `Target customer: ${limitPromptText(input.targetCustomer, 160)}`,
    `Buyer role: ${limitPromptText(input.buyerRole, 120)}`,
    `Pain point: ${limitPromptText(input.painPoint, MAX_PROMPT_LONG_FIELD_CHARS)}`,
    `Desired outcome: ${limitPromptText(input.desiredOutcome, MAX_PROMPT_LONG_FIELD_CHARS)}`,
    `CTA: ${limitPromptText(input.cta, 160)}`,
    `Tone: ${limitPromptText(input.tone, 120)}`,
    `Channels: ${channels.join(', ') || 'email'}`,
  ];

  if (input.proof) {
    promptLines.push(`Proof: ${limitPromptText(input.proof, MAX_PROMPT_LONG_FIELD_CHARS)}`);
  }

  if (input.pricing) {
    promptLines.push(`Pricing: ${limitPromptText(input.pricing, 160)}`);
  }

  if (input.geography) {
    promptLines.push(`Geography: ${limitPromptText(input.geography, 120)}`);
  }

  if (objections.length > 0) {
    promptLines.push(`Objections to address: ${objections.join(', ')}`);
  }

  if (input.competitors) {
    promptLines.push(`Competitors: ${limitPromptText(input.competitors, 220)}`);
  }

  if (input.industry) {
    promptLines.push(`Industry: ${limitPromptText(input.industry, 120)}`);
  }

  if (input.companySize) {
    promptLines.push(`Company size: ${limitPromptText(input.companySize, 120)}`);
  }

  if (input.triggerEvent) {
    promptLines.push(`Trigger event: ${limitPromptText(input.triggerEvent, 200)}`);
  }

  if (input.websiteUrl) {
    promptLines.push(`Website URL: ${limitPromptText(input.websiteUrl, 200)}`);
  }

  if (attachmentContext) {
    promptLines.push(`Attachment context:\n${attachmentContext}`);
  }

  if (previousOutcomes) {
    promptLines.push(limitPromptText(previousOutcomes, 1200));
  }

  promptLines.push(
    'Return JSON only.',
    'Populate every top-level key in this exact object shape:',
    JSON.stringify(RESPONSE_SHAPE),
    'Expect exactly 3 positioningAngles, 4 emails, 6 subjectLines, 3 linkedinMessages, and 4 objectionReplies.',
    'Keep diagnosticNotes to 2 short bullets and fixBeforeSending to 3 short bullets.',
    'Keep each whyItWorks, angle, objection reply, and strategist note short.',
    'Never return an empty object and never omit required keys.',
    'Do not use placeholders, greetings, or sign-offs.',
    'No markdown.',
    'Keep every field short and useful.',
    'Set csvRows to an empty array. The server will build export rows separately.',
  );

  return promptLines.join('\n');
}

function truncateSentence(value, maxLength) {
  const text = cleanText(value);
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function trimTerminalPunctuation(value) {
  return cleanText(value).replace(/[.!?]+$/g, '');
}

function toLowerSentenceFragment(value) {
  const text = trimTerminalPunctuation(value);
  if (!text) {
    return '';
  }
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function toGerundPhrase(value) {
  const text = toLowerSentenceFragment(value);
  return text
    .replace(/^get\b/i, 'getting')
    .replace(/^turn\b/i, 'turning')
    .replace(/^book\b/i, 'booking')
    .replace(/^make\b/i, 'making')
    .replace(/^send\b/i, 'sending');
}

function buildFallbackSubjects(input) {
  const product = trimTerminalPunctuation(input.productName) || 'your offer';

  return [
    `${product} sample?`,
    'Friday risk memo',
    'Before churn surprises',
    'Messy notes to actions',
    'Worth pressure-testing?',
    'Quick founder memo',
  ].map((subject) => truncateSentence(subject, 48));
}

function buildFallbackCampaign(input) {
  const product = trimTerminalPunctuation(input.productName) || 'Founder Outreach Kit';
  const customer = trimTerminalPunctuation(input.targetCustomer) || 'early-stage founders';
  const buyerRole = trimTerminalPunctuation(input.buyerRole) || 'Founder';
  const offer = trimTerminalPunctuation(input.offer) || 'a focused offer for this buyer';
  const painPoint = trimTerminalPunctuation(input.painPoint) || 'the current workflow is costly and frustrating';
  const desiredOutcome = trimTerminalPunctuation(input.desiredOutcome) || 'make meaningful progress';
  const offerFragment = toGerundPhrase(offer);
  const desiredOutcomeFragment = toGerundPhrase(desiredOutcome);
  const cta = cleanText(input.cta) || 'Open to a quick look?';
  const proof = trimTerminalPunctuation(input.proof) || 'No proof provided yet';
  const triggerEvent = trimTerminalPunctuation(input.triggerEvent) || painPoint;
  const channels = cleanList(input.channels);
  const primaryChannel = channels[0] || 'email';
  const subjectLines = buildFallbackSubjects(input);

  return {
    diagnosticNotes: [
      'Deterministic fallback campaign generated locally.',
      `Primary channel emphasis was set to ${primaryChannel}.`,
      `Proof signal remains thin: ${proof}.`,
    ],
    fixBeforeSending: [
      'Add one concrete proof point, even if it is a small case study or a quantified founder result.',
      'Confirm the CTA is easy to answer in one line.',
      'Pressure-test the stated trigger event before sending at scale.',
    ],
    icpSnapshot: {
      customer,
      buyerRole,
      painIntensity: `Pain centers on: ${painPoint}`,
      buyingTrigger: triggerEvent,
      whyTheyRespond: `Their stated outcome is: ${desiredOutcome}.`,
    },
    positioningAngles: [
      {
        name: 'Current pain',
        target: buyerRole,
        angle: `Address the immediate problem directly: ${painPoint}`,
        whyItWorks: 'It starts with the stated workflow pain rather than an invented trigger.',
        openingStyle: 'Direct pain opener',
      },
      {
        name: 'Outcome path',
        target: customer,
        angle: `Connect this offer to the stated outcome: ${desiredOutcome}.`,
        whyItWorks: 'It connects the promised deliverable to the stated outcome.',
        openingStyle: 'Outcome-led opener',
      },
      {
        name: 'Credibility angle',
        target: customer,
        angle: proof === 'No proof provided yet'
          ? 'Be explicit that validation is still early rather than overstating confidence.'
          : `Lead with the available proof without overstating it: ${proof}`,
        whyItWorks: 'It keeps the campaign honest about the strength of the evidence.',
        openingStyle: 'Credibility opener',
      },
    ],
    emails: [
      {
        step: 1,
        title: 'Cold opener',
        subject: subjectLines[0],
        body: [
          `Noticed a pattern with ${customer}: ${painPoint}.`,
          `${product} helps with ${offerFragment}.`,
          proof === 'No proof provided yet' ? `If this is live for you, ${cta}` : `Current proof: ${proof}. ${cta}`,
        ].join('\n\n'),
        delayDays: 0,
      },
      {
        step: 2,
        title: 'Problem reframing',
        subject: subjectLines[1],
        body: [
          `The painful part is not tracking more data. It is deciding what matters before the next churn or cash surprise.`,
          `That is why ${product} starts from ${triggerEvent}.`,
          `Happy to send a small example if useful.`,
        ].join('\n\n'),
        delayDays: 2,
      },
      {
        step: 3,
        title: 'Proof and specificity follow-up',
        subject: subjectLines[2],
        body: [
          proof === 'No proof provided yet'
            ? `Keeping this honest: proof is still early, so I would treat this as a focused validation conversation.`
            : `The early signal: ${proof}.`,
          `The output is practical: ${desiredOutcome}.`,
          `${cta}`,
        ].join('\n\n'),
        delayDays: 5,
      },
      {
        step: 4,
        title: 'Low-friction close',
        subject: subjectLines[3],
        body: [
          `Closing the loop in case this is still showing up: ${painPoint}.`,
          `${product} is probably only worth a look if ${desiredOutcomeFragment} would change your week.`,
          `${cta}`,
        ].join('\n\n'),
        delayDays: 8,
      },
    ],
    subjectLines,
    linkedinMessages: [
      {
        step: 'connection_request',
        body: truncateSentence(
          `Working with ${customer} around this problem: ${painPoint}. Thought it might be relevant to your current priorities.`,
          260
        ),
      },
      {
        step: 'day_2_follow_up',
        body: `Thanks for connecting. The short version: ${product} is designed to help ${customer} achieve this outcome: ${desiredOutcome}.`,
      },
      {
        step: 'day_5_nudge',
        body: `If this problem is still active, I can send over a tighter message angle built around ${triggerEvent}.`,
      },
    ],
    objectionReplies: [
      {
        objection: 'Not interested',
        reply: `Fair enough. If ${desiredOutcomeFragment} becomes more urgent later, I can send a tighter example built around your exact offer.`,
      },
      {
        objection: 'We already do outbound',
        reply: `Makes sense. The question is whether ${painPoint} is already solved well enough, or whether a focused alternative is worth reviewing.`,
      },
      {
        objection: 'No time right now',
        reply: `Understood. That is why the next step stays small: ${cta}`,
      },
      {
        objection: 'Need to see proof',
        reply: `Reasonable. The first thing I would add is a concrete proof layer so the message earns the ask instead of hoping tone alone carries it.`,
      },
    ],
    csvRows: [],
  };
}


function withFallbackDiagnostic(fallbackCampaign, reason) {
  const message = cleanText(reason);
  const diagnosticNotes = [
    `Live model generation failed, so a deterministic fallback campaign was returned${message ? `: ${message}` : '.'}`,
    ...cleanList(fallbackCampaign.diagnosticNotes),
  ];

  return {
    ...fallbackCampaign,
    diagnosticNotes,
  };
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



function mergeCampaignWithFallback(rawCampaign, fallbackCampaign) {
  const source = rawCampaign && typeof rawCampaign === 'object' && !Array.isArray(rawCampaign)
    ? rawCampaign
    : {};
  const repairedSections = [];

  const pickArray = (key) => {
    if (Array.isArray(source[key]) && source[key].length > 0) {
      return source[key];
    }

    repairedSections.push(key);
    return fallbackCampaign[key];
  };

  const pickObject = (key) => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      return {
        ...fallbackCampaign[key],
        ...source[key],
      };
    }

    repairedSections.push(key);
    return fallbackCampaign[key];
  };

  const merged = {
    ...fallbackCampaign,
    ...source,
    diagnosticNotes: pickArray('diagnosticNotes'),
    fixBeforeSending: pickArray('fixBeforeSending'),
    icpSnapshot: pickObject('icpSnapshot'),
    positioningAngles: pickArray('positioningAngles'),
    emails: pickArray('emails'),
    subjectLines: pickArray('subjectLines'),
    linkedinMessages: pickArray('linkedinMessages'),
    objectionReplies: pickArray('objectionReplies'),
    csvRows: Array.isArray(source.csvRows) ? source.csvRows : [],
  };

  if (repairedSections.length > 0) {
    merged.diagnosticNotes = [
      `Some campaign sections were completed from the local fallback scaffold: ${repairedSections.join(', ')}.`,
      ...cleanList(merged.diagnosticNotes),
    ];
  }

  return merged;
}

function countInputMatches(value, input) {
  const haystack = cleanText(value).toLowerCase();
  if (!haystack) {
    return 0;
  }

  const phrases = [
    input.productName,
    input.offer,
    input.targetCustomer,
    input.buyerRole,
    input.painPoint,
    input.desiredOutcome,
    input.proof,
    input.pricing,
    input.cta,
    input.triggerEvent,
  ]
    .map((phrase) => cleanText(phrase).toLowerCase())
    .filter((phrase) => phrase.length >= 12);

  return phrases.filter((phrase) => haystack.includes(phrase.slice(0, Math.min(phrase.length, 52)))).length;
}

function hasGenericOutreachDrift(value) {
  return /\b(automate risk tracking|scale risk management|saves time, reduces errors|last chance pilot|free sample inside|pilot offer\?|confirm pilot\?|risk automation|time saver|growth focus)\b/i.test(
    cleanText(value)
  );
}

function isUsefulEmail(email = {}, input) {
  const body = cleanText(email.body);
  if (body.length < MIN_USEFUL_EMAIL_CHARS) {
    return false;
  }

  const combined = `${email.subject || ''}\n${body}`;
  if (hasGenericOutreachDrift(combined)) {
    return false;
  }

  return countInputMatches(combined, input) >= 1;
}

function isUsefulAngle(angle = {}, input) {
  const combined = `${angle.name || ''}\n${angle.target || ''}\n${angle.angle || ''}\n${angle.whyItWorks || ''}`;
  if (hasGenericOutreachDrift(combined)) {
    return false;
  }

  return countInputMatches(combined, input) >= 1;
}

function repairWeakCampaignOutput(campaign, fallbackCampaign, input) {
  const repairs = [];
  const emails = Array.isArray(campaign.emails) ? campaign.emails : [];
  const angles = Array.isArray(campaign.positioningAngles) ? campaign.positioningAngles : [];
  const subjectLines = Array.isArray(campaign.subjectLines) ? campaign.subjectLines : [];

  let repaired = campaign;

  const shouldRepairEmails = emails.length < 3 || emails.some((email) => !isUsefulEmail(email, input));

  if (shouldRepairEmails) {
    repairs.push('emails');
    repaired = {
      ...repaired,
      emails: fallbackCampaign.emails,
    };
  }

  if (angles.length < 3 || angles.some((angle) => !isUsefulAngle(angle, input))) {
    repairs.push('positioningAngles');
    repaired = {
      ...repaired,
      positioningAngles: fallbackCampaign.positioningAngles,
    };
  }

  if (
    shouldRepairEmails ||
    subjectLines.length < 4 ||
    subjectLines.some((subject) => hasGenericOutreachDrift(subject) || cleanText(subject).length < 8)
  ) {
    repairs.push('subjectLines');
    repaired = {
      ...repaired,
      subjectLines: fallbackCampaign.subjectLines,
    };
  }

  if (repairs.length === 0) {
    return repaired;
  }

  return {
    ...repaired,
    diagnosticNotes: [
      `Weak model campaign sections were repaired from the founder-specific scaffold: ${repairs.join(', ')}.`,
      ...cleanList(repaired.diagnosticNotes),
    ],
    fixBeforeSending: cleanList(repaired.fixBeforeSending).filter((item) => !hasGenericOutreachDrift(item)),
  };
}



async function generateWithModel({ systemPrompt, userPrompt, normalizedInput }) {
  if (
    !process.env.AWS_BEARER_TOKEN_BEDROCK &&
    !process.env.BEDROCK_API_KEY &&
    !process.env.FOUNDER_SYSTEMS_BEDROCK_API_KEY
  ) {
    return withFallbackDiagnostic(
      buildFallbackCampaign(normalizedInput),
      'Live Bedrock configuration is missing for Founder Outreach.'
    );
  }

  try {
    const modelResult = await invokeFounderJsonModel({
      req: normalizedInput.__request,
      productKey: 'founder-outreach-kit',
      systemPrompt,
      userPrompt,
      maxOutputTokens: 2200,
      modelTier: 'quality',
    });
    return {
      ...modelResult.parsed,
      __rateLimit: modelResult.rateLimit,
    };
  } catch (error) {
    if (Number.isInteger(error?.statusCode) && error.statusCode < 500) {
      throw error;
    }
    const fallback = withFallbackDiagnostic(buildFallbackCampaign(normalizedInput), error?.message);
    return {
      ...fallback,
      __rateLimit: error?.rateLimit || null,
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const requestBody = await readJsonBody(req);
    const normalizedInput = normalizeOutreachInput(requestBody || {});
    const { normalized, missing, isValid } = validateOutreachInput(normalizedInput);

    if (!isValid) {
      return json(res, 400, {
        ok: false,
        error: `Missing required fields: ${missing.join(', ')}`,
        missing,
      });
    }

    const rawOutput = await generateWithModel({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(normalized, normalized.attachments, cleanText(requestBody.previousOutcomes)),
      normalizedInput: {
        ...normalized,
        __request: req,
      },
    });
    applyRateLimitHeaders(res, rawOutput.__rateLimit);
    delete rawOutput.__rateLimit;
    const fallbackCampaign = buildFallbackCampaign(normalized);
    const hydratedOutput = repairWeakCampaignOutput(
      mergeCampaignWithFallback(rawOutput, fallbackCampaign),
      fallbackCampaign,
      normalized
    );

    const withMetadata = {
      ...hydratedOutput,
      normalizedInput: normalized,
      generatedAt: new Date().toISOString(),
    };

    const withCsvRows =
      Array.isArray(withMetadata.csvRows) && withMetadata.csvRows.length > 0
        ? withMetadata
        : {
            ...withMetadata,
            csvRows: buildOutreachCsvRows(withMetadata),
          };

    const normalizedOutput = normalizeOutreachOutput(withCsvRows);

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
    const message = cleanText(error?.message) || 'Campaign generation failed.';
    return json(res, statusCode, {
      ok: false,
      error: message,
    });
  }
}
