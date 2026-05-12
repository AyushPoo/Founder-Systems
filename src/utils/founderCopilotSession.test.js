import assert from 'assert';
import {
  COPILOT_MODES,
  appendFounderCopilotMessage,
  applyFounderCopilotResponse,
  buildFounderCopilotRequest,
  createFounderCopilotSession,
  getActivePanelForStage,
  getPrimaryTab,
  getVisibleTabs,
  selectFounderCopilotMode,
  shouldAllowRecommendation,
} from './founderCopilotSession.js';

const initialSession = createFounderCopilotSession();

assert.equal(initialSession.selectedMode, null);
assert.equal(initialSession.stage, 'mode_selection');
assert.equal(initialSession.activePanel, 'map');
assert.equal(initialSession.messages.length, 1);
assert.equal(initialSession.messages[0].role, 'assistant');
assert.equal(COPILOT_MODES.length, 3);

assert.equal(getActivePanelForStage('exploring'), 'map');
assert.equal(getActivePanelForStage('challenging'), 'founder_fit');
assert.equal(getActivePanelForStage('planning'), 'action_plan');
assert.equal(getPrimaryTab('planning'), 'recommendation');
assert.deepEqual(getVisibleTabs('exploring'), ['map', 'founder_fit', 'action_plan', 'evidence']);
assert.deepEqual(getVisibleTabs('challenging'), ['evidence', 'founder_fit']);

const messyIdeaSession = selectFounderCopilotMode(initialSession, 'messy_idea');
const messyLastMessage = messyIdeaSession.messages[messyIdeaSession.messages.length - 1];

assert.equal(messyIdeaSession.selectedMode, 'messy_idea');
assert.equal(messyIdeaSession.stage, 'exploring');
assert.equal(messyIdeaSession.activePanel, 'map');
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
    activePanel: 'founder_fit',
    confidence: 'medium',
    answers: [{ questionId: 'idea_dump', value: 'Independent fitness coaches' }],
  },
  message: 'I want to build something for independent fitness coaches.',
});

assert.equal(request.mode, 'messy_idea');
assert.equal(request.message, 'I want to build something for independent fitness coaches.');
assert.equal(request.answers.length, 1);
assert.equal(request.session.mode, 'messy_idea');
assert.equal(request.session.activePanel, 'founder_fit');
assert.equal(request.session.confidence, 'medium');
assert.equal(request.session.messages.length >= 2, true);

assert.equal(
  shouldAllowRecommendation({
    ...withFounderReply,
    selectedMode: 'no_idea',
    answers: [
      { questionId: 'strength', value: 'Sales' },
      { questionId: 'market', value: 'Restaurants' },
    ],
  }),
  false
);

assert.equal(
  shouldAllowRecommendation({
    ...withFounderReply,
    selectedMode: 'no_idea',
    answers: [
      { questionId: 'strength', value: 'Sales' },
      { questionId: 'market', value: 'Restaurants' },
      { questionId: 'pull', value: 'Can talk to 10 owners this week' },
    ],
  }),
  true
);

assert.equal(
  shouldAllowRecommendation({
    ...withFounderReply,
    selectedMode: 'messy_idea',
    answers: [
      { questionId: 'idea', value: 'Workflow software for coaches' },
      { questionId: 'distribution', value: 'Already advise 15 coaches' },
    ],
  }),
  true
);

assert.equal(
  shouldAllowRecommendation({
    ...withFounderReply,
    selectedMode: 'known_idea',
    answers: [
      { questionId: 'idea', value: 'Onboarding analytics' },
      { questionId: 'distribution', value: 'Can reach 20 founders directly' },
    ],
  }),
  true
);

const recommendationSession = applyFounderCopilotResponse({
  session: messyIdeaSession,
  submittedValue: 'Independent fitness coaches lose time to billing and follow-up.',
  payload: {
    mode: 'show_recommendation',
    stage: 'final_verdict',
    activePanel: 'action_plan',
    confidence: 'high',
    session: {
      mode: 'messy_idea',
      answers: [
        { questionId: 'idea_dump', value: 'Independent fitness coaches' },
        { questionId: 'problem', value: 'Billing and follow-up' },
        { questionId: 'distribution', value: 'Can reach 30 coaches' },
      ],
    },
    recommendation: {
      title: 'Start with a workflow for fitness coaches',
      summary: 'Own one painful admin loop first.',
    },
    evidence: [{ companyName: 'CoachFlow', pattern: 'Strong early retention' }],
    inference: ['Assumes coaches value admin automation more than growth tooling.'],
    challenge: { summary: 'Do not broaden into an all-in-one coach OS yet.' },
    founderFit: { fitSummary: 'Good founder proximity, weaker technical moat.' },
    actionPlan: { firstWeek: ['Interview 5 coaches'] },
    verdict: { standing: 'Ready to pursue' },
    markdown: '# Founder Strategy Brief',
  },
});

assert.equal(recommendationSession.stage, 'final_verdict');
assert.equal(recommendationSession.activePanel, 'action_plan');
assert.equal(recommendationSession.confidence, 'high');
assert.equal(recommendationSession.answers.length, 3);
assert.equal(recommendationSession.recommendation.title, 'Start with a workflow for fitness coaches');
assert.equal(recommendationSession.evidence.length, 1);
assert.equal(recommendationSession.inference.length, 1);
assert.equal(recommendationSession.challenge.summary, 'Do not broaden into an all-in-one coach OS yet.');
assert.equal(recommendationSession.founderFit.fitSummary, 'Good founder proximity, weaker technical moat.');
assert.equal(recommendationSession.verdict.standing, 'Ready to pursue');
assert.equal(recommendationSession.markdown, '# Founder Strategy Brief');
assert.equal(
  recommendationSession.messages[recommendationSession.messages.length - 1].content,
  'Own one painful admin loop first.'
);

const shortlistSession = applyFounderCopilotResponse({
  session: messyIdeaSession,
  payload: {
    mode: 'show_shortlist',
    stage: 'narrowing',
    activePanel: 'recommendation',
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

assert.equal(shortlistSession.stage, 'narrowing');
assert.equal(shortlistSession.activePanel, 'recommendation');
assert.equal(shortlistSession.shortlist.length, 3);
assert.equal(shortlistSession.selectedMode, 'no_idea');

const questionSession = applyFounderCopilotResponse({
  session: messyIdeaSession,
  payload: {
    mode: 'ask_question',
    stage: 'exploring',
    activePanel: 'evidence',
    advisory: {
      whatIHeard: 'You want to help coaches spend less time on admin.',
      currentRead: 'You are close to the user and the pain sounds real, but the wedge is still broad.',
    },
    runtime: {
      turnType: 'fast',
      fallbackUsed: false,
    },
    question: {
      id: 'customer-pain',
      prompt: 'What is the sharpest pain you have personally seen in this space?',
      helperText: 'One sentence is enough.',
      inputType: 'long_text',
    },
  },
});

assert.equal(questionSession.stage, 'exploring');
assert.equal(questionSession.activePanel, 'evidence');
assert.equal(questionSession.question.id, 'customer-pain');
assert.equal(questionSession.question.helperText, 'One sentence is enough.');
assert.equal(questionSession.runtime.turnType, 'fast');
assert.equal(questionSession.runtime.fallbackUsed, false);
assert.equal(
  questionSession.messages[questionSession.messages.length - 1].role,
  'assistant'
);
assert.match(
  questionSession.messages[questionSession.messages.length - 1].content,
  /sharpest pain/i
);
assert.equal(
  questionSession.messages.some((message) => /what i heard:/i.test(message.content)),
  false
);

const fallbackSession = applyFounderCopilotResponse({
  session: messyIdeaSession,
  payload: {
    mode: 'ask_question',
    stage: 'exploring',
    activePanel: 'evidence',
    runtime: {
      turnType: 'fast',
      fallbackUsed: true,
      fallbackReason: 'parser_recovery',
    },
    advisory: {
      whatIHeard: 'You have a rough coach workflow idea.',
      currentRead: 'I can still keep this moving with one tighter question.',
    },
    question: {
      id: 'fallback-question',
      prompt: 'Which workflow step breaks most often today?',
      inputType: 'long_text',
    },
  },
});

assert.equal(fallbackSession.runtime.fallbackUsed, true);
assert.equal(fallbackSession.runtime.fallbackReason, 'parser_recovery');
assert.equal(fallbackSession.question.id, 'fallback-question');

const packagedFoodSession = appendFounderCopilotMessage(
  selectFounderCopilotMode(initialSession, 'no_idea'),
  'user',
  'I know a supplier and want to white-label millet snacks for office professionals.'
);

const refinedQuestionSession = applyFounderCopilotResponse({
  session: packagedFoodSession,
  submittedValue: 'I know a supplier and want to white-label millet snacks for office professionals.',
  payload: {
    mode: 'ask_question',
    stage: 'exploring',
    activePanel: 'evidence',
    session: {
      mode: 'ask_question',
      answers: [],
    },
    question: {
      id: 'generic-founder-inventory',
      prompt:
        'What do you actually have more of than most early founders right now: customer access, execution ability, niche insight, or distribution?',
      inputType: 'long_text',
    },
  },
});

assert.equal(refinedQuestionSession.selectedMode, 'no_idea');
assert.match(
  refinedQuestionSession.question.prompt,
  /first buyer you can reach fastest/i
);

const repeatedQuestionSession = applyFounderCopilotResponse({
  session: {
    ...packagedFoodSession,
    messages: [
      ...packagedFoodSession.messages,
      {
        id: 'assistant-repeat-1',
        role: 'assistant',
        content:
          'Who is the first buyer you can reach fastest for this: office teams, gyms, retail stores, or direct online consumers?',
      },
      {
        id: 'user-repeat-1',
        role: 'user',
        content: 'Office as I have connection with Scaler and companies in electronic city in bangalore',
      },
    ],
  },
  submittedValue: 'Office as I have connection with Scaler and companies in electronic city in bangalore',
  payload: {
    mode: 'ask_question',
    stage: 'exploring',
    activePanel: 'evidence',
    session: {
      mode: 'ask_question',
      answers: [],
    },
    question: {
      id: 'repeated-channel-question',
      prompt:
        'Who is the first buyer you can reach fastest for this: office teams, gyms, retail stores, or direct online consumers?',
      inputType: 'long_text',
    },
  },
});

assert.match(
  repeatedQuestionSession.question.prompt,
  /who exactly will say yes fastest/i
);

console.log('founderCopilotSession tests passed');
