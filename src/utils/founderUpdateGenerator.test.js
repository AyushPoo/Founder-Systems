import assert from 'assert';
import { Buffer } from 'node:buffer';
import {
  MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES,
  buildFounderUpdateMarkdown,
  createFounderUpdateDraft,
  normalizeFounderUpdateRequest,
  normalizeFounderUpdateResponse,
  validateFounderUpdateRequest,
} from './founderUpdateGenerator.js';

function createPdfDataUrl(byteLength) {
  return `data:application/pdf;base64,${Buffer.alloc(byteLength).toString('base64')}`;
}

const draft = createFounderUpdateDraft();
assert.deepEqual(draft.files, []);
assert.equal(draft.contextNotes, '');

const normalized = normalizeFounderUpdateRequest({
  files: [
    {
      filename: 'weekly-notes.pdf',
      mimeType: 'application/pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
      fileSize: 1024,
    },
  ],
  contextNotes: 'Highlight the real blockers.',
  pastedNotes: 'Customer pilot expanded, but the release slipped.',
});

assert.equal(normalized.files.length, 1);
assert.equal(normalized.files[0].id, 'file-1');
assert.equal(normalized.contextNotes, 'Highlight the real blockers.');
assert.equal(normalized.pastedNotes, 'Customer pilot expanded, but the release slipped.');

const invalid = validateFounderUpdateRequest({ files: [] });
assert.equal(invalid.isValid, false);
assert.match(invalid.error, /at least one/i);

const pastedNotesOnly = validateFounderUpdateRequest({
  pastedNotes: 'Revenue stayed flat, but two pilot accounts expanded.',
});

assert.equal(pastedNotesOnly.isValid, true);

const oversized = validateFounderUpdateRequest({
  files: [
    {
      filename: 'huge.pdf',
      mimeType: 'application/pdf',
      fileData: createPdfDataUrl(MAX_FOUNDER_UPDATE_FILE_SIZE_BYTES + 1),
      fileSize: 1,
    },
  ],
});

assert.equal(oversized.isValid, false);
assert.match(oversized.error, /under/i);

const normalizedResponse = normalizeFounderUpdateResponse({
  title: 'Founder update',
  reportingPeriod: 'Week of May 20',
  topline: 'Revenue held up, but delivery slipped.',
  whatChanged: ['Closed two new pilots.', 'Moved one release by a week.'],
  wins: ['Signed a lighthouse customer.'],
  challenges: ['Implementation bandwidth is tight.'],
  metricsAndProof: ['MRR grew 6% week over week.'],
  nextFocus: ['Stabilize delivery before expanding the pipeline.'],
  asks: ['Need one product hiring referral.'],
  confidenceGaps: ['Retention evidence is still light.'],
  extractionNotes: ['One spreadsheet tab had sparse labels.'],
  sourceFiles: ['weekly-notes.pdf'],
});

assert.equal(normalizedResponse.ok, true);
assert.equal(normalizedResponse.wins.length, 1);

const markdown = buildFounderUpdateMarkdown({
  title: 'Founder update',
  update: normalizedResponse,
});

assert.match(markdown, /^# Founder Update: Founder update/m);
assert.match(markdown, /## What Changed/m);
assert.match(markdown, /## Wins/m);
assert.match(markdown, /## Metrics And Proof/m);
assert.match(markdown, /## What Needs Attention Next/m);
assert.match(markdown, /## Confidence Or Gaps/m);

console.log('founderUpdateGenerator tests passed');
