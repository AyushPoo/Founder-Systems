import { Buffer } from 'node:buffer';
import process from 'node:process';
import {
  normalizeOutreachInput,
  normalizeOutreachOutput,
  validateOutreachInput,
} from '../src/utils/outreachCampaign.js';
import { buildOutreachCsvRows } from '../src/utils/outreachCampaignExport.js';

const SYSTEM_PROMPT = [
  'You are a founder-led outbound strategist.',
  'Be specific, concise, and plain-spoken.',
  'Challenge weak positioning before writing copy.',
  'Avoid generic SaaS filler, fake familiarity, and spammy claims.',
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
  csvRows: [
    {
      step: '',
      channel: '',
      subject: '',
      body: '',
      delayDays: 0,
      goal: '',
    },
  ],
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

  attachments.forEach((file) => {
    if (!file || typeof file !== 'object') {
      return;
    }

    const name = cleanText(file.name) || 'Untitled attachment';
    const excerpt = cleanText(file.excerpt);
    const fileType = cleanText(file.type);

    if (excerpt) {
      lines.push(`Attachment: ${name}\nType: ${fileType || 'unknown'}\nExcerpt:\n${excerpt}`);
      return;
    }

    lines.push(`Attachment: ${name}\nType: ${fileType || 'unknown'}\nExcerpt unavailable.`);
  });

  return lines.join('\n\n');
}

function buildUserPrompt(input, attachments = []) {
  const attachmentContext = collectAttachmentContext(attachments);
  const objections = cleanList(input.objections);
  const channels = cleanList(input.channels);

  return [
    'Create a founder outbound campaign from this intake.',
    '',
    `Product name: ${input.productName}`,
    `Offer: ${input.offer}`,
    `Target customer: ${input.targetCustomer}`,
    `Buyer role: ${input.buyerRole}`,
    `Geography: ${input.geography || 'Unspecified'}`,
    `Pain point: ${input.painPoint}`,
    `Desired outcome: ${input.desiredOutcome}`,
    `Proof: ${input.proof || 'None provided'}`,
    `Pricing: ${input.pricing || 'Not shared'}`,
    `CTA: ${input.cta}`,
    `Tone: ${input.tone}`,
    `Channels: ${channels.join(', ') || 'email'}`,
    `Objections to address: ${objections.join(', ') || 'None provided'}`,
    `Competitors: ${input.competitors || 'None provided'}`,
    `Industry: ${input.industry || 'Unspecified'}`,
    `Company size: ${input.companySize || 'Unspecified'}`,
    `Trigger event: ${input.triggerEvent || 'Unspecified'}`,
    `Website URL: ${input.websiteUrl || 'Unspecified'}`,
    '',
    attachmentContext ? `Attachment context:\n${attachmentContext}` : 'Attachment context: None provided.',
    '',
    'Return JSON only.',
    'Match this shape and keep every top-level key present:',
    JSON.stringify(RESPONSE_SHAPE, null, 2),
    '',
    'Expect at least 3 positioningAngles, 4 emails, 6 subjectLines, 3 linkedinMessages, and 4 objectionReplies.',
  ].join('\n');
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

function buildFallbackSubjects(input) {
  const product = input.productName || 'your offer';
  const customer = input.targetCustomer || 'founders';
  const outcome = input.desiredOutcome || 'more replies';

  return [
    `Idea for ${customer} who want ${outcome}`,
    `${product}: a cleaner way to start outbound`,
    `Worth pressure-testing your current outreach?`,
    `Quick angle for ${input.buyerRole || 'the team'} at ${product}`,
    `A tighter outbound sequence for ${customer}`,
    `Could this help you get ${outcome}?`,
  ];
}

function buildFallbackCampaign(input) {
  const product = input.productName || 'Founder Outreach Kit';
  const customer = input.targetCustomer || 'early-stage founders';
  const buyerRole = input.buyerRole || 'Founder';
  const offer = input.offer || 'a founder-led outbound campaign generator';
  const painPoint = input.painPoint || 'outbound feels vague and inconsistent';
  const desiredOutcome = input.desiredOutcome || 'book more qualified calls';
  const cta = input.cta || 'Open to a quick look?';
  const proof = input.proof || 'No proof provided yet';
  const triggerEvent = input.triggerEvent || 'pipeline feels too dependent on referrals';
  const channels = cleanList(input.channels);
  const primaryChannel = channels[0] || 'email';
  const subjectLines = buildFallbackSubjects(input);

  return {
    diagnosticNotes: [
      'OPENAI_API_KEY is not configured, so this campaign was generated from a deterministic fallback.',
      `Primary channel emphasis was set to ${primaryChannel}.`,
      `Proof signal remains thin: ${proof}.`,
    ],
    fixBeforeSending: [
      'Add one concrete proof point, even if it is a small case study or a quantified founder result.',
      'Tighten the CTA so the ask feels easy to answer in one line.',
      'Pressure-test the offer against a sharper trigger event before sending at scale.',
    ],
    icpSnapshot: {
      customer,
      buyerRole,
      painIntensity: 'High when founder-led sales is still manual',
      buyingTrigger: triggerEvent,
      whyTheyRespond: `They want ${desiredOutcome} without sounding templated or hiring outbound help too early.`,
    },
    positioningAngles: [
      {
        name: 'Blank-page pain',
        target: `${buyerRole}s doing their own outbound`,
        angle: `Turn ${painPoint} into a sendable sequence in one sitting.`,
        whyItWorks: 'It names the immediate friction instead of promising abstract growth.',
        openingStyle: 'Direct pain opener',
      },
      {
        name: 'Founder-speed angle',
        target: customer,
        angle: `Use ${offer} to shorten the time between rough positioning and first outreach.`,
        whyItWorks: 'It respects that the buyer cares about speed and control more than fancy automation.',
        openingStyle: 'Fast-path opener',
      },
      {
        name: 'Signal-over-volume angle',
        target: customer,
        angle: `Send fewer, sharper messages that are tied to the buyer's real trigger instead of blasting generic copy.`,
        whyItWorks: 'It differentiates from spammy outbound and makes the campaign feel more credible.',
        openingStyle: 'Credibility opener',
      },
    ],
    emails: [
      {
        step: 1,
        title: 'Cold opener',
        subject: subjectLines[0],
        body: [
          `Saw that ${customer} often hit the same wall: ${painPoint}.`,
          `${product} helps a ${buyerRole.toLowerCase()} turn a rough offer into a usable outbound sequence without defaulting to generic SaaS copy.`,
          `If ${desiredOutcome} is a priority right now, ${cta}`,
        ].join('\n\n'),
        delayDays: 0,
      },
      {
        step: 2,
        title: 'Problem reframing',
        subject: subjectLines[1],
        body: [
          `Most founder-led outbound underperforms because the message tries to sound polished before the positioning is actually sharp.`,
          `The useful shift is to anchor each touchpoint around one buyer trigger, one believable promise, and one clear next step.`,
          `Happy to show what that would look like for ${customer}.`,
        ].join('\n\n'),
        delayDays: 2,
      },
      {
        step: 3,
        title: 'Proof and specificity follow-up',
        subject: subjectLines[2],
        body: [
          `One thing I would fix before scaling outreach: the proof layer still feels light.`,
          `Even a small result, teardown, or founder example can make the offer easier to trust.`,
          `If useful, I can sketch a version of the sequence that leans harder on specificity.`,
        ].join('\n\n'),
        delayDays: 5,
      },
      {
        step: 4,
        title: 'Low-friction close',
        subject: subjectLines[3],
        body: [
          `Closing the loop in case outbound is back on the list for this quarter.`,
          `${product} is built for teams that want ${desiredOutcome} without spending weeks rewriting copy.`,
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
          `Working on founder-led outbound for ${customer}. Thought a sharper angle on ${painPoint} might be relevant to what you are building.`,
          260
        ),
      },
      {
        step: 'day_2_follow_up',
        body: `Thanks for connecting. The short version: ${product} helps founders turn fuzzy positioning into a campaign that actually sounds like a person wrote it.`,
      },
      {
        step: 'day_5_nudge',
        body: `If outbound is still on your plate, I can send over a tighter message angle built around ${triggerEvent}.`,
      },
    ],
    objectionReplies: [
      {
        objection: 'Not interested',
        reply: `Fair enough. If ${desiredOutcome} becomes more urgent later, I can send a tighter example built around your exact offer.`,
      },
      {
        objection: 'We already do outbound',
        reply: `Makes sense. The gap is usually not sending volume, it is whether the sequence is anchored to one clear buyer trigger and believable proof.`,
      },
      {
        objection: 'No time right now',
        reply: `Understood. That is exactly why I would keep this lightweight: one sharper angle, one rewritten opener, and a sequence you can edit instead of start from scratch.`,
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

async function generateWithModel({ systemPrompt, userPrompt, normalizedInput }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildFallbackCampaign(normalizedInput);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemPrompt }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }],
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
      throw new Error(message);
    }

    return parseModelJson(extractResponseText(payload));
  } catch (error) {
    return withFallbackDiagnostic(buildFallbackCampaign(normalizedInput), error?.message);
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
      userPrompt: buildUserPrompt(normalized, normalized.attachments),
      normalizedInput: normalized,
    });

    const withMetadata = {
      ...rawOutput,
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

    const message = cleanText(error?.message) || 'Campaign generation failed.';
    return json(res, 500, {
      ok: false,
      error: message,
    });
  }
}
