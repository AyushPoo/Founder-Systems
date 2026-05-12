import assert from 'assert';
import {
  applyOutreachAnswer,
  detectOutreachUncertainty,
  getNextOutreachQuestion,
  getOutreachHelpResponse,
  getOutreachApprovalSections,
  getOutreachQuestionState,
  shouldShowCompanySize,
} from './outreachIntake.js';

assert.equal(
  shouldShowCompanySize({
    targetCustomer: 'Independent fitness creators',
    offer: 'Membership growth coaching',
  }),
  false
);

assert.equal(
  shouldShowCompanySize({
    targetCustomer: 'Bootstrapped B2B SaaS founders',
    offer: 'Outbound campaign support for lean revenue teams',
  }),
  true
);

const buyerRoleQuestion = getNextOutreachQuestion({
  productName: 'Founder Outreach Kit',
  offer: 'We turn rough outbound ideas into sendable founder campaigns.',
  targetCustomer: 'Bootstrapped B2B SaaS founders',
}, 'advanced');

assert.equal(buyerRoleQuestion.key, 'buyerRole');
assert.equal(buyerRoleQuestion.label, 'Who usually replies or decides?');
assert.match(buyerRoleQuestion.helper, /person who feels the pain/i);

const beginnerBuyerRoleQuestion = getNextOutreachQuestion({
  productName: 'Founder Outreach Kit',
  offer: 'We turn rough outbound ideas into sendable founder campaigns.',
  targetCustomer: 'Bootstrapped B2B SaaS founders',
});

assert.equal(beginnerBuyerRoleQuestion.label, 'Who usually says yes?');

const buyerRoleState = getOutreachQuestionState(
  {
    targetCustomer: 'Bootstrapped B2B SaaS founders',
    offer: 'We write outbound for small B2B SaaS teams.',
  },
  'buyerRole'
);

assert.equal(
  buyerRoleState.suggestions.some((entry) => entry.label === 'Founder / CEO'),
  true
);

const channelsDraft = applyOutreachAnswer(
  {},
  'channels',
  'Let us do email first, then LinkedIn follow-ups.'
);

assert.deepEqual(channelsDraft.channels, ['email', 'linkedin']);

const nonB2bSections = getOutreachApprovalSections({
  targetCustomer: 'Independent fitness creators',
  offer: 'Membership growth coaching',
});

assert.equal(
  nonB2bSections.some((section) =>
    section.fields.some((field) => field.key === 'companySize')
  ),
  false
);

const b2bSections = getOutreachApprovalSections({
  targetCustomer: 'Bootstrapped B2B SaaS founders',
  offer: 'Outbound campaign support for lean revenue teams',
});

assert.equal(
  b2bSections.some((section) =>
    section.fields.some((field) => field.key === 'companySize')
  ),
  true
);

assert.equal(detectOutreachUncertainty("I don't know"), true);
assert.equal(detectOutreachUncertainty('not sure yet'), true);
assert.equal(detectOutreachUncertainty('Founder-led'), false);

const helpResponse = getOutreachHelpResponse(
  {
    productName: 'Founder Outreach Kit',
    offer: 'We turn rough outbound ideas into sendable founder campaigns.',
    targetCustomer: 'Bootstrapped B2B SaaS founders',
  },
  beginnerBuyerRoleQuestion,
  'beginner'
);

assert.match(helpResponse.message, /try one of these/i);
assert.equal(helpResponse.suggestions.length > 0, true);

console.log('outreachIntake tests passed');
