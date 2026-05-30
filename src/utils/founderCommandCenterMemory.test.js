import assert from 'node:assert/strict';
import {
  buildFounderCommandCenterSnapshot,
  buildFounderCommandCenterSections,
  summarizeMemoryFreshness,
  extractEditableMemoryItems,
} from './founderCommandCenterMemory.js';

const memoryItems = [
  {
    id: 'm1',
    type: 'metric',
    label: 'MRR',
    summary_text: 'MRR is $42k',
    value_json: { value: '42000', unit: 'usd', category: 'finance' },
    source_product: 'founder-update-generator',
    confidence: 'confirmed',
    created_at: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'm2',
    type: 'priority',
    label: 'Stabilize onboarding conversion',
    summary_text: 'Onboarding drop-off remains the top GTM priority.',
    value_json: { area: 'gtm', text: 'Stabilize onboarding conversion' },
    source_product: 'founder-spec-generator',
    confidence: 'confirmed',
    created_at: '2026-05-19T08:00:00.000Z',
  },
  {
    id: 'm3',
    type: 'risk',
    label: 'Runway pressure',
    summary_text: 'Runway may fall below six months without a burn reduction.',
    value_json: { area: 'finance', text: 'Runway below six months' },
    source_product: 'founder-pdf-summarizer',
    confidence: 'inferred',
    created_at: '2026-05-10T08:00:00.000Z',
  },
];

const snapshot = buildFounderCommandCenterSnapshot({
  memoryItems,
  now: '2026-05-20T12:00:00.000Z',
});
assert.equal(snapshot.companySummary.length > 0, true);
assert.equal(snapshot.topMetrics.length, 1);
assert.equal(snapshot.needsAttention.length, 1);
assert.equal(snapshot.whatChanged.length >= 1, true);

const sections = buildFounderCommandCenterSections({
  memoryItems,
  now: '2026-05-20T12:00:00.000Z',
});
assert.equal(sections.finance.items.length >= 1, true);
assert.equal(sections.strategy.items.length >= 1, true);

const freshness = summarizeMemoryFreshness(
  memoryItems,
  '2026-05-20T12:00:00.000Z',
);
assert.equal(freshness.hasStaleSignals, true);
assert.equal(freshness.totalSignals, 3);

const editable = extractEditableMemoryItems(memoryItems);
assert.deepEqual(
  editable.map((item) => item.type),
  ['metric', 'priority', 'risk'],
);

const refreshOnlySnapshot = buildFounderCommandCenterSnapshot({
  memoryItems: [
    {
      id: 'latest',
      type: 'metric',
      label: 'MRR',
      summary_text: 'MRR increased from 8.2L to 9.1L INR.',
      value_json: { area: 'finance', text: 'MRR increased from 8.2L to 9.1L INR.' },
      source_product: 'founder-command-center-ingest',
      confidence: 'confirmed',
      created_at: '2026-05-20T12:00:00.000Z',
    },
  ],
  now: '2026-05-20T12:00:00.000Z',
});
assert.match(refreshOnlySnapshot.companySummary, /9\.1L INR/);
assert.doesNotMatch(refreshOnlySnapshot.companySummary, /Runway pressure/);

const duplicatedRefreshItems = [
  {
    id: 'latest-refresh-company-summary',
    type: 'update',
    label: 'Latest refresh summary',
    summary_text: 'MRR grew from $42k to $48.5k. Cash collection slipped from $39.5k to $31k.',
    value_json: {
      area: 'strategy',
      text: 'MRR grew from $42k to $48.5k. Cash collection slipped from $39.5k to $31k.',
    },
    source_product: 'founder-command-center-ingest',
    confidence: 'confirmed',
    created_at: '2026-05-20T12:00:00.000Z',
  },
  {
    id: 'founder-note-1',
    type: 'priority',
    label: 'Founder note',
    summary_text: 'MRR grew from $42k to $48.5k. Cash collection slipped from $39.5k to $31k.',
    value_json: {
      area: 'strategy',
      text: 'MRR grew from $42k to $48.5k. Cash collection slipped from $39.5k to $31k.',
    },
    source_product: 'founder-command-center-ingest',
    confidence: 'confirmed',
    created_at: '2026-05-20T12:00:00.000Z',
  },
  {
    id: 'customer-risk',
    type: 'risk',
    label: 'Onboarding churn risk',
    summary_text: 'Two accounts have churn risk because onboarding is delayed.',
    value_json: { area: 'customer', text: 'Two accounts have churn risk because onboarding is delayed.' },
    source_product: 'founder-command-center-ingest',
    confidence: 'confirmed',
    created_at: '2026-05-20T12:00:00.000Z',
  },
  {
    id: 'hiring-risk',
    type: 'risk',
    label: 'Hiring pause',
    summary_text: 'Hiring is paused until collections recover.',
    value_json: { area: 'hiring', text: 'Hiring is paused until collections recover.' },
    source_product: 'founder-command-center-ingest',
    confidence: 'confirmed',
    created_at: '2026-05-20T12:00:00.000Z',
  },
];

const dedupedSnapshot = buildFounderCommandCenterSnapshot({
  memoryItems: duplicatedRefreshItems,
  now: '2026-05-20T12:00:00.000Z',
});
assert.equal(
  dedupedSnapshot.whatChanged.filter((item) => item.text.includes('Cash collection slipped')).length,
  1,
);

const dedupedSections = buildFounderCommandCenterSections({
  memoryItems: duplicatedRefreshItems,
  now: '2026-05-20T12:00:00.000Z',
});
assert.equal(dedupedSections.finance.items.some((item) => item.label === 'Onboarding churn risk'), false);
assert.equal(dedupedSections.finance.items.some((item) => item.label === 'Hiring pause'), false);
assert.equal(dedupedSections.customer.items.some((item) => item.label === 'Onboarding churn risk'), true);
assert.equal(dedupedSections.hiring.items.some((item) => item.label === 'Hiring pause'), true);

console.log('founderCommandCenterMemory tests passed');
