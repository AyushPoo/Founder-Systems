import assert from 'assert';
import { buildFounderSpecMarkdown, normalizeFounderSpecResponse } from './founderSpec.js';

const markdown = buildFounderSpecMarkdown({
  inputs: {
    idea: 'AI assistant for founder planning',
    targetUser: 'Solo SaaS founders',
    businessModel: 'Subscription SaaS',
    geography: 'India + Global',
    stage: 'idea',
  },
  spec: {
    problem: 'Founders struggle to turn vague ideas into build-ready execution docs.',
    icp: 'Solo and small startup founders who need planning clarity fast.',
    mvpScope: 'Structured spec generation with editable sections and markdown export.',
    excludedFeatures: 'No auth, no saved workspaces, no team collaboration in v1.',
    pricingHypothesis: 'Free beta first, then low-ticket paid exports or premium templates.',
    gtmPlan: 'Launch through Founder Systems site, X, LinkedIn, and founder communities.',
    next30Days: 'Ship beta, gather usage data, refine prompt quality, and add exports.',
  },
});

assert.match(markdown, /^# Founder Spec: AI assistant for founder planning/m);
assert.match(markdown, /^## Problem$/m);
assert.match(markdown, /^## ICP$/m);
assert.match(markdown, /^## MVP Scope$/m);
assert.match(markdown, /^## What Not to Build$/m);
assert.match(markdown, /^## Pricing Hypothesis$/m);
assert.match(markdown, /^## GTM Plan$/m);
assert.match(markdown, /^## 30-Day Next Steps$/m);
assert.match(markdown, /India \+ Global/);

const validPayload = normalizeFounderSpecResponse({
  spec: {
    problem: 'Problem',
    icp: 'ICP',
    mvpScope: 'MVP',
    excludedFeatures: 'Excluded',
    pricingHypothesis: 'Pricing',
    gtmPlan: 'GTM',
    next30Days: 'Next steps',
  },
  markdown: '# Founder Spec',
});

assert.equal(validPayload.ok, true);
assert.equal(validPayload.spec.problem, 'Problem');
assert.equal(validPayload.markdown, '# Founder Spec');

const validArrayPayload = normalizeFounderSpecResponse([
  {
    spec: {
      problem: 'Problem',
      icp: 'ICP',
      mvpScope: 'MVP',
      excludedFeatures: 'Excluded',
      pricingHypothesis: 'Pricing',
      gtmPlan: 'GTM',
      next30Days: 'Next steps',
    },
  },
], {
  idea: 'Founder spec app',
});

assert.equal(validArrayPayload.ok, true);
assert.match(validArrayPayload.markdown, /^# Founder Spec: Founder spec app/m);

const typedPayload = normalizeFounderSpecResponse([
  {
    mode: 'ask_question',
    stage: 'exploring',
    activePanel: 'evidence',
    confidence: 'medium',
    session: { mode: 'no_idea', answers: [] },
    advisory: {
      whatIHeard: 'You are strongest in founder sales conversations.',
      currentRead: 'That is enough signal to narrow by reachable users first.',
    },
    runtime: {
      turnType: 'fast',
      fallbackUsed: false,
    },
    question: {
      id: 'strengths',
      prompt: 'What are you unusually good at or close to?',
      inputType: 'single_select',
      options: ['Sales', 'Ops', 'Product', 'Engineering'],
    },
    challenge: {
      summary: 'Right now this sounds broader than your current unfair advantage.',
    },
  },
]);

assert.equal(typedPayload.ok, true);
assert.equal(typedPayload.mode, 'ask_question');
assert.equal(typedPayload.stage, 'exploring');
assert.equal(typedPayload.activePanel, 'evidence');
assert.equal(typedPayload.confidence, 'medium');
assert.equal(typedPayload.question.id, 'strengths');
assert.equal(typedPayload.advisory.whatIHeard.includes('founder sales'), true);
assert.equal(typedPayload.runtime.turnType, 'fast');
assert.equal(typedPayload.challenge.summary.includes('broader'), true);
assert.equal(typedPayload.shortlist.length, 0);

const recommendationPayload = normalizeFounderSpecResponse({
  mode: 'show_recommendation',
  stage: 'recommending',
  activePanel: 'recommendation',
  confidence: 'medium',
  session: { mode: 'known_idea' },
  advisory: {
    whatIHeard: 'You want to help restaurant operators with repeat admin work.',
    currentRead: 'There is enough signal to offer a provisional wedge before a full verdict.',
  },
  runtime: {
    turnType: 'heavy',
    fallbackUsed: false,
  },
  recommendation: {
    title: 'Start with a narrow restaurant ops wedge',
  },
  evidence: [{ name: 'Example Co' }],
  inference: ['Assumes manual ops pain is urgent'],
  markdown: '# Provisional Recommendation',
});

assert.equal(recommendationPayload.ok, true);
assert.equal(recommendationPayload.mode, 'show_recommendation');
assert.equal(recommendationPayload.stage, 'recommending');
assert.equal(recommendationPayload.activePanel, 'recommendation');
assert.equal(recommendationPayload.confidence, 'medium');
assert.equal(recommendationPayload.recommendation.title, 'Start with a narrow restaurant ops wedge');
assert.equal(recommendationPayload.evidence.length, 1);
assert.equal(recommendationPayload.inference.length, 1);
assert.equal(recommendationPayload.runtime.turnType, 'heavy');
assert.equal(recommendationPayload.advisory.currentRead.includes('provisional wedge'), true);
assert.equal(recommendationPayload.markdown, '# Provisional Recommendation');

const fallbackTypedPayload = normalizeFounderSpecResponse({
  mode: 'ask_question',
  stage: 'exploring',
  activePanel: 'evidence',
  confidence: 'low',
  runtime: {
    turnType: 'fast',
    fallbackUsed: true,
    fallbackReason: 'parser_recovery',
  },
  session: { mode: 'messy_idea', answers: [] },
  question: {
    id: 'fallback_question',
    prompt: 'What feels most urgent to fix first?',
    inputType: 'long_text',
  },
});

assert.equal(fallbackTypedPayload.ok, true);
assert.equal(fallbackTypedPayload.runtime.fallbackUsed, true);
assert.equal(fallbackTypedPayload.runtime.fallbackReason, 'parser_recovery');

const invalidPayload = normalizeFounderSpecResponse({
  spec: {
    problem: 'Problem only',
  },
});

assert.equal(invalidPayload.ok, false);
assert.match(invalidPayload.error, /missing/i);

console.log('founderSpec tests passed');
