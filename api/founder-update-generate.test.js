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

assert.equal(res.statusCode, 200);
const payload = parseJsonBody(res);
assert.equal(payload.ok, true);
assert.equal(payload.wins.length, 1);
assert.equal(payload.sourceFiles.length, 2);

delete process.env.AWS_BEARER_TOKEN_BEDROCK;
const missingRuntimeReq = {
  method: 'POST',
  headers: { cookie: 'session=update-fallback-test' },
  body: {
    files: [],
    pastedNotes: 'MRR rose from $42k to $47k. One renewal slipped into June. Ask: introductions to two founders.',
    contextNotes: 'Keep the trust risk clear.',
  },
};
const missingRuntimeRes = createResponse();
await handler(missingRuntimeReq, missingRuntimeRes);
assert.equal(missingRuntimeRes.statusCode, 200, missingRuntimeRes.body);
const missingRuntimePayload = parseJsonBody(missingRuntimeRes);
assert.equal(missingRuntimePayload.runtime.fallbackUsed, true);
assert.match(missingRuntimePayload.topline, /lower-confidence|runtime/i);
assert.match(missingRuntimePayload.metricsAndProof[0], /MRR|\$42k/i);
assert.match(missingRuntimePayload.extractionNotes[0], /aws_bearer_token_bedrock/i);

const fileOnlyMissingRuntimeRes = createResponse();
await handler({
  method: 'POST',
  headers: { cookie: 'session=update-file-fallback-test' },
  body: {
    files: [
      {
        filename: 'metrics.csv',
        mimeType: 'text/csv',
        fileData: 'data:text/csv;base64,bWV0cmljLHZhbHVlCk1SUiw0NzAwMA==',
        fileSize: 25,
      },
    ],
  },
}, fileOnlyMissingRuntimeRes);
assert.equal(fileOnlyMissingRuntimeRes.statusCode, 200, fileOnlyMissingRuntimeRes.body);
const fileOnlyMissingRuntimePayload = parseJsonBody(fileOnlyMissingRuntimeRes);
assert.equal(fileOnlyMissingRuntimePayload.sourceFiles[0], 'metrics.csv');
assert.match(fileOnlyMissingRuntimePayload.metricsAndProof[0], /readable source preview|MRR/i);

globalThis.fetch = async (url) => {
  if (String(url).endsWith('/auth/session')) {
    return {
      ok: false,
      status: 401,
      async json() {
        return { authenticated: false };
      },
    };
  }

  throw new Error(`Unexpected unauthenticated fallback request: ${url}`);
};
const unauthorizedMissingRuntimeRes = createResponse();
await handler(missingRuntimeReq, unauthorizedMissingRuntimeRes);
assert.equal(unauthorizedMissingRuntimeRes.statusCode, 401);
assert.match(parseJsonBody(unauthorizedMissingRuntimeRes).error, /authentication required/i);

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

console.log('founder-update-generate API tests passed');
