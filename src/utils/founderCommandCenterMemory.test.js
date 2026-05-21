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

console.log('founderCommandCenterMemory tests passed');
