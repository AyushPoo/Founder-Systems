import assert from 'assert';
import {
  COPILOT_MODES,
  appendFounderCopilotMessage,
  applyFounderCopilotResponse,
  buildFounderCopilotRequest,
  createFounderCopilotSession,
  selectFounderCopilotMode,
} from './founderCopilotSession.js';

const initialSession = createFounderCopilotSession();

assert.equal(initialSession.selectedMode, null);
assert.equal(initialSession.stage, 'mode_selection');
assert.equal(initialSession.messages.length, 1);
assert.equal(initialSession.messages[0].role, 'assistant');
assert.equal(COPILOT_MODES.length, 3);

const messyIdeaSession = selectFounderCopilotMode(initialSession, 'messy_idea');
const messyLastMessage = messyIdeaSession.messages[messyIdeaSession.messages.length - 1];

assert.equal(messyIdeaSession.selectedMode, 'messy_idea');
assert.equal(messyIdeaSession.stage, 'conversation');
assert.equal(messyLastMessage.role, 'assistant');
assert.match(messyLastMessage.content, /rough version|fuzzy/i);

const withFounderReply = appendFounderCopilotMessage(
  messyIdeaSession,
  'user',
  'I want to build something for independent fitness coaches.'
);

assert.equal(withFounderReply.messages.length, messyIdeaSession.messages.length + 1);
assert.equal(withFounderReply.messages[withFounderReply.messages.length - 1].role, 'user');

const request = buildFounderCopilotRequest({
  session: {
    ...withFounderReply,
    answers: [{ questionId: 'idea_dump', value: 'Independent fitness coaches' }],
  },
  message: 'I want to build something for independent fitness coaches.',
});

assert.equal(request.mode, 'messy_idea');
assert.equal(request.message, 'I want to build something for independent fitness coaches.');
assert.equal(request.answers.length, 1);
assert.equal(request.session.mode, 'messy_idea');

const recommendationSession = applyFounderCopilotResponse({
  session: messyIdeaSession,
  submittedValue: 'Independent fitness coaches lose time to billing and follow-up.',
  payload: {
    mode: 'show_recommendation',
    session: {
      mode: 'messy_idea',
      answers: [{ questionId: 'idea_dump', value: 'Independent fitness coaches' }],
    },
    recommendation: {
      title: 'Start with a workflow for fitness coaches',
      summary: 'Own one painful admin loop first.',
    },
    evidence: [{ companyName: 'CoachFlow', pattern: 'Strong early retention' }],
    inference: ['Assumes coaches value admin automation more than growth tooling.'],
    markdown: '# Founder Strategy Brief',
  },
});

assert.equal(recommendationSession.stage, 'recommendation');
assert.equal(recommendationSession.answers.length, 1);
assert.equal(recommendationSession.recommendation.title, 'Start with a workflow for fitness coaches');
assert.equal(recommendationSession.evidence.length, 1);
assert.equal(recommendationSession.inference.length, 1);
assert.equal(recommendationSession.markdown, '# Founder Strategy Brief');
assert.equal(
  recommendationSession.messages[recommendationSession.messages.length - 1].content,
  'Own one painful admin loop first.'
);

const shortlistSession = applyFounderCopilotResponse({
  session: messyIdeaSession,
  payload: {
    mode: 'show_shortlist',
    session: {
      mode: 'no_idea',
      answers: [],
    },
    recommendation: {
      title: 'Finance workflow tool',
    },
    shortlist: [
      { id: 'finance-tool', title: 'Finance workflow tool', businessType: 'B2B SaaS' },
      { id: 'ops-marketplace', title: 'Ops marketplace', businessType: 'Marketplace' },
      { id: 'niche-brand', title: 'Niche brand', businessType: 'D2C' },
    ],
  },
});

assert.equal(shortlistSession.stage, 'shortlist');
assert.equal(shortlistSession.shortlist.length, 3);
assert.equal(shortlistSession.selectedMode, 'no_idea');

const questionSession = applyFounderCopilotResponse({
  session: messyIdeaSession,
  payload: {
    mode: 'ask_question',
    question: {
      id: 'customer-pain',
      prompt: 'What is the sharpest pain you have personally seen in this space?',
      helperText: 'One sentence is enough.',
      inputType: 'long_text',
    },
  },
});

assert.equal(questionSession.stage, 'conversation');
assert.equal(questionSession.question.id, 'customer-pain');
assert.equal(questionSession.question.helperText, 'One sentence is enough.');
assert.match(
  questionSession.messages[questionSession.messages.length - 1].content,
  /sharpest pain/i
);

console.log('founderCopilotSession tests passed');
