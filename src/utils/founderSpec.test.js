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
    session: { mode: 'no_idea', answers: [] },
    question: {
      id: 'strengths',
      prompt: 'What are you unusually good at or close to?',
      inputType: 'single_select',
      options: ['Sales', 'Ops', 'Product', 'Engineering'],
    },
  },
]);

assert.equal(typedPayload.ok, true);
assert.equal(typedPayload.mode, 'ask_question');
assert.equal(typedPayload.question.id, 'strengths');
assert.equal(typedPayload.shortlist.length, 0);

const recommendationPayload = normalizeFounderSpecResponse({
  mode: 'show_recommendation',
  session: { mode: 'known_idea' },
  recommendation: {
    title: 'Start with a narrow restaurant ops wedge',
  },
  evidence: [{ name: 'Example Co' }],
  inference: ['Assumes manual ops pain is urgent'],
  brief: {
    problem: 'Problem',
  },
  markdown: '# Founder Strategy Brief',
});

assert.equal(recommendationPayload.ok, true);
assert.equal(recommendationPayload.mode, 'show_recommendation');
assert.equal(recommendationPayload.recommendation.title, 'Start with a narrow restaurant ops wedge');
assert.equal(recommendationPayload.evidence.length, 1);
assert.equal(recommendationPayload.inference.length, 1);
assert.equal(recommendationPayload.markdown, '# Founder Strategy Brief');

const invalidPayload = normalizeFounderSpecResponse({
  spec: {
    problem: 'Problem only',
  },
});

assert.equal(invalidPayload.ok, false);
assert.match(invalidPayload.error, /missing/i);

console.log('founderSpec tests passed');
