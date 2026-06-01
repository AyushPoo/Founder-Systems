const MODE_METADATA = {
  no_idea: {
    title: 'Find a direction worth pursuing',
    description:
      'Blend market brief thinking with idea validation so the first wedge is grounded, not guessed.',
    capabilities: ['Market brief', 'Idea validation'],
    starterPrompt:
      'You do not need a polished idea yet. Start with the spaces, people, customers, or problems you are closest to. I will help turn that into a rough market brief, pressure-test whether the direction matters, and narrow it to a wedge worth testing first.',
  },
  messy_idea: {
    title: 'Review and sharpen a messy plan',
    description:
      'Use plan review plus strategy audit to find weak logic, missing proof, and the sharper version of the idea.',
    capabilities: ['Plan review', 'Strategy audit'],
    starterPrompt:
      'Give me the rough version. What are you thinking about building, what feels fuzzy, and where do you think the logic may be weak? I will review the plan, score the weak spots, and sharpen the wedge instead of just polishing the language.',
  },
  known_idea: {
    title: 'Build the one-page plan',
    description:
      'Turn a known direction into a tighter one-page plan, MVP scope, GTM path, and next-step execution brief.',
    capabilities: ['Plan builder', 'Execution brief'],
    starterPrompt:
      'Tell me the business you want to build, who it is for, and where you feel least certain. I will turn it into a one-page plan with a sharper wedge, MVP scope, GTM logic, risks, and the next actions that actually matter.',
  },
};

const STRATEGY_MODE_IDS = new Set(Object.keys(MODE_METADATA));

const DEFAULT_ASSISTANT_MESSAGE =
  'Pick the starting point that matches where you are. I can build a rough market brief, review a messy plan, or turn a known direction into a tighter founder-ready plan.';

export const COPILOT_STRATEGY_LENSES = [
  {
    id: 'idea_validation',
    label: 'Idea validation',
    description: 'Judge whether the direction is worth testing and what proof is missing.',
  },
  {
    id: 'strategy_audit',
    label: 'Strategy audit',
    description: 'Find the weak assumptions, founder-fit gaps, and sharper wedge.',
  },
  {
    id: 'market_brief',
    label: 'Market brief',
    description:
      'Clarify customer, timing, alternatives, wedge, and what makes the market worth entering.',
  },
  {
    id: 'plan_review',
    label: 'Plan review',
    description: 'Score the logic, missing proof, and execution realism in the current plan.',
  },
  {
    id: 'plan_builder',
    label: 'Plan builder',
    description: 'Turn the direction into a concise one-page plan with milestones, GTM, and risks.',
  },
  {
    id: 'business_plan',
    label: 'Execution brief',
    description: 'Package the decision into MVP scope, pricing, GTM, and next steps.',
  },
];

const STRATEGY_LENS_IDS_BY_MODE = {
  no_idea: ['market_brief', 'idea_validation', 'strategy_audit'],
  messy_idea: ['plan_review', 'strategy_audit', 'idea_validation'],
  known_idea: ['plan_builder', 'business_plan', 'strategy_audit'],
};

const MODE_OUTPUT_INSTRUCTIONS = {
  no_idea: [
    'Act like a founder strategist building a compact market brief before anyone commits to the idea.',
    'Clarify the buyer, painful moment, existing alternatives, wedge, timing, and what proof would make this direction real.',
    'If the market is weak, say so plainly and point to the stronger angle.',
    'When enough signal exists, return a recommendation, evidence, a practical brief, and a next-test plan.',
  ].join(' '),
  messy_idea: [
    'Act like a tough but useful plan reviewer.',
    'Review the founder logic for clarity, market realism, execution credibility, missing proof, and wedge sharpness.',
    'Call out what is weak, what is hand-wavy, and what should be rewritten before building.',
    'If enough signal exists, return a scored recommendation, sharper plan direction, and an execution brief instead of asking endless questions.',
  ].join(' '),
  known_idea: [
    'Act like a one-page plan builder for an early-stage founder.',
    'Turn the known direction into a tighter one-page plan with problem, customer, wedge, MVP scope, pricing logic, GTM, milestones, major risks, and the next 30 days.',
    'Prefer decision-grade output over generic business-plan filler.',
  ].join(' '),
};

const DEFAULT_RUNTIME = {
  turnType: 'fast',
  fallbackUsed: false,
  fallbackReason: '',
};

const MODE_ANSWER_LIMITS = {
  no_idea: 5,
  messy_idea: 4,
  known_idea: 4,
};

let messageSequence = 0;

function nextMessageId(role) {
  messageSequence += 1;
  return `${role}-${messageSequence}`;
}

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toMessage(role, content) {
  const normalized = cleanText(content);
  if (!normalized) return null;

  return {
    id: nextMessageId(role),
    role,
    content: normalized,
  };
}

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') return null;
  return toMessage(message.role || 'assistant', message.content);
}

function normalizeQuestion(question) {
  if (!question || typeof question !== 'object') return null;

  const id = cleanText(question.id);
  const prompt = cleanText(question.prompt);
  const inputType = cleanText(question.inputType) || 'long_text';

  if (!id || !prompt) return null;

  return {
    id,
    prompt,
    inputType,
    options: normalizeArray(question.options)
      .map((entry) => cleanText(entry))
      .filter(Boolean),
    helperText: cleanText(question.helperText || question.helper),
    placeholder: cleanText(question.placeholder),
  };
}

function normalizeAnswers(value) {
  return normalizeArray(value)
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const questionId = cleanText(entry.questionId || entry.id || entry.key);
      const answerValue = cleanText(entry.value || entry.answer || entry.text || entry.label);
      if (!questionId || !answerValue) return null;
      return { questionId, value: answerValue };
    })
    .filter(Boolean);
}

function getRecentUserMessages(session) {
  return normalizeArray(session?.messages)
    .filter((message) => message?.role === 'user')
    .map((message) => cleanText(message.content))
    .filter(Boolean)
    .slice(-5);
}

function getLastAssistantMessage(session) {
  const messages = normalizeArray(session?.messages);
  return [...messages]
    .reverse()
    .find((message) => message?.role === 'assistant' && cleanText(message.content));
}

function refineQuestionPrompt(session, submittedValue, question) {
  if (!question?.prompt) return question;

  const prompt = cleanText(question.prompt);
  const context = [submittedValue, ...getRecentUserMessages(session)].join(' ').toLowerCase();
  const lastAssistantPrompt = cleanText(getLastAssistantMessage(session)?.content);
  const isGenericFounderInventoryQuestion =
    /what do you actually have more of than most early founders/i.test(prompt) ||
    /customer access, execution ability, niche insight, or distribution/i.test(prompt);
  const isRepeatOfPreviousAssistantPrompt =
    lastAssistantPrompt && lastAssistantPrompt.toLowerCase() === prompt.toLowerCase();

  if (
    isGenericFounderInventoryQuestion &&
    /\bsupplier\b|\bwhite label\b|\bwhitelabel\b/.test(context) &&
    /\bsnack\b|\bmillet\b|\bfood\b|\boffice\b|\bcorporate\b/.test(context)
  ) {
    return {
      ...question,
      prompt:
        'Who is the first buyer you can reach fastest for this: office teams, gyms, retail stores, or direct online consumers?',
      helperText:
        question.helperText ||
        'Pick the channel where you can realistically get the first 10 to 20 sales.',
    };
  }

  if (
    isGenericFounderInventoryQuestion &&
    /\boffice\b|\bcorporate\b|\bhr\b|\bgifting\b/.test(context)
  ) {
    return {
      ...question,
      prompt:
        'For the first 10 to 20 sales, do you want to sell through HR/admin teams, pantry distributors, or directly to professionals online?',
      helperText:
        question.helperText || 'Choose the route that feels fastest to test, not the biggest long-term market.',
    };
  }

  if (
    isRepeatOfPreviousAssistantPrompt &&
    /\boffice\b|\bscaler\b|\belectronic city\b|\bcompany\b|\bcompanies\b|\bhr\b|\badmin\b/.test(context)
  ) {
    return {
      ...question,
      prompt:
        'Good, office is the wedge. For the first pilot, who exactly will say yes fastest: HR teams, office admins, pantry managers, or founders?',
      helperText:
        'Name the buyer you can realistically reach first, not the broad market.',
    };
  }

  if (
    isRepeatOfPreviousAssistantPrompt &&
    /\bgym\b|\bfitness\b|\btrainer\b|\bcoach\b/.test(context)
  ) {
    return {
      ...question,
      prompt:
        'Good, gyms look reachable. For the first pilot, are you selling to gym owners, trainers, or members at the counter?',
      helperText:
        'Pick the exact buyer so the first offer and distribution test become obvious.',
    };
  }

  if (
    isRepeatOfPreviousAssistantPrompt &&
    /\bonline\b|\bd2c\b|\binstagram\b|\bwebsite\b|\bconsumer\b/.test(context)
  ) {
    return {
      ...question,
      prompt:
        'Good, direct online is the wedge. What is the first product format people will buy online: trial box, monthly snack box, or single repeatable SKU?',
      helperText:
        'Choose the first format that is easiest to explain and easiest to reorder.',
    };
  }

  return question;
}

function inferFounderContext(session, submittedMessage = '') {
  const joined = [submittedMessage, ...getRecentUserMessages(session)].join(' ').toLowerCase();
  const hints = [];

  if (/\bsupplier\b|\bmanufacturer\b|\bwhite label\b|\bwhitelabel\b/.test(joined)) {
    hints.push('The founder appears to have supply-side access or white-label manufacturing access.');
  }
  if (/\bsnack\b|\bmillet\b|\bragi\b|\bjowar\b|\bprotein\b|\bfood\b/.test(joined)) {
    hints.push('The idea likely sits in packaged food / healthy snacks / millet-based consumer products.');
  }
  if (/\boffice\b|\bcorporate\b|\bhr\b|\bgifting\b/.test(joined)) {
    hints.push('Possible B2B or office-distribution wedge detected.');
  }
  if (/\bgym\b|\bfitness\b|\bhealthy\b/.test(joined)) {
    hints.push('Health-conscious positioning or fitness-led wedge may be relevant.');
  }

  return hints;
}

function normalizeRuntime(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_RUNTIME };

  const turnType = cleanText(value.turnType).toLowerCase() === 'heavy' ? 'heavy' : 'fast';
  return {
    turnType,
    fallbackUsed: Boolean(value.fallbackUsed),
    fallbackReason: cleanText(value.fallbackReason),
  };
}

function normalizeAdvisory(value) {
  if (!value || typeof value !== 'object') return null;

  const whatIHeard = cleanText(value.whatIHeard || value.heard);
  const currentRead = cleanText(value.currentRead || value.read);
  const nextQuestion = cleanText(value.nextQuestion);

  if (!whatIHeard && !currentRead && !nextQuestion) return null;

  return {
    whatIHeard,
    currentRead,
    nextQuestion,
  };
}

function inferStageFromMode(mode) {
  switch (mode) {
    case 'show_shortlist':
      return 'narrowing';
    case 'show_recommendation':
    case 'show_founder_brief':
      return 'recommending';
    case 'ask_question':
    default:
      return 'exploring';
  }
}

export function getActivePanelForStage(stage) {
  switch (cleanText(stage)) {
    case 'challenging':
      return 'founder_fit';
    case 'recommending':
      return 'recommendation';
    case 'planning':
    case 'final_verdict':
      return 'action_plan';
    case 'narrowing':
    case 'exploring':
    default:
      return 'map';
  }
}

export function getVisibleTabs(stage) {
  switch (cleanText(stage)) {
    case 'narrowing':
      return ['evidence', 'recommendation'];
    case 'challenging':
      return ['evidence', 'founder_fit'];
    case 'recommending':
      return ['recommendation', 'evidence', 'founder_fit'];
    case 'planning':
    case 'final_verdict':
      return ['recommendation', 'founder_fit', 'action_plan', 'evidence'];
    case 'exploring':
    default:
      return ['map', 'founder_fit', 'action_plan', 'evidence'];
  }
}

export function getPrimaryTab(stage) {
  const visible = getVisibleTabs(stage);
  return visible[0] || 'evidence';
}

export function shouldAllowRecommendation(session) {
  const mode = cleanText(session?.selectedMode);
  const userMessageCount = normalizeArray(session?.messages).filter((message) => message?.role === 'user').length;
  const answerCount = Math.max(normalizeAnswers(session?.answers).length, userMessageCount);

  if (mode === 'no_idea') return answerCount >= 3;
  if (mode === 'messy_idea') return answerCount >= 2;
  if (mode === 'known_idea') return answerCount >= 2;
  return false;
}

export function getAnswerLimit(session) {
  const mode = cleanText(session?.selectedMode);
  return MODE_ANSWER_LIMITS[mode] || 4;
}

export function shouldForceFounderBrief(session) {
  const userMessageCount = normalizeArray(session?.messages).filter((message) => message?.role === 'user').length;
  const answerCount = Math.max(normalizeAnswers(session?.answers).length, userMessageCount);
  return answerCount >= getAnswerLimit(session);
}

export const COPILOT_MODES = Object.entries(MODE_METADATA).map(([id, value]) => ({
  id,
  ...value,
}));

export function createFounderCopilotSession() {
  return {
    selectedMode: null,
    stage: 'mode_selection',
    activePanel: 'map',
    confidence: 'low',
    question: null,
    answers: [],
    messages: [toMessage('assistant', DEFAULT_ASSISTANT_MESSAGE)].filter(Boolean),
    shortlist: [],
    recommendation: null,
    evidence: [],
    inference: [],
    challenge: null,
    founderFit: null,
    actionPlan: null,
    verdict: null,
    brief: null,
    markdown: '',
    error: '',
    runtime: { ...DEFAULT_RUNTIME },
    advisory: null,
  };
}

export function selectFounderCopilotMode(session, modeId) {
  const mode = MODE_METADATA[modeId];
  if (!mode) return session;

  return {
    ...createFounderCopilotSession(),
    selectedMode: modeId,
    stage: 'exploring',
    activePanel: getActivePanelForStage('exploring'),
    messages: [toMessage('assistant', mode.starterPrompt)].filter(Boolean),
  };
}

export function appendFounderCopilotMessage(session, role, content) {
  const message = normalizeMessage({ role, content });
  if (!message) return session;

  return {
    ...session,
    messages: [...normalizeArray(session.messages), message],
  };
}

function truncateForRequest(value, maxChars = 420) {
  return cleanText(value).slice(0, maxChars);
}

export function buildFounderCopilotRequest({ session, message, selection = null, attachments = [] }) {
  const cleanedMessage = cleanText(message);
  const normalizedSelection = selection && typeof selection === 'object' ? selection : null;
  const selectedMode = cleanText(session.selectedMode);
  const visibleMessages = normalizeArray(session.messages)
    .slice(-8)
    .map((entry) => ({
      role: cleanText(entry.role),
      content: truncateForRequest(entry.content),
    }))
    .filter((entry) => entry.role && entry.content);
  const strategyLenses =
    STRATEGY_LENS_IDS_BY_MODE[selectedMode] || COPILOT_STRATEGY_LENSES.map((lens) => lens.id);
  const modeInstruction =
    MODE_OUTPUT_INSTRUCTIONS[selectedMode] || MODE_OUTPUT_INSTRUCTIONS.messy_idea;

  return {
    mode: session.selectedMode,
    message: cleanedMessage,
    requestFinal:
      normalizedSelection?.id === 'generate_founder_spec' ||
      shouldForceFounderBrief(session) ||
      /generate|verdict|spec|plan|business plan|plan review|score|market brief|research|final/i.test(
        cleanedMessage,
      ),
    maxQuestionCount: getAnswerLimit(session),
    strategyLenses,
    founderContextHints: inferFounderContext(session, cleanedMessage),
    expectedOutput:
      `${modeInstruction} Evaluate the idea through the requested lenses, keep the output founder-specific, and do not keep asking questions forever. Be specific to what the founder actually said. If they mention supplier access, white-label manufacturing, a customer group, or a product category, use that directly instead of asking a generic founder question. Ask only one sharp follow-up at a time, and prefer wedge/channel/customer questions over abstract self-reflection. Once maxQuestionCount answers are present, or requestFinal is true, stop asking and return a provisional verdict, recommendation, actionPlan, brief, and markdown even if confidence is imperfect. If one assumption is unknown, state it as an assumption instead of asking another broad question.`,
    attachments: normalizeArray(attachments).map((file) => ({
      name: cleanText(file?.name),
      type: cleanText(file?.type),
      parsed: Boolean(file?.parsed),
      fileData: file?.fileData || '',
      excerpt: file?.excerpt || '',
    })),
    answers: normalizeAnswers(session.answers),
    selectedShortlistId: cleanText(normalizedSelection?.id),
    selectedShortlistLabel: cleanText(normalizedSelection?.title),
    session: {
      mode: session.selectedMode,
      step: cleanText(session.stage),
      activePanel: cleanText(session.activePanel),
      confidence: cleanText(session.confidence),
      answers: normalizeAnswers(session.answers),
      messages: visibleMessages,
      runtime: normalizeRuntime(session.runtime),
    },
  };
}

function appendUniqueMessage(messages, role, content) {
  const candidate = cleanText(content);
  if (!candidate) return messages;

  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === role && cleanText(lastMessage.content) === candidate) {
    return messages;
  }

  const next = toMessage(role, candidate);
  return next ? [...messages, next] : messages;
}

function normalizeEvidenceList(value) {
  return normalizeArray(value).filter((entry) => entry && typeof entry === 'object');
}

export function applyFounderCopilotResponse({ session, payload, submittedValue = '' }) {
  const normalizedQuestion = refineQuestionPrompt(
    session,
    submittedValue,
    normalizeQuestion(payload?.question)
  );
  const normalizedAdvisory = normalizeAdvisory(payload?.advisory);
  let nextMessages = [...normalizeArray(session.messages)];
  const cleanedSubmittedValue = cleanText(submittedValue);

  if (cleanedSubmittedValue) {
    nextMessages = appendUniqueMessage(nextMessages, 'user', cleanedSubmittedValue);
  }

  if (normalizedQuestion?.prompt) {
    nextMessages = appendUniqueMessage(nextMessages, 'assistant', normalizedQuestion.prompt);
  } else if (payload?.recommendation?.summary) {
    nextMessages = appendUniqueMessage(nextMessages, 'assistant', payload.recommendation.summary);
  } else if (payload?.recommendation?.title) {
    nextMessages = appendUniqueMessage(nextMessages, 'assistant', payload.recommendation.title);
  } else if (payload?.verdict?.standing) {
    nextMessages = appendUniqueMessage(
      nextMessages,
      'assistant',
      `Current verdict: ${payload.verdict.standing}`
    );
  } else if (payload?.brief?.problem) {
    nextMessages = appendUniqueMessage(
      nextMessages,
      'assistant',
      'I turned this into a sharper founder brief you can work from now.'
    );
  }

  const payloadSessionMode = cleanText(payload?.session?.mode);
  const nextMode = STRATEGY_MODE_IDS.has(payloadSessionMode)
    ? payloadSessionMode
    : session.selectedMode;
  const nextAnswers = normalizeAnswers(
    Array.isArray(payload?.session?.answers) ? payload.session.answers : session.answers
  );
  const nextStage =
    cleanText(payload?.stage) || inferStageFromMode(payload?.mode) || session.stage || 'exploring';
  const nextActivePanel =
    cleanText(payload?.activePanel) || getActivePanelForStage(nextStage);

  return {
    ...session,
    selectedMode: nextMode,
    stage: nextStage,
    activePanel: nextActivePanel,
    confidence: cleanText(payload?.confidence) || session.confidence || 'low',
    question: normalizedQuestion,
    answers: nextAnswers,
    messages: nextMessages.map(normalizeMessage).filter(Boolean),
    shortlist: normalizeEvidenceList(payload?.shortlist),
    recommendation: payload?.recommendation || null,
    evidence: normalizeEvidenceList(payload?.evidence),
    inference: normalizeArray(payload?.inference).map((entry) => cleanText(entry)).filter(Boolean),
    challenge: payload?.challenge || null,
    founderFit: payload?.founderFit || null,
    actionPlan: payload?.actionPlan || null,
    verdict: payload?.verdict || null,
    brief: payload?.brief || null,
    markdown: cleanText(payload?.markdown),
    error: '',
    runtime: normalizeRuntime(payload?.runtime || session.runtime),
    advisory: normalizedAdvisory,
  };
}
