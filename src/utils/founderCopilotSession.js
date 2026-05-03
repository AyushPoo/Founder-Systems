const MODE_METADATA = {
  no_idea: {
    title: 'I have no idea what to build',
    description: 'Start from your strengths and constraints.',
    starterPrompt:
      'You do not need a polished idea yet. Start with the spaces, people, or problems you are closest to.',
  },
  messy_idea: {
    title: 'I have a rough idea but it is messy',
    description: 'Sharpen the wedge and remove the noise.',
    starterPrompt:
      'Give me the rough version. What are you thinking about building, and what still feels fuzzy?',
  },
  known_idea: {
    title: 'I know what I want to build, help me scope and launch it',
    description: 'Turn it into a tighter plan and launch path.',
    starterPrompt:
      'Tell me the business you want to build, who it is for, and where you feel least certain.',
  },
};

const DEFAULT_ASSISTANT_MESSAGE =
  'Pick the starting point that matches where you are. I will tell you what I am hearing, give you my current read, and ask for the one thing I need next.';

const DEFAULT_RUNTIME = {
  turnType: 'fast',
  fallbackUsed: false,
  fallbackReason: '',
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

function formatAdvisoryMessage(advisory) {
  const normalized = normalizeAdvisory(advisory);
  if (!normalized) return '';

  const lines = [];
  if (normalized.whatIHeard) lines.push(`What I heard: ${normalized.whatIHeard}`);
  if (normalized.currentRead) lines.push(`Current read: ${normalized.currentRead}`);
  if (normalized.nextQuestion) lines.push(`Next question: ${normalized.nextQuestion}`);
  return lines.join('\n');
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
      return 'evidence';
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
      return ['evidence'];
  }
}

export function getPrimaryTab(stage) {
  const visible = getVisibleTabs(stage);
  return visible[0] || 'evidence';
}

export function shouldAllowRecommendation(session) {
  const mode = cleanText(session?.selectedMode);
  const answerCount = normalizeAnswers(session?.answers).length;

  if (mode === 'no_idea') return answerCount >= 3;
  if (mode === 'messy_idea') return answerCount >= 2;
  if (mode === 'known_idea') return answerCount >= 2;
  return false;
}

export const COPILOT_MODES = Object.entries(MODE_METADATA).map(([id, value]) => ({
  id,
  ...value,
}));

export function createFounderCopilotSession() {
  return {
    selectedMode: null,
    stage: 'mode_selection',
    activePanel: 'evidence',
    confidence: 'low',
    question: null,
    answers: [],
    messages: [],
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
  const visibleMessages = normalizeArray(session.messages)
    .slice(-4)
    .map((entry) => ({
      role: cleanText(entry.role),
      content: truncateForRequest(entry.content),
    }))
    .filter((entry) => entry.role && entry.content);

  return {
    mode: session.selectedMode,
    message: cleanedMessage,
    attachments: normalizeArray(attachments).map((file) => ({
      name: cleanText(file?.name),
      type: cleanText(file?.type),
      parsed: Boolean(file?.parsed),
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
  const normalizedQuestion = normalizeQuestion(payload?.question);
  const normalizedAdvisory = normalizeAdvisory(payload?.advisory);
  let nextMessages = [...normalizeArray(session.messages)];
  const cleanedSubmittedValue = cleanText(submittedValue);

  if (cleanedSubmittedValue) {
    nextMessages = appendUniqueMessage(nextMessages, 'user', cleanedSubmittedValue);
  }

  const advisoryMessage = formatAdvisoryMessage(normalizedAdvisory);
  if (advisoryMessage) {
    nextMessages = appendUniqueMessage(nextMessages, 'assistant', advisoryMessage);
  }

  if (!advisoryMessage && normalizedQuestion?.prompt) {
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

  const nextMode = cleanText(payload?.session?.mode) || session.selectedMode;
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
