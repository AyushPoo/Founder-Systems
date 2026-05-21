import assert from 'assert';
import process from 'node:process';
import handler from './founder-update-generate.js';

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload) {
      this.body = String(payload ?? '');
    },
  };
}

function parseJsonBody(res) {
  return JSON.parse(res.body);
}

const req = {
  method: 'POST',
  body: {
    files: [
      {
        filename: 'weekly-notes.pdf',
        mimeType: 'application/pdf',
        fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
        fileSize: 2048,
      },
      {
        filename: 'metrics.csv',
        mimeType: 'text/csv',
        fileData: 'data:text/csv;base64,bXJyLDYl',
        fileSize: 8,
      },
    ],
    contextNotes: 'Keep this brutally honest.',
  },
};

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.AWS_BEARER_TOKEN_BEDROCK;
process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';

globalThis.fetch = async () => ({
  ok: true,
  status: 200,
  async json() {
    return {
      output_text: JSON.stringify({
        title: 'Founder update',
        reportingPeriod: 'Current period',
        topline: 'Growth is intact, but delivery pressure is building.',
        whatChanged: ['Closed a pilot.', 'Delayed one release.'],
        wins: ['Signed one lighthouse customer.'],
        challenges: ['Bandwidth remains tight.'],
        metricsAndProof: ['MRR grew 6% week over week.'],
        nextFocus: ['Stabilize delivery before adding more pipeline.'],
        asks: ['Need one product hiring referral.'],
        confidenceGaps: ['Retention proof is still incomplete.'],
        extractionNotes: ['One note set was sparse.'],
        sourceFiles: ['weekly-notes.pdf', 'metrics.csv'],
      }),
    };
  },
});

const res = createResponse();
await handler(req, res);

globalThis.fetch = originalFetch;
if (typeof originalApiKey === 'undefined') {
  delete process.env.AWS_BEARER_TOKEN_BEDROCK;
} else {
  process.env.AWS_BEARER_TOKEN_BEDROCK = originalApiKey;
}

assert.equal(res.statusCode, 200);
const payload = parseJsonBody(res);
assert.equal(payload.ok, true);
assert.equal(payload.wins.length, 1);
assert.equal(payload.sourceFiles.length, 2);

console.log('founder-update-generate API tests passed');
