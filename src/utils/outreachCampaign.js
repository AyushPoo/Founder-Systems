const REQUIRED_FIELDS = [
  'productName',
  'offer',
  'targetCustomer',
  'buyerRole',
  'painPoint',
  'desiredOutcome',
  'cta',
  'tone',
];

const VALID_TONES = ['direct', 'warm', 'founder-led', 'bold', 'consultative'];
const VALID_CHANNELS = ['email', 'linkedin'];

function cleanText(value) {
  return String(value || '').trim();
}

function cleanArray(values) {
  return Array.isArray(values) ? values : [];
}

function cleanObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function createOutreachDraft() {
  return {
    productName: '',
    offer: '',
    targetCustomer: '',
    buyerRole: '',
    geography: '',
    painPoint: '',
    desiredOutcome: '',
    proof: '',
    pricing: '',
    cta: '',
    tone: 'founder-led',
    channels: [],
    objections: [],
    competitors: '',
    industry: '',
    companySize: '',
    triggerEvent: '',
    websiteUrl: '',
    attachments: [],
  };
}

export function normalizeOutreachInput(input = {}) {
  const normalizedTone = cleanText(input.tone);

  return {
    ...createOutreachDraft(),
    productName: cleanText(input.productName),
    offer: cleanText(input.offer),
    targetCustomer: cleanText(input.targetCustomer),
    buyerRole: cleanText(input.buyerRole),
    geography: cleanText(input.geography),
    painPoint: cleanText(input.painPoint),
    desiredOutcome: cleanText(input.desiredOutcome),
    proof: cleanText(input.proof),
    pricing: cleanText(input.pricing),
    cta: cleanText(input.cta),
    tone: VALID_TONES.includes(normalizedTone) ? normalizedTone : 'founder-led',
    channels: [
      ...new Set(
        cleanArray(input.channels)
          .map((value) => cleanText(value).toLowerCase())
          .filter((value) => VALID_CHANNELS.includes(value))
      ),
    ],
    objections: cleanArray(input.objections).map(cleanText).filter(Boolean),
    competitors: cleanText(input.competitors),
    industry: cleanText(input.industry),
    companySize: cleanText(input.companySize),
    triggerEvent: cleanText(input.triggerEvent),
    websiteUrl: cleanText(input.websiteUrl),
    attachments: cleanArray(input.attachments),
  };
}

export function createOutreachInputSignature(input = {}) {
  const normalized = normalizeOutreachInput(input);

  return JSON.stringify({
    ...normalized,
    channels: [...normalized.channels].sort(),
    objections: [...normalized.objections].sort(),
    attachments: [...normalized.attachments].map((entry) => ({
      id: cleanText(entry?.id),
      name: cleanText(entry?.name),
      size: Number(entry?.size) || 0,
      type: cleanText(entry?.type),
      parsed: Boolean(entry?.parsed),
      excerpt: cleanText(entry?.excerpt),
    })).sort((left, right) => left.id.localeCompare(right.id)),
  });
}

export function validateOutreachInput(input = {}) {
  const normalized = normalizeOutreachInput(input);
  const missing = REQUIRED_FIELDS.filter((key) => !normalized[key]);

  if (normalized.channels.length === 0) {
    missing.push('channels');
  }

  return {
    normalized,
    missing,
    isValid: missing.length === 0,
  };
}

export function getOutreachFieldFeedback(input = {}) {
  const normalized = normalizeOutreachInput(input);

  return {
    offer:
      normalized.offer.length > 12
        ? []
        : ['Make the offer concrete. Say what you do, for whom, and what changes after using it.'],
    painPoint:
      normalized.painPoint.length > 20
        ? []
        : ['Name the painful moment, not just a theme like "growth" or "sales".'],
    proof:
      normalized.proof
        ? []
        : ['If you have any proof, include it. Even one result, case study, or credible signal helps.'],
    cta:
      normalized.cta.length > 8
        ? []
        : ['Use one clear next step like a reply, quick call, or teardown offer.'],
  };
}

function normalizeIcpSnapshot(value) {
  const source = cleanObject(value);
  const customer = cleanText(source.customer);
  const buyerRole = cleanText(source.buyerRole);

  if (!customer || !buyerRole) {
    return null;
  }

  return {
    customer,
    buyerRole,
    painIntensity: cleanText(source.painIntensity),
    buyingTrigger: cleanText(source.buyingTrigger),
    whyTheyRespond: cleanText(source.whyTheyRespond),
  };
}

function normalizeAngles(values) {
  return cleanArray(values)
    .map((entry) => {
      const source = cleanObject(entry);
      const name = cleanText(source.name);
      const target = cleanText(source.target);
      const angle = cleanText(source.angle);
      const whyItWorks = cleanText(source.whyItWorks);
      const openingStyle = cleanText(source.openingStyle);

      if (!name || !angle) {
        return null;
      }

      return { name, target, angle, whyItWorks, openingStyle };
    })
    .filter(Boolean);
}

function normalizeEmails(values) {
  return cleanArray(values)
    .map((entry, index) => {
      const source = cleanObject(entry);
      const title = cleanText(source.title);
      const subject = cleanText(source.subject);
      const body = cleanText(source.body);

      if (!title || !subject || !body) {
        return null;
      }

      const numericStep = Number(source.step);
      const numericDelay = Number(source.delayDays);

      return {
        step: Number.isFinite(numericStep) && numericStep > 0 ? numericStep : index + 1,
        title,
        subject,
        body,
        delayDays: Number.isFinite(numericDelay) && numericDelay >= 0 ? numericDelay : 0,
      };
    })
    .filter(Boolean);
}

function normalizeLinkedinMessages(values) {
  return cleanArray(values)
    .map((entry, index) => {
      const source = cleanObject(entry);
      const body = cleanText(source.body);
      if (!body) {
        return null;
      }

      return {
        step: cleanText(source.step) || `linkedin_${index + 1}`,
        body,
      };
    })
    .filter(Boolean);
}

function normalizeObjectionReplies(values) {
  return cleanArray(values)
    .map((entry) => {
      const source = cleanObject(entry);
      const objection = cleanText(source.objection);
      const reply = cleanText(source.reply);

      if (!objection || !reply) {
        return null;
      }

      return { objection, reply };
    })
    .filter(Boolean);
}

function normalizeCsvRows(values) {
  return cleanArray(values)
    .map((entry) => {
      const source = cleanObject(entry);
      const step = cleanText(source.step);
      const channel = cleanText(source.channel).toLowerCase();
      const body = cleanText(source.body);

      if (!step || !channel || !body || !VALID_CHANNELS.includes(channel)) {
        return null;
      }

      const delaySource = source.delay_days ?? source.delayDays;
      const numericDelay = Number(delaySource);

      return {
        step,
        channel,
        subject: cleanText(source.subject),
        body,
        delay_days: Number.isFinite(numericDelay) && numericDelay >= 0 ? numericDelay : 0,
        goal: cleanText(source.goal),
      };
    })
    .filter(Boolean);
}

export function normalizeOutreachOutput(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Invalid outreach response.' };
  }

  const icpSnapshot = normalizeIcpSnapshot(payload.icpSnapshot);
  if (!icpSnapshot) {
    return { ok: false, error: 'Outreach response is missing icpSnapshot.' };
  }

  const positioningAngles = normalizeAngles(payload.positioningAngles);
  const emails = normalizeEmails(payload.emails);
  const subjectLines = cleanArray(payload.subjectLines).map(cleanText).filter(Boolean);

  if (positioningAngles.length === 0 || emails.length === 0) {
    return { ok: false, error: 'Outreach response is missing required campaign sections.' };
  }

  return {
    ok: true,
    normalizedInput: payload.normalizedInput ? normalizeOutreachInput(payload.normalizedInput) : null,
    diagnosticNotes: cleanArray(payload.diagnosticNotes).map(cleanText).filter(Boolean),
    generatedAt: cleanText(payload.generatedAt),
    icpSnapshot,
    positioningAngles,
    fixBeforeSending: cleanArray(payload.fixBeforeSending).map(cleanText).filter(Boolean),
    emails,
    subjectLines:
      subjectLines.length > 0
        ? subjectLines
        : emails.map((entry) => cleanText(entry.subject)).filter(Boolean),
    linkedinMessages: normalizeLinkedinMessages(payload.linkedinMessages),
    objectionReplies: normalizeObjectionReplies(payload.objectionReplies),
    csvRows: normalizeCsvRows(payload.csvRows),
  };
}
