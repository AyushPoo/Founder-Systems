import assert from 'assert';
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'events';
import process from 'node:process';
import handler from './founder-outreach-generate.js';

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

function createStreamingRequest(bodyText) {
  const req = new EventEmitter();
  req.method = 'POST';
  process.nextTick(() => {
    if (bodyText) {
      req.emit('data', Buffer.from(bodyText));
    }
    req.emit('end');
  });
  return req;
}

function parseJsonBody(res) {
  return JSON.parse(res.body);
}

const malformedReq = createStreamingRequest('{"productName":');
const malformedRes = createResponse();
await handler(malformedReq, malformedRes);

assert.equal(malformedRes.statusCode, 400);
assert.match(parseJsonBody(malformedRes).error, /invalid json|malformed json|parse/i);

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.AWS_BEARER_TOKEN_BEDROCK;
const originalInternalApiKey = process.env.FS_API_KEY_INTERNAL;

process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';
process.env.FS_API_KEY_INTERNAL = 'internal-test-key';
globalThis.fetch = async (url) => {
  if (String(url).endsWith('/auth/session')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { authenticated: true, user: { id: 'user_test_123' } };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/reserve')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true, reference_id: 'reserve-outreach-fallback-test-1' };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/release')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true };
      },
    };
  }

  throw new Error('socket hang up');
};

const fallbackReq = {
  method: 'POST',
  body: {
    productName: 'Founder Outreach Kit',
    offer: 'Outbound campaign generator',
    targetCustomer: 'Solo SaaS founders',
    buyerRole: 'Founder',
    painPoint: 'They do not know what to say in cold outreach',
    desiredOutcome: 'Book first calls',
    cta: 'Open to a quick call?',
    tone: 'founder-led',
    channels: ['email', 'linkedin'],
  },
};
const fallbackRes = createResponse();
await handler(fallbackReq, fallbackRes);

assert.equal(fallbackRes.statusCode, 200);
const fallbackPayload = parseJsonBody(fallbackRes);
assert.equal(fallbackPayload.ok, true);
assert.equal(fallbackPayload.emails.length >= 4, true);
assert.equal(fallbackPayload.diagnosticNotes.some((note) => /socket hang up/i.test(note)), true);

const fetchCalls = [];
globalThis.fetch = async (url, options = {}) => {
  if (String(url).endsWith('/auth/session')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { authenticated: true, user: { id: 'user_test_123' } };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/reserve')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true, reference_id: 'reserve-outreach-live-test-1' };
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

  fetchCalls.push({
    url,
    headers: options.headers,
    body: options.body,
  });

  return {
    ok: true,
    status: 200,
    async json() {
      return {
        output: {
          message: {
            content: [
              {
                text: JSON.stringify({
                  diagnosticNotes: ['live model'],
                  fixBeforeSending: ['Tighten proof'],
                  positioningAngles: [
                    {
                      name: 'Pain-led',
                      target: 'Solo SaaS founders',
                      angle: 'Stop writing blank-page cold emails',
                      whyItWorks: 'Speaks to immediate pain',
                      openingStyle: 'Pattern interrupt',
                    },
                  ],
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
                  csvRows: [],
                }),
              },
            ],
          },
        },
      };
    },
  };
};

const liveReq = {
  method: 'POST',
  body: {
    productName: 'Founder Outreach Kit',
    offer: 'Outbound campaign generator',
    targetCustomer: 'Solo SaaS founders',
    buyerRole: 'Founder',
    painPoint: 'They do not know what to say in cold outreach',
    desiredOutcome: 'Book first calls',
    cta: 'Open to a quick call?',
    tone: 'founder-led',
    channels: ['email', 'linkedin'],
  },
};
const liveRes = createResponse();
await handler(liveReq, liveRes);

assert.equal(liveRes.statusCode, 200);
assert.equal(fetchCalls.length, 1);
assert.match(fetchCalls[0].url, /bedrock-runtime\..+\/model\/.+\/converse$/i);
assert.equal(fetchCalls[0].headers.Authorization, 'Bearer test-key');
assert.equal(JSON.parse(fetchCalls[0].body).inferenceConfig.maxTokens, 950);
assert.equal(JSON.parse(fetchCalls[0].body).inferenceConfig.temperature, 0.1);
const livePayload = parseJsonBody(liveRes);
assert.equal(livePayload.ok, true);
assert.equal(livePayload.icpSnapshot.customer.length > 0, true);
assert.equal(
  livePayload.diagnosticNotes.some((note) => /local fallback scaffold/i.test(note)),
  true
);

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

  throw new Error(`Unexpected request after unauthenticated session: ${url}`);
};

const unauthorizedRes = createResponse();
await handler(liveReq, unauthorizedRes);

assert.equal(unauthorizedRes.statusCode, 401);
assert.match(parseJsonBody(unauthorizedRes).error, /authentication required/i);

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
globalThis.fetch = originalFetch;

console.log('founder-outreach-generate tests passed');
