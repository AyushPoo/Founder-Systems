import { normalizeOutreachInput } from './outreachCampaign.js';

const VALID_TONES = ['direct', 'warm', 'founder-led', 'bold', 'consultative'];
const VALID_CHANNELS = ['email', 'linkedin'];
const VALID_MODES = ['beginner', 'advanced'];

const QUESTION_SEQUENCE = [
  'productName',
  'offer',
  'targetCustomer',
  'buyerRole',
  'painPoint',
  'desiredOutcome',
  'proof',
  'cta',
  'tone',
  'channels',
];

const BEGINNER_COPY = {
  productName: {
    label: 'What should we call this?',
    prompt: 'What name should show up in the outreach?',
    helper: 'Use the name a buyer would recognize quickly.',
    placeholder: 'Founder Outreach Kit',
  },
  offer: {
    label: 'What do you help people do?',
    prompt: 'In plain language, what do you help people get done?',
    helper: 'Think about the change you create, not the category label.',
    placeholder: 'We help founders turn a rough offer into a sendable outbound campaign.',
  },
  targetCustomer: {
    label: 'Who is this for?',
    prompt: 'When this works best, who is it usually for?',
    helper: 'A narrow answer helps. You can name a type of founder, team, or business.',
    placeholder: 'Bootstrapped B2B SaaS founders',
  },
  buyerRole: {
    label: 'Who usually says yes?',
    prompt: 'Who is the person most likely to reply, approve, or forward this?',
    helper: 'Pick the person who feels the pain and can say yes, even if the title is approximate.',
    placeholder: 'Founder / CEO',
  },
  painPoint: {
    label: 'What are they struggling with?',
    prompt: 'What frustrating thing keeps happening for them right now?',
    helper: 'Write it like the buyer would say it out loud.',
    placeholder: 'Outbound matters, but every draft sounds generic and never gets sent.',
  },
  desiredOutcome: {
    label: 'What do they want instead?',
    prompt: 'If this goes well, what result are they hoping for?',
    helper: 'Use a visible result like more replies, more calls, or a faster launch.',
    placeholder: 'Book the first 10 quality sales calls',
  },
  proof: {
    label: 'Why would they trust you?',
    prompt: 'Do you have any proof, experience, or result that helps them trust the message?',
    helper: 'Optional. Even one result, case study, or relevant background signal helps.',
    placeholder: 'Helped 12 founders ship campaigns in a day.',
    optional: true,
  },
  cta: {
    label: 'What should they do next?',
    prompt: 'What is the easiest next step you want them to take?',
    helper: 'Keep it small and easy to reply to.',
    placeholder: 'Open to a quick teardown?',
  },
  tone: {
    label: 'How should this sound?',
    prompt: 'What voice should the campaign use?',
    helper: 'If you are unsure, founder-led is usually a safe default.',
    placeholder: 'founder-led',
  },
  channels: {
    label: 'Where do you want to reach them?',
    prompt: 'Which channels should this campaign include?',
    helper: 'Email is the default anchor. LinkedIn helps when the buyer is active there.',
    placeholder: 'Email and LinkedIn',
  },
};

const ADVANCED_COPY = {
  productName: {
    label: 'Product name',
    prompt: 'What should I call the offer in the outreach?',
    helper: 'Use the name a prospect would recognize in a cold message.',
    placeholder: 'Founder Outreach Kit',
  },
  offer: {
    label: 'What do you sell?',
    prompt: 'In one or two lines, what do you actually help people get done?',
    helper: 'Describe the before-and-after, not just the category.',
    placeholder: 'We turn a rough founder offer into a sendable outbound campaign.',
  },
  targetCustomer: {
    label: 'Best-fit customer',
    prompt: 'Who is the outreach for when it works best?',
    helper: 'A narrow slice beats a broad market. Think "bootstrapped B2B SaaS founders" over "small businesses."',
    placeholder: 'Bootstrapped B2B SaaS founders',
  },
  buyerRole: {
    label: 'Who usually replies or decides?',
    prompt: 'Who is the best person to reply, approve, or forward this?',
    helper: 'This does not need to be org-chart perfect. Use the person who feels the pain and can say yes, like a founder, growth lead, sales lead, or ops owner.',
    placeholder: 'Founder / CEO',
  },
  painPoint: {
    label: 'Pain point',
    prompt: 'What frustrating moment or bottleneck are they living through right now?',
    helper: 'Write the painful moment in plain English, as if the buyer said it out loud.',
    placeholder: 'Outbound matters, but every draft sounds generic and never gets sent.',
  },
  desiredOutcome: {
    label: 'Desired outcome',
    prompt: 'What concrete result are they hoping for if this goes well?',
    helper: 'Use a visible outcome, like more replies, more demos, or faster campaign launch.',
    placeholder: 'Book the first 10 quality sales calls',
  },
  proof: {
    label: 'Proof',
    prompt: 'Any proof, results, or credibility signal worth carrying into the messaging?',
    helper: 'Optional. Even one result, case study, or relevant background signal helps.',
    placeholder: 'Helped 12 founders ship campaigns in a day.',
    optional: true,
  },
  cta: {
    label: 'Call to action',
    prompt: 'What is the easiest next step you want them to take?',
    helper: 'Keep it easy to answer in one line.',
    placeholder: 'Open to a quick teardown?',
  },
  tone: {
    label: 'Tone',
    prompt: 'What founder voice should the campaign lean into?',
    helper: 'If you are unsure, founder-led is usually the safest default.',
    placeholder: 'founder-led',
  },
  channels: {
    label: 'Channels',
    prompt: 'Which channels should the campaign include?',
    helper: 'Email is the default anchor. LinkedIn helps when the buyer is active there.',
    placeholder: 'Email and LinkedIn',
  },
};

const CONSUMER_SIGNALS = ['b2c', 'consumer', 'creator', 'community', 'parents', 'students', 'patients'];
const B2B_SIGNALS = [
  'b2b',
  'saas',
  'startup',
  'founder',
  'ceo',
  'sales',
  'revenue',
  'pipeline',
  'prospect',
  'lead gen',
  'agency',
  'ops',
  'operations',
  'team',
  'company',
  'companies',
];
const UNCERTAINTY_PATTERNS = [
  "don't know",
  'dont know',
  'do not know',
  'not sure',
  'unsure',
  'idk',
  'no idea',
  'help me',
];

function cleanText(value) {
  return String(value || '').trim();
}

function includesAny(text, values) {
  return values.some((value) => text.includes(value));
}

function buildSuggestion(label, value = label) {
  return { label, value };
}

function resolveMode(mode) {
  return VALID_MODES.includes(mode) ? mode : 'beginner';
}

function getQuestionCopy(mode) {
  return resolveMode(mode) === 'advanced' ? ADVANCED_COPY : BEGINNER_COPY;
}

function parseTone(answer) {
  const value = cleanText(answer).toLowerCase();
  if (!value) {
    return '';
  }

  const exactMatch = VALID_TONES.find((tone) => tone === value);
  if (exactMatch) {
    return exactMatch;
  }

  if (value.includes('consult')) return 'consultative';
  if (value.includes('warm')) return 'warm';
  if (value.includes('bold')) return 'bold';
  if (value.includes('direct')) return 'direct';
  if (value.includes('founder')) return 'founder-led';

  return value;
}

function parseChannels(answer) {
  if (Array.isArray(answer)) {
    return answer.filter((value) => VALID_CHANNELS.includes(value));
  }

  const value = cleanText(answer).toLowerCase();
  const next = [];
  if (value.includes('email')) next.push('email');
  if (value.includes('linkedin') || value.includes('linked in')) next.push('linkedin');
  return [...new Set(next)];
}

function getBuyerRoleSuggestions(input = {}) {
  const normalized = normalizeOutreachInput(input);
  const audience = `${normalized.targetCustomer} ${normalized.offer}`.toLowerCase();

  if (audience.includes('founder') || audience.includes('ceo')) {
    return [buildSuggestion('Founder / CEO'), buildSuggestion('Head of Growth'), buildSuggestion('Sales leader')];
  }

  if (audience.includes('marketing') || audience.includes('growth')) {
    return [buildSuggestion('Head of Growth'), buildSuggestion('Marketing lead'), buildSuggestion('Founder / CEO')];
  }

  if (audience.includes('agency')) {
    return [buildSuggestion('Agency owner'), buildSuggestion('Client services lead'), buildSuggestion('Operations lead')];
  }

  return [buildSuggestion('Founder / CEO'), buildSuggestion('Operations lead'), buildSuggestion('Team lead')];
}

function getToneSuggestions(input = {}) {
  const normalized = normalizeOutreachInput(input);
  const hasProof = Boolean(normalized.proof);
  const b2b = shouldShowCompanySize(normalized);

  if (hasProof && b2b) {
    return [buildSuggestion('consultative'), buildSuggestion('direct'), buildSuggestion('founder-led')];
  }

  if (b2b) {
    return [buildSuggestion('founder-led'), buildSuggestion('direct'), buildSuggestion('warm')];
  }

  return [buildSuggestion('warm'), buildSuggestion('founder-led'), buildSuggestion('bold')];
}

function getChannelSuggestions(input = {}) {
  const normalized = normalizeOutreachInput(input);
  const audience = `${normalized.targetCustomer} ${normalized.buyerRole}`.toLowerCase();

  if (audience.includes('founder') || shouldShowCompanySize(normalized)) {
    return [buildSuggestion('Email + LinkedIn', ['email', 'linkedin']), buildSuggestion('Email only', ['email'])];
  }

  return [buildSuggestion('Email only', ['email']), buildSuggestion('Email + LinkedIn', ['email', 'linkedin'])];
}

export function shouldShowCompanySize(input = {}) {
  const normalized = normalizeOutreachInput(input);
  const haystack = `${normalized.targetCustomer} ${normalized.offer} ${normalized.industry} ${normalized.buyerRole}`.toLowerCase();

  if (!haystack) return false;
  if (includesAny(haystack, CONSUMER_SIGNALS)) return false;
  return includesAny(haystack, B2B_SIGNALS);
}

export function detectOutreachUncertainty(answer) {
  const value = cleanText(answer).toLowerCase();
  return Boolean(value) && UNCERTAINTY_PATTERNS.some((pattern) => value.includes(pattern));
}

export function applyOutreachAnswer(input = {}, key, answer) {
  const normalized = normalizeOutreachInput(input);

  if (key === 'channels') {
    return {
      ...normalized,
      channels: parseChannels(answer),
    };
  }

  if (key === 'tone') {
    return {
      ...normalized,
      tone: parseTone(answer) || normalized.tone,
    };
  }

  return {
    ...normalized,
    [key]:
      typeof answer === 'string'
        ? cleanText(answer)
        : Array.isArray(answer)
          ? answer
          : answer ?? normalized[key],
  };
}

export function getOutreachQuestionState(input = {}, key, mode = 'beginner') {
  const normalized = normalizeOutreachInput(input);
  const base = getQuestionCopy(mode)[key];

  if (!base) {
    return null;
  }

  if (key === 'buyerRole') {
    return { key, ...base, suggestions: getBuyerRoleSuggestions(normalized) };
  }

  if (key === 'tone') {
    return { key, ...base, suggestions: getToneSuggestions(normalized) };
  }

  if (key === 'channels') {
    return { key, ...base, suggestions: getChannelSuggestions(normalized) };
  }

  if (key === 'proof') {
    return {
      key,
      ...base,
      suggestions: [
        buildSuggestion('Client result'),
        buildSuggestion('Relevant founder background'),
        buildSuggestion('Skip for now', ''),
      ],
    };
  }

  if (key === 'cta') {
    return {
      key,
      ...base,
      suggestions: [
        buildSuggestion('Quick reply'),
        buildSuggestion('Short call'),
        buildSuggestion('Quick teardown'),
      ],
    };
  }

  if (key === 'productName') {
    return {
      key,
      ...base,
      suggestions: [
        buildSuggestion('Use my brand name'),
        buildSuggestion('Use a clear working name'),
        buildSuggestion('Keep it simple for now'),
      ],
    };
  }

  if (key === 'offer') {
    return {
      key,
      ...base,
      suggestions: [
        buildSuggestion('Done-for-you service'),
        buildSuggestion('Software tool'),
        buildSuggestion('Coaching or consulting'),
      ],
    };
  }

  if (key === 'targetCustomer') {
    return {
      key,
      ...base,
      suggestions: [
        buildSuggestion('Solo founders'),
        buildSuggestion('Small teams'),
        buildSuggestion('Agency owners'),
      ],
    };
  }

  if (key === 'painPoint') {
    return {
      key,
      ...base,
      suggestions: [
        buildSuggestion('They are wasting time'),
        buildSuggestion('Their current approach is not working'),
        buildSuggestion('They do not know how to start'),
      ],
    };
  }

  if (key === 'desiredOutcome') {
    return {
      key,
      ...base,
      suggestions: [
        buildSuggestion('More replies'),
        buildSuggestion('More calls booked'),
        buildSuggestion('Launch faster'),
      ],
    };
  }

  return { key, ...base, suggestions: [] };
}

export function getNextOutreachQuestion(input = {}, mode = 'beginner') {
  const normalized = normalizeOutreachInput(input);

  for (const key of QUESTION_SEQUENCE) {
    if (key === 'proof') {
      if (!normalized.proof) {
        return getOutreachQuestionState(normalized, key, mode);
      }
      continue;
    }

    if (key === 'channels') {
      if (normalized.channels.length === 0) {
        return getOutreachQuestionState(normalized, key, mode);
      }
      continue;
    }

    if (!cleanText(normalized[key])) {
      return getOutreachQuestionState(normalized, key, mode);
    }
  }

  return null;
}

export function getOutreachHelpResponse(input = {}, question, mode = 'beginner') {
  const suggestions = question?.suggestions?.length
    ? question.suggestions
    : getOutreachQuestionState(input, question?.key, mode)?.suggestions || [];

  const helper = question?.helper || 'Try one concrete answer and we can tighten it from there.';

  if (question?.key === 'proof') {
    return {
      message: `${helper}\n\nIf you do not have proof yet, that is okay. Try one of these or skip it for now.`,
      suggestions,
    };
  }

  if (question?.key === 'buyerRole') {
    return {
      message: `${helper}\n\nIf the title feels fuzzy, try one of these likely reply owners and we can refine it later.`,
      suggestions,
    };
  }

  return {
    message: `${helper}\n\nIf you are not sure yet, try one of these starting points and I will help shape it.`,
    suggestions,
  };
}

export function getOutreachApprovalSections(input = {}) {
  const normalized = normalizeOutreachInput(input);
  const audienceFields = [
    {
      key: 'targetCustomer',
      label: 'Best-fit customer',
      helper: 'Keep this narrow enough that the buyer feels seen.',
    },
    {
      key: 'buyerRole',
      label: 'Who usually replies or decides?',
      helper: 'Use the person who feels the pain and can say yes or forward it.',
    },
    {
      key: 'geography',
      label: 'Geography',
      helper: 'Optional. Useful when timing or language changes by market.',
    },
    {
      key: 'industry',
      label: 'Industry',
      helper: 'Optional. Add only if it sharpens the positioning.',
    },
  ];

  if (shouldShowCompanySize(normalized)) {
    audienceFields.push({
      key: 'companySize',
      label: 'Company size',
      helper: 'Optional. Helpful only when headcount changes the buying context.',
    });
  }

  return [
    {
      id: 'offer',
      title: 'Offer',
      fields: [
        {
          key: 'productName',
          label: 'Product name',
          helper: 'Use the name a prospect would recognize in the message.',
        },
        {
          key: 'offer',
          label: 'What do you sell?',
          helper: 'Focus on the transformation, not just the category.',
          textarea: true,
          rows: 4,
        },
        {
          key: 'websiteUrl',
          label: 'Website URL',
          helper: 'Optional. Handy when the offer needs a little more context.',
        },
      ],
    },
    {
      id: 'audience',
      title: 'Audience',
      fields: audienceFields,
    },
    {
      id: 'pain',
      title: 'Pain and proof',
      fields: [
        {
          key: 'painPoint',
          label: 'Main pain point',
          helper: 'Write the painful moment in plain English.',
          textarea: true,
          rows: 4,
        },
        {
          key: 'desiredOutcome',
          label: 'Desired outcome',
          helper: 'Use a concrete result the buyer cares about.',
        },
        {
          key: 'proof',
          label: 'Proof or credibility',
          helper: 'Optional, but worth adding if you have it.',
          textarea: true,
          rows: 3,
        },
      ],
    },
    {
      id: 'campaign',
      title: 'Campaign setup',
      fields: [
        {
          key: 'pricing',
          label: 'Pricing or offer structure',
          helper: 'Optional. Mention the shape of the offer if it affects the copy.',
        },
        {
          key: 'cta',
          label: 'Primary call to action',
          helper: 'Keep it easy to answer in one line.',
        },
        {
          key: 'competitors',
          label: 'Competitors',
          helper: 'Optional. Helpful when the message needs sharper differentiation.',
        },
        {
          key: 'triggerEvent',
          label: 'Trigger event',
          helper: 'Optional. Useful if there is a timely reason to reach out now.',
        },
        {
          key: 'objections',
          label: 'Common objections',
          helper: 'Comma-separated. These shape objection handling later.',
          textarea: true,
          rows: 3,
        },
      ],
    },
  ];
}

export function getOutreachAssumptionSignals(input = {}) {
  const normalized = normalizeOutreachInput(input);
  const signals = [];

  if (normalized.targetCustomer) {
    signals.push({
      id: 'motion',
      label: 'Motion',
      value: shouldShowCompanySize(normalized) ? 'Likely B2B outreach' : 'Broader or non-B2B outreach',
    });
  }

  if (normalized.targetCustomer && !normalized.buyerRole) {
    signals.push({
      id: 'likely-buyer',
      label: 'Likely reply owner',
      value: getBuyerRoleSuggestions(normalized)[0].label,
    });
  }

  if (normalized.offer && !normalized.channels.length) {
    signals.push({
      id: 'channel-suggestion',
      label: 'Suggested channels',
      value: getChannelSuggestions(normalized)[0].label,
    });
  }

  if (normalized.offer && !normalized.proof) {
    signals.push({
      id: 'proof-gap',
      label: 'Likely gap',
      value: 'Add one proof point before generation if you can.',
    });
  }

  return signals;
}
