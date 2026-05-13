import assert from 'assert';
import {
  createOutreachDraft,
  createOutreachInputSignature,
  normalizeOutreachInput,
  normalizeOutreachOutput,
  getOutreachFieldFeedback,
} from './outreachCampaign.js';

const draft = createOutreachDraft();
assert.equal(draft.productName, '');
assert.deepEqual(draft.channels, []);
assert.equal(draft.tone, 'founder-led');

const normalizedInput = normalizeOutreachInput({
  productName: 'Founder Outreach Kit',
  offer: 'Outbound campaign generator',
  targetCustomer: 'Solo SaaS founders',
  buyerRole: 'Founder',
  painPoint: 'They do not know what to say in cold outreach',
  desiredOutcome: 'Book first calls',
  cta: 'Open to a quick call?',
  tone: 'founder-led',
  channels: ['email', 'linkedin', 'email', 'sms'],
  objections: ['No budget', '  ', 'No time'],
});

assert.equal(normalizedInput.productName, 'Founder Outreach Kit');
assert.deepEqual(normalizedInput.channels, ['email', 'linkedin']);
assert.deepEqual(normalizedInput.objections, ['No budget', 'No time']);

const fallbackTone = normalizeOutreachInput({
  tone: 'casual',
  channels: 'email',
});
assert.equal(fallbackTone.tone, 'founder-led');
assert.deepEqual(fallbackTone.channels, []);

const signatureA = createOutreachInputSignature({
  productName: 'Founder Outreach Kit',
  offer: 'Outbound campaign generator',
  targetCustomer: 'Solo SaaS founders',
  buyerRole: 'Founder',
  painPoint: 'They do not know what to say in cold outreach',
  desiredOutcome: 'Book first calls',
  cta: 'Open to a quick call?',
  tone: 'founder-led',
  channels: ['linkedin', 'email', 'email'],
});

const signatureB = createOutreachInputSignature({
  productName: 'Founder Outreach Kit',
  offer: 'Outbound campaign generator',
  targetCustomer: 'Solo SaaS founders',
  buyerRole: 'Founder',
  painPoint: 'They do not know what to say in cold outreach',
  desiredOutcome: 'Book first calls',
  cta: 'Open to a quick call?',
  tone: 'founder-led',
  channels: ['email', 'linkedin'],
});

const signatureC = createOutreachInputSignature({
  productName: 'Founder Outreach Kit v2',
  offer: 'Outbound campaign generator',
  targetCustomer: 'Solo SaaS founders',
  buyerRole: 'Founder',
  painPoint: 'They do not know what to say in cold outreach',
  desiredOutcome: 'Book first calls',
  cta: 'Open to a quick call?',
  tone: 'founder-led',
  channels: ['email', 'linkedin'],
});

assert.equal(signatureA, signatureB);
assert.notEqual(signatureA, signatureC);

const feedback = getOutreachFieldFeedback({
  offer: 'AI tool',
  painPoint: 'growth',
  proof: '',
  cta: 'Call?',
});

assert.equal(feedback.offer.length > 0, true);
assert.equal(feedback.painPoint.length > 0, true);
assert.equal(feedback.proof.length > 0, true);
assert.equal(feedback.cta.length > 0, true);

const normalizedOutput = normalizeOutreachOutput({
  normalizedInput: {
    productName: 'Founder Outreach Kit',
    tone: 'casual',
    channels: ['linkedin', 'email', 'linkedin'],
  },
  icpSnapshot: {
    customer: 'Solo SaaS founders',
    buyerRole: 'Founder',
    painIntensity: 'High',
    buyingTrigger: 'Outbound is not converting',
    whyTheyRespond: 'They need pipeline fast',
  },
  positioningAngles: [
    {
      name: 'Pain-led',
      target: 'Solo SaaS founders',
      angle: 'Stop writing blank-page cold emails',
      whyItWorks: 'Speaks to immediate pain',
      openingStyle: 'Pattern interrupt',
    },
  ],
  fixBeforeSending: ['Proof is thin'],
  emails: [
    {
      step: 1,
      title: 'Cold intro',
      subject: 'Quick idea for founder outbound',
      body: 'Short email body',
      delayDays: 0,
    },
  ],
  subjectLines: ['Quick idea for founder outbound'],
  linkedinMessages: [{ step: 'connection_request', body: 'Open to connect?' }],
  objectionReplies: [{ objection: 'Not interested', reply: 'Understood.' }],
  csvRows: [
    {
      step: '1',
      channel: 'email',
      subject: 'Quick idea',
      body: 'Body',
      delayDays: 0,
      goal: 'Reply',
    },
    {
      step: '2',
      channel: 'phone',
      subject: 'Bad channel',
      body: 'Should be filtered out',
      delayDays: 1,
      goal: 'Invalid',
    },
  ],
});

assert.equal(normalizedOutput.ok, true);
assert.equal(normalizedOutput.emails.length, 1);
assert.equal(normalizedOutput.linkedinMessages.length, 1);
assert.equal(normalizedOutput.positioningAngles.length, 1);
assert.equal(normalizedOutput.positioningAngles[0].openingStyle, 'Pattern interrupt');
assert.deepEqual(normalizedOutput.normalizedInput, {
  ...createOutreachDraft(),
  productName: 'Founder Outreach Kit',
  tone: 'founder-led',
  channels: ['linkedin', 'email'],
});
assert.deepEqual(normalizedOutput.csvRows, [
  {
    step: '1',
    channel: 'email',
    subject: 'Quick idea',
    body: 'Body',
    delay_days: 0,
    goal: 'Reply',
  },
]);

const subjectLineFallback = normalizeOutreachOutput({
  icpSnapshot: {
    customer: 'B2B consultants',
    buyerRole: 'Founder',
    painIntensity: 'High',
    buyingTrigger: 'Pipeline is stale',
    whyTheyRespond: 'They need fresher outreach angles',
  },
  positioningAngles: [
    {
      name: 'Outcome-led',
      target: 'B2B consultants',
      angle: 'Replace ad hoc outreach with a tighter sequence',
      whyItWorks: 'It ties the offer to a near-term pipeline result',
    },
  ],
  emails: [
    {
      step: 1,
      title: 'Wake-up email',
      subject: 'A sharper way to restart founder outreach',
      body: 'Short body',
      delayDays: 0,
    },
    {
      step: 2,
      title: 'Follow-up',
      subject: 'Worth pressure-testing your current sequence?',
      body: 'Follow-up body',
      delayDays: 3,
    },
  ],
  subjectLines: [],
});

assert.deepEqual(subjectLineFallback.subjectLines, [
  'A sharper way to restart founder outreach',
  'Worth pressure-testing your current sequence?',
]);

const missingSections = normalizeOutreachOutput({
  icpSnapshot: {
    customer: 'Solo SaaS founders',
    buyerRole: 'Founder',
  },
  positioningAngles: [],
  emails: [],
});

assert.equal(missingSections.ok, false);
assert.match(missingSections.error, /missing required campaign sections/i);

console.log('outreachCampaign tests passed');
