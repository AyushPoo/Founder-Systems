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
const originalInternalApiKey = process.env.FS_API_KEY_INTERNAL;
process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';
process.env.FS_API_KEY_INTERNAL = 'internal-test-key';

globalThis.fetch = async (url, options = {}) => {
  if (String(url).endsWith('/auth/session')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          authenticated: true,
          user: { id: 'user_test_123' },
        };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/reserve')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          ok: true,
          reference_id: 'reserve-update-test-1',
        };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/finalize')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true };
      },
    };
  }

  return {
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
  };
};

const res = createResponse();
await handler(req, res);

globalThis.fetch = originalFetch;
if (typeof originalApiKey === 'undefined') {
  delete process.env.AWS_BEARER_TOKEN_BEDROCK;
} else {
  process.env.AWS_BEARER_TOKEN_BEDROCK = originalApiKey;
}

if (typeof originalInternalApiKey === 'undefined') {
  delete process.env.FS_API_KEY_INTERNAL;
} else {
  process.env.FS_API_KEY_INTERNAL = originalInternalApiKey;
}

assert.equal(res.statusCode, 200);
const payload = parseJsonBody(res);
assert.equal(payload.ok, true);
assert.equal(payload.wins.length, 1);
assert.equal(payload.sourceFiles.length, 2);

console.log('founder-update-generate API tests passed');
