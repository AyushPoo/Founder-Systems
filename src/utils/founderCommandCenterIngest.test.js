import assert from 'node:assert/strict';
import {
  normalizeFounderCommandCenterIngestRequest,
  normalizeFounderCommandCenterIngestResponse,
  mapIngestResultToMemoryCandidates,
} from './founderCommandCenterIngest.js';

const request = normalizeFounderCommandCenterIngestRequest({
  files: [{ name: 'board-update.pdf', size: 1024, type: 'application/pdf' }],
  notes: 'Board deck and current runway sheet.',
});

assert.equal(request.files.length, 1);
assert.equal(request.notes, 'Board deck and current runway sheet.');

const normalized = normalizeFounderCommandCenterIngestResponse({
  companySummary: 'Revenue is up but runway pressure remains.',
  findings: [{ type: 'risk', label: 'Runway pressure', text: 'Cash runway is under six months.' }],
  memoryCandidates: [],
});

assert.equal(normalized.companySummary.length > 0, true);

const candidates = mapIngestResultToMemoryCandidates({
  findings: [
    { type: 'metric', label: 'MRR', text: '$42k MRR', area: 'finance' },
    { type: 'risk', label: 'Runway pressure', text: 'Runway under six months', area: 'finance' },
  ],
  sourceProduct: 'founder-command-center',
});

assert.equal(candidates.length, 2);
assert.equal(candidates[0].source_product, 'founder-command-center');

console.log('founderCommandCenterIngest tests passed');
