import assert from 'assert';
import {
  canApplyOutreachGenerationResult,
  createOutreachGenerationTracker,
  getOutreachActionGuard,
  getSavedCampaignStatus,
  invalidateOutreachGenerationTracker,
  getOutreachSaveGuard,
  isOutreachResultCurrent,
  mergeCompletedAttachmentOperation,
  removeAttachmentWithIntent,
  startAttachmentOperation,
} from './outreachWorkspaceState.js';

const draft = {
  productName: 'Founder Outreach Kit',
  offer: 'Outbound campaign generator',
  targetCustomer: 'Solo SaaS founders',
  buyerRole: 'Founder',
  painPoint: 'They do not know what to say in cold outreach',
  desiredOutcome: 'Book first calls',
  cta: 'Open to a quick call?',
  tone: 'founder-led',
  channels: ['email'],
};

const currentResult = {
  normalizedInput: {
    ...draft,
    channels: ['email'],
  },
};

const staleResult = {
  normalizedInput: {
    ...draft,
    productName: 'Founder Outreach Kit v2',
  },
};

assert.equal(isOutreachResultCurrent({ draft, result: currentResult }), true);
assert.equal(isOutreachResultCurrent({ draft, result: staleResult }), false);
assert.deepEqual(getOutreachSaveGuard({ draft, result: null }), {
  canSave: false,
  reason: 'missing_result',
});
assert.deepEqual(getOutreachSaveGuard({ draft, result: staleResult }), {
  canSave: false,
  reason: 'stale_result',
});
assert.deepEqual(getOutreachSaveGuard({ draft, result: currentResult }), {
  canSave: true,
  reason: 'ready',
});
assert.deepEqual(getOutreachActionGuard({ draft, result: null }), {
  canUse: false,
  reason: 'missing_result',
});
assert.deepEqual(getOutreachActionGuard({ draft, result: staleResult }), {
  canUse: false,
  reason: 'stale_result',
});
assert.deepEqual(getOutreachActionGuard({ draft, result: currentResult }), {
  canUse: true,
  reason: 'ready',
});

const firstRequest = createOutreachGenerationTracker();
const secondRequest = createOutreachGenerationTracker(firstRequest.state);

assert.equal(firstRequest.requestId, 1);
assert.equal(secondRequest.requestId, 2);
assert.equal(canApplyOutreachGenerationResult(secondRequest.state, firstRequest.requestId), false);
assert.equal(canApplyOutreachGenerationResult(secondRequest.state, secondRequest.requestId), true);
assert.equal(canApplyOutreachGenerationResult(secondRequest.state, null), false);
assert.equal(
  canApplyOutreachGenerationResult(
    invalidateOutreachGenerationTracker(secondRequest.state),
    secondRequest.requestId
  ),
  false
);

const duplicateNameSavedRecord = {
  id: 'campaign-2',
  name: 'Founder Outreach Kit',
  input: {
    ...draft,
    productName: 'Founder Outreach Kit',
  },
};

assert.deepEqual(
  getSavedCampaignStatus({
    campaign: duplicateNameSavedRecord,
    currentSavedCampaignId: 'campaign-2',
    draft,
    result: currentResult,
  }),
  {
    isActive: true,
    isFresh: true,
    label: 'Current',
  }
);
assert.deepEqual(
  getSavedCampaignStatus({
    campaign: duplicateNameSavedRecord,
    currentSavedCampaignId: 'campaign-2',
    draft: {
      ...draft,
      offer: 'Changed offer',
    },
    result: currentResult,
  }),
  {
    isActive: true,
    isFresh: false,
    label: 'Loaded stale',
  }
);
assert.deepEqual(
  getSavedCampaignStatus({
    campaign: duplicateNameSavedRecord,
    currentSavedCampaignId: 'campaign-1',
    draft,
    result: currentResult,
  }),
  {
    isActive: false,
    isFresh: false,
    label: '',
  }
);

const initialIntent = { intentVersion: 0, latestIntentById: {} };
const firstAdd = startAttachmentOperation(initialIntent, ['deck']);
const secondAdd = startAttachmentOperation(firstAdd.state, ['brief']);

const withDeck = mergeCompletedAttachmentOperation({
  state: secondAdd.state,
  attachments: [],
  operationId: firstAdd.operationId,
  entries: [{ id: 'deck', name: 'deck.txt' }],
});
assert.deepEqual(withDeck, [{ id: 'deck', name: 'deck.txt' }]);

const withBrief = mergeCompletedAttachmentOperation({
  state: secondAdd.state,
  attachments: withDeck,
  operationId: secondAdd.operationId,
  entries: [{ id: 'brief', name: 'brief.txt' }],
});
assert.deepEqual(withBrief, [
  { id: 'deck', name: 'deck.txt' },
  { id: 'brief', name: 'brief.txt' },
]);

const removed = removeAttachmentWithIntent(secondAdd.state, withBrief, 'brief');
assert.deepEqual(removed.attachments, [{ id: 'deck', name: 'deck.txt' }]);
assert.deepEqual(
  mergeCompletedAttachmentOperation({
    state: removed.state,
    attachments: removed.attachments,
    operationId: secondAdd.operationId,
    entries: [{ id: 'brief', name: 'brief.txt' }],
  }),
  [{ id: 'deck', name: 'deck.txt' }]
);

console.log('outreachWorkspaceState tests passed');
