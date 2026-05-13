import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildOutreachMemoryCandidates,
  buildSpecMemoryCandidates,
  mapMemoryItemsToOutreachDraft,
} from './workspaceMemory.js';

test('mapMemoryItemsToOutreachDraft prefills the most relevant outreach fields', () => {
  const draft = mapMemoryItemsToOutreachDraft([
    { type: 'venture_summary', value_json: { text: 'Founder OS' } },
    { type: 'offer', value_json: { text: 'Weekly operating system for founder execution' } },
    { type: 'target_customer', value_json: { text: 'B2B founders running sales manually' } },
    { type: 'buyer_role', value_json: { text: 'Founder / CEO' } },
    { type: 'problem_statement', value_json: { text: 'Follow-ups slip because work lives across WhatsApp and Notion' } },
    { type: 'proof_point', value_json: { text: 'One founder booked 11 meetings in 3 weeks' } },
    { type: 'pricing_hypothesis', value_json: { text: '₹15k per month' } },
    { type: 'brand_tone', value_json: { text: 'founder-led' } },
  ]);

  assert.equal(draft.productName, 'Founder OS');
  assert.equal(draft.offer, 'Weekly operating system for founder execution');
  assert.equal(draft.targetCustomer, 'B2B founders running sales manually');
  assert.equal(draft.buyerRole, 'Founder / CEO');
  assert.equal(draft.painPoint, 'Follow-ups slip because work lives across WhatsApp and Notion');
  assert.equal(draft.proof, 'One founder booked 11 meetings in 3 weeks');
  assert.equal(draft.pricing, '₹15k per month');
  assert.equal(draft.tone, 'founder-led');
});

test('buildSpecMemoryCandidates lifts reusable strategic facts from a spec session', () => {
  const candidates = buildSpecMemoryCandidates({
    selectedMode: 'known_idea',
    recommendation: {
      title: 'Founder operations copilot',
      summary: 'Tighten founder execution with a weekly operating cadence.',
      what: 'Founder execution system',
    },
    brief: {
      customer: 'Seed to Series A founders',
      buyerRole: 'Founder / CEO',
      problem: 'The founder becomes the bottleneck for follow-ups and weekly execution.',
      solution: 'A shared operating layer that keeps priorities and follow-ups moving.',
      pricing: '₹12k to ₹20k monthly subscription',
    },
    verdict: {
      standing: 'Worth testing now',
    },
    actionPlan: {
      proofPoints: ['2 design partners already asked for a cleaner weekly system'],
      next30Days: ['Run 5 founder interviews'],
    },
  });

  const types = candidates.map((item) => item.type);
  assert.deepEqual(
    types,
    ['venture_summary', 'target_customer', 'buyer_role', 'problem_statement', 'offer', 'pricing_hypothesis', 'proof_point']
  );
  assert.equal(candidates[0].memory_scope, 'canonical');
  assert.equal(candidates[0].source_product, 'founder-spec-generator');
});

test('buildOutreachMemoryCandidates returns both canonical promotion candidates and outreach learnings', () => {
  const candidates = buildOutreachMemoryCandidates({
    draft: {
      productName: 'Founder OS',
      offer: 'Weekly operating system for founder execution',
      targetCustomer: 'B2B founders',
      buyerRole: 'Founder / CEO',
      painPoint: 'Follow-ups disappear across too many tools',
      proof: '11 meetings booked in 3 weeks',
      pricing: '₹15k per month',
      tone: 'founder-led',
      cta: 'Reply and I will send the teardown',
    },
    result: {
      icpSnapshot: {
        customer: 'B2B founders',
        buyerRole: 'Founder / CEO',
        whyTheyRespond: 'They already feel the execution drag every week',
      },
      positioningAngles: [
        {
          name: 'Execution OS',
          angle: 'Replace founder-chaos with one weekly operating system',
          whyItWorks: 'Feels like leverage, not another tool',
        },
      ],
      objectionReplies: [
        {
          objection: 'We already use Notion',
          reply: 'This is the operating layer that makes the tools actually move decisions forward.',
        },
      ],
    },
  });

  const canonical = candidates.filter((item) => item.memory_scope === 'canonical');
  const native = candidates.filter((item) => item.memory_scope === 'product_native');

  assert.equal(canonical.some((item) => item.type === 'offer'), true);
  assert.equal(canonical.some((item) => item.type === 'proof_point'), true);
  assert.equal(native.some((item) => item.type === 'messaging_angle'), true);
  assert.equal(native.some((item) => item.type === 'objection_pattern'), true);
});
