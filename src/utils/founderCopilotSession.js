const MODE_METADATA = {
  no_idea: {
    title: 'I have no idea what to build',
    description:
      'Start from strengths, access, and founder constraints. The copilot should narrow the space for you.',
    starterPrompt:
      'You do not need a polished idea yet. Start with the spaces, people, or problems you are closest to.',
  },
  messy_idea: {
    title: 'I have a rough idea but it is messy',
    description:
      'Pressure-test the idea, sharpen the wedge, and remove the parts that are just noise.',
    starterPrompt:
      'Give me the rough version. What are you thinking about building, and what still feels fuzzy?',
  },
  known_idea: {
    title: 'I know what I want to build, help me scope and launch it',
    description:
      'Turn a known direction into a tighter founder brief with scope, evidence, and next steps.',
    starterPrompt:
      'Tell me the business you want to build, who it is for, and where you feel least certain.',
  },
};

const DEFAULT_ASSISTANT_MESSAGE =
  'Pick the starting point that matches where you are. I will guide the next few questions, then recommend a direction with evidence.';

let messageSequence = 0;

function nextMessageId(role) {
  messageSequence += 1;
  return `${role}-${messageSequence}`;
}

function toMessage(role, content) {
  return {
    id: nextMessageId(role),
    role,
    content,
  };
}

function cleanText(value) {
  return String(value || '').trim();
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
    options: Array.isArray(question.options)
      ? question.options.map((entry) => cleanText(entry)).filter(Boolean)
      : [],
    helperText: cleanText(question.helperText || question.helper),
    placeholder: cleanText(question.placeholder),
  };
}

function normalizeMessage(message) {
  if (!message || typeof message !== 'object') return null;

  const content = cleanText(message.content);
  if (!content) return null;

  return {
    id: message.id || nextMessageId(message.role || 'message'),
    role: message.role || 'assistant',
    content,
  };
}

export const COPILOT_MODES = Object.entries(MODE_METADATA).map(([id, value]) => ({
  id,
  ...value,
}));

export function createFounderCopilotSession() {
  return {
    selectedMode: null,
    stage: 'mode_selection',
    question: null,
    answers: [],
    messages: [toMessage('assistant', DEFAULT_ASSISTANT_MESSAGE)],
    shortlist: [],
    recommendation: null,
    evidence: [],
    inference: [],
    brief: null,
    markdown: '',
    error: '',
  };
}

export function selectFounderCopilotMode(session, modeId) {
  const mode = MODE_METADATA[modeId];
  if (!mode) return session;

  return {
    ...createFounderCopilotSession(),
    selectedMode: modeId,
    stage: 'conversation',
    messages: [
      toMessage('assistant', DEFAULT_ASSISTANT_MESSAGE),
      toMessage('assistant', mode.starterPrompt),
    ],
  };
}

export function appendFounderCopilotMessage(session, role, content) {
  const message = normalizeMessage({ role, content });
  if (!message) return session;

  return {
    ...session,
    messages: [...(session.messages || []), message],
  };
}

export function buildFounderCopilotRequest({ session, message, selection = null }) {
  const cleanedMessage = cleanText(message);
  const normalizedSelection = selection && typeof selection === 'object' ? selection : null;

  return {
    mode: session.selectedMode,
    message: cleanedMessage,
    answers: Array.isArray(session.answers) ? session.answers : [],
    selectedShortlistId: cleanText(normalizedSelection?.id),
    selectedShortlistLabel: cleanText(normalizedSelection?.title),
    session: {
      mode: session.selectedMode,
      step: session.stage,
      answers: Array.isArray(session.answers) ? session.answers : [],
    },
  };
}

export function applyFounderCopilotResponse({ session, payload, submittedValue = '' }) {
  const normalizedQuestion = normalizeQuestion(payload?.question);
  const nextMessages = [...(session.messages || [])];
  const cleanedSubmittedValue = cleanText(submittedValue);

  if (cleanedSubmittedValue) {
    nextMessages.push(toMessage('user', cleanedSubmittedValue));
  }

  if (normalizedQuestion?.prompt) {
    nextMessages.push(toMessage('assistant', normalizedQuestion.prompt));
  } else if (payload?.recommendation?.summary) {
    nextMessages.push(toMessage('assistant', cleanText(payload.recommendation.summary)));
  } else if (payload?.recommendation?.title) {
    nextMessages.push(toMessage('assistant', cleanText(payload.recommendation.title)));
  } else if (payload?.brief?.problem) {
    nextMessages.push(
      toMessage('assistant', 'I turned this into a sharper founder brief you can work from now.')
    );
  }

  const nextMode = cleanText(payload?.session?.mode) || session.selectedMode;
  const nextAnswers = Array.isArray(payload?.session?.answers)
    ? payload.session.answers
    : Array.isArray(session.answers)
      ? session.answers
      : [];

  let stage = 'conversation';
  if (payload?.mode === 'show_shortlist') stage = 'shortlist';
  if (payload?.mode === 'show_recommendation' || payload?.mode === 'show_founder_brief') stage = 'recommendation';

  return {
    ...session,
    selectedMode: nextMode,
    stage,
    question: normalizedQuestion,
    answers: nextAnswers,
    messages: nextMessages.map(normalizeMessage).filter(Boolean),
    shortlist: Array.isArray(payload?.shortlist) ? payload.shortlist : [],
    recommendation: payload?.recommendation || null,
    evidence: Array.isArray(payload?.evidence) ? payload.evidence : [],
    inference: Array.isArray(payload?.inference) ? payload.inference : [],
    brief: payload?.brief || null,
    markdown: cleanText(payload?.markdown),
    error: '',
  };
}

