const REQUIRED_SPEC_KEYS = [
  'problem',
  'icp',
  'mvpScope',
  'excludedFeatures',
  'pricingHypothesis',
  'gtmPlan',
  'next30Days',
];

const SECTION_LABELS = {
  problem: 'Problem',
  icp: 'ICP',
  mvpScope: 'MVP Scope',
  excludedFeatures: 'What Not to Build',
  pricingHypothesis: 'Pricing Hypothesis',
  gtmPlan: 'GTM Plan',
  next30Days: '30-Day Next Steps',
};

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeRuntime(value) {
  if (!value || typeof value !== 'object') {
    return {
      turnType: 'fast',
      fallbackUsed: false,
      fallbackReason: '',
    };
  }

  return {
    turnType: cleanText(value.turnType).toLowerCase() === 'heavy' ? 'heavy' : 'fast',
    fallbackUsed: Boolean(value.fallbackUsed),
    fallbackReason: cleanText(value.fallbackReason),
  };
}

function normalizeAdvisory(value) {
  if (!value || typeof value !== 'object') return null;

  const advisory = {
    whatIHeard: cleanText(value.whatIHeard || value.heard),
    currentRead: cleanText(value.currentRead || value.read),
    nextQuestion: cleanText(value.nextQuestion),
  };

  return Object.values(advisory).some(Boolean) ? advisory : null;
}

function normalizeTypedModePayload(normalizedPayload) {
  const knownModes = new Set([
    'ask_question',
    'show_shortlist',
    'show_recommendation',
    'show_founder_brief',
    'show_challenge',
    'show_founder_assessment',
    'show_action_plan',
  ]);

  if (!knownModes.has(normalizedPayload.mode)) {
    return null;
  }

  return {
    ok: true,
    mode: normalizedPayload.mode,
    stage: cleanText(normalizedPayload.stage) || '',
    activePanel: cleanText(normalizedPayload.activePanel) || '',
    confidence: cleanText(normalizedPayload.confidence) || '',
    session: normalizedPayload.session || {},
    advisory: normalizeAdvisory(normalizedPayload.advisory),
    runtime: normalizeRuntime(normalizedPayload.runtime),
    question: normalizedPayload.question || null,
    shortlist: Array.isArray(normalizedPayload.shortlist) ? normalizedPayload.shortlist : [],
    recommendation: normalizedPayload.recommendation || null,
    evidence: Array.isArray(normalizedPayload.evidence) ? normalizedPayload.evidence : [],
    inference: Array.isArray(normalizedPayload.inference) ? normalizedPayload.inference : [],
    challenge: normalizedPayload.challenge || null,
    founderFit: normalizedPayload.founderFit || null,
    actionPlan: normalizedPayload.actionPlan || null,
    verdict: normalizedPayload.verdict || null,
    brief: normalizedPayload.brief || null,
    markdown: cleanText(normalizedPayload.markdown),
  };
}

export function buildFounderSpecMarkdown({ inputs = {}, spec = {} }) {
  const title = cleanText(inputs.idea) || 'Untitled Founder Spec';
  const metadata = [
    ['Target user', cleanText(inputs.targetUser)],
    ['Business model', cleanText(inputs.businessModel)],
    ['Geography', cleanText(inputs.geography)],
    ['Stage', cleanText(inputs.stage)],
    ['Constraints', cleanText(inputs.constraints)],
    ['Pricing context', cleanText(inputs.pricingContext)],
    ['Channel preference', cleanText(inputs.channelPreference)],
  ].filter(([, value]) => value);

  const lines = [`# Founder Spec: ${title}`, ''];

  if (metadata.length > 0) {
    lines.push('## Inputs', '');
    metadata.forEach(([label, value]) => {
      lines.push(`- **${label}:** ${value}`);
    });
    lines.push('');
  }

  REQUIRED_SPEC_KEYS.forEach((key) => {
    lines.push(`## ${SECTION_LABELS[key]}`, '');
    lines.push(cleanText(spec[key]) || 'Not provided.');
    lines.push('');
  });

  return lines.join('\n').trim();
}

export function normalizeFounderSpecResponse(payload, inputsOverride = {}) {
  const normalizedPayload = Array.isArray(payload) ? payload[0] : payload;

  if (!normalizedPayload || typeof normalizedPayload !== 'object') {
    return { ok: false, error: 'Invalid founder spec response.' };
  }

  const typedModePayload = normalizeTypedModePayload(normalizedPayload);
  if (typedModePayload) {
    return typedModePayload;
  }

  if (normalizedPayload.status || normalizedPayload.error) {
    return {
      ok: false,
      error: cleanText(
        normalizedPayload.message ||
          normalizedPayload.error ||
          'Founder spec generation failed.'
      ),
    };
  }

  const sourceSpec =
    normalizedPayload.spec && typeof normalizedPayload.spec === 'object'
      ? normalizedPayload.spec
      : normalizedPayload;
  const spec = {};

  for (const key of REQUIRED_SPEC_KEYS) {
    const value = cleanText(sourceSpec[key]);
    if (!value) {
      return { ok: false, error: `Founder spec response is missing ${key}.` };
    }
    spec[key] = value;
  }

  const markdown =
    cleanText(normalizedPayload.markdown) ||
    buildFounderSpecMarkdown({
      inputs: normalizedPayload.inputs || inputsOverride,
      spec,
    });

  return {
    ok: true,
    spec,
    markdown,
  };
}

export function downloadMarkdown(filename, markdown) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}
