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
const originalApiKey = process.env.OPENAI_API_KEY;
const originalBaseUrl = process.env.OPENAI_BASE_URL;
const originalModel = process.env.OPENAI_MODEL;
const originalOutreachApiKey = process.env.FOUNDER_OUTREACH_OPENAI_API_KEY;
const originalOutreachBaseUrl = process.env.FOUNDER_OUTREACH_OPENAI_BASE_URL;
const originalOutreachModel = process.env.FOUNDER_OUTREACH_OPENAI_MODEL;
const originalOutreachMaxOutputTokens = process.env.FOUNDER_OUTREACH_MAX_OUTPUT_TOKENS;
const originalOutreachTimeoutMs = process.env.FOUNDER_OUTREACH_TIMEOUT_MS;
const originalOutreachTemperature = process.env.FOUNDER_OUTREACH_TEMPERATURE;
const originalFounderSystemsInternalKey = process.env.FOUNDER_SYSTEMS_INTERNAL_API_KEY;
const originalFounderSystemsApiUrl = process.env.FOUNDER_SYSTEMS_API_URL;

process.env.FOUNDER_OUTREACH_OPENAI_API_KEY = 'test-key';
process.env.FOUNDER_SYSTEMS_INTERNAL_API_KEY = 'guard-key';
process.env.FOUNDER_SYSTEMS_API_URL = 'https://api.founder.test';
globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes('api.founder.test')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          ok: true,
          state: String(url).endsWith('/release') ? 'released' : 'reserved',
          reference_id: JSON.parse(options.body || '{}').reference_id,
        };
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
assert.equal(
  fallbackPayload.diagnosticNotes.some((note) => /fallback/i.test(note) && /socket hang up/i.test(note)),
  true
);

const fetchCalls = [];
globalThis.fetch = async (url, options = {}) => {
  fetchCalls.push({
    url,
    headers: options.headers,
    body: options.body,
  });

  if (String(url).includes('api.founder.test')) {
    return {
      ok: true,
      status: 200,
      async json() {
        const body = JSON.parse(options.body || '{}');
        return {
          ok: true,
          state: String(url).endsWith('/finalize') ? 'finalized' : 'reserved',
          reference_id: body.reference_id,
        };
      },
    };
  }

  if (String(url).endsWith('/responses')) {
    return {
      ok: false,
      status: 400,
      async json() {
        return {
          error: {
            message: "The model 'google.gemma-3-4b-it' does not support the '/v1/responses' API",
          },
        };
      },
    };
  }

  return {
    ok: true,
    status: 200,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
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
          },
        ],
      };
    },
  };
};
process.env.FOUNDER_OUTREACH_OPENAI_BASE_URL = 'https://litellm.example.com/v1';
process.env.FOUNDER_OUTREACH_OPENAI_MODEL = 'cheap';
process.env.FOUNDER_OUTREACH_MAX_OUTPUT_TOKENS = '900';
process.env.FOUNDER_OUTREACH_TIMEOUT_MS = '18000';
process.env.FOUNDER_OUTREACH_TEMPERATURE = '0.1';

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
assert.equal(fetchCalls[0].url, 'https://api.founder.test/v1/internal/runtime/actions/reserve');
assert.equal(fetchCalls[0].headers['X-API-Key'], 'guard-key');
assert.equal(JSON.parse(fetchCalls[0].body).action, 'outreach_generate');
assert.equal(JSON.parse(fetchCalls[0].body).model_id, 'cheap');
const modelCalls = fetchCalls.filter((call) => String(call.url).includes('litellm.example.com'));
assert.equal(modelCalls.length, 2);
assert.equal(modelCalls[0].url, 'https://litellm.example.com/v1/responses');
assert.equal(modelCalls[0].headers.Authorization, 'Bearer test-key');
assert.equal(JSON.parse(modelCalls[0].body).model, 'cheap');
assert.equal(JSON.parse(modelCalls[0].body).max_output_tokens, 900);
assert.equal(JSON.parse(modelCalls[0].body).temperature, 0.1);
assert.equal(JSON.parse(modelCalls[0].body).store, false);
assert.equal(modelCalls[1].url, 'https://litellm.example.com/v1/chat/completions');
assert.equal(JSON.parse(modelCalls[1].body).model, 'cheap');
assert.equal(JSON.parse(modelCalls[1].body).max_tokens, 900);
assert.equal(JSON.parse(modelCalls[1].body).temperature, 0.1);
assert.equal(fetchCalls.at(-1).url, 'https://api.founder.test/v1/internal/runtime/actions/finalize');
const livePayload = parseJsonBody(liveRes);
assert.equal(livePayload.ok, true);
assert.equal(livePayload.icpSnapshot.customer.length > 0, true);
assert.equal(
  livePayload.diagnosticNotes.some((note) => /local fallback scaffold/i.test(note)),
  true
);

if (typeof originalApiKey === 'undefined') {
  delete process.env.OPENAI_API_KEY;
} else {
  process.env.OPENAI_API_KEY = originalApiKey;
}
if (typeof originalBaseUrl === 'undefined') {
  delete process.env.OPENAI_BASE_URL;
} else {
  process.env.OPENAI_BASE_URL = originalBaseUrl;
}
if (typeof originalModel === 'undefined') {
  delete process.env.OPENAI_MODEL;
} else {
  process.env.OPENAI_MODEL = originalModel;
}
if (typeof originalOutreachApiKey === 'undefined') {
  delete process.env.FOUNDER_OUTREACH_OPENAI_API_KEY;
} else {
  process.env.FOUNDER_OUTREACH_OPENAI_API_KEY = originalOutreachApiKey;
}
if (typeof originalOutreachBaseUrl === 'undefined') {
  delete process.env.FOUNDER_OUTREACH_OPENAI_BASE_URL;
} else {
  process.env.FOUNDER_OUTREACH_OPENAI_BASE_URL = originalOutreachBaseUrl;
}
if (typeof originalOutreachModel === 'undefined') {
  delete process.env.FOUNDER_OUTREACH_OPENAI_MODEL;
} else {
  process.env.FOUNDER_OUTREACH_OPENAI_MODEL = originalOutreachModel;
}
if (typeof originalOutreachMaxOutputTokens === 'undefined') {
  delete process.env.FOUNDER_OUTREACH_MAX_OUTPUT_TOKENS;
} else {
  process.env.FOUNDER_OUTREACH_MAX_OUTPUT_TOKENS = originalOutreachMaxOutputTokens;
}
if (typeof originalOutreachTimeoutMs === 'undefined') {
  delete process.env.FOUNDER_OUTREACH_TIMEOUT_MS;
} else {
  process.env.FOUNDER_OUTREACH_TIMEOUT_MS = originalOutreachTimeoutMs;
}
if (typeof originalOutreachTemperature === 'undefined') {
  delete process.env.FOUNDER_OUTREACH_TEMPERATURE;
} else {
  process.env.FOUNDER_OUTREACH_TEMPERATURE = originalOutreachTemperature;
}
if (typeof originalFounderSystemsInternalKey === 'undefined') {
  delete process.env.FOUNDER_SYSTEMS_INTERNAL_API_KEY;
} else {
  process.env.FOUNDER_SYSTEMS_INTERNAL_API_KEY = originalFounderSystemsInternalKey;
}
if (typeof originalFounderSystemsApiUrl === 'undefined') {
  delete process.env.FOUNDER_SYSTEMS_API_URL;
} else {
  process.env.FOUNDER_SYSTEMS_API_URL = originalFounderSystemsApiUrl;
}
globalThis.fetch = originalFetch;

console.log('founder-outreach-generate tests passed');
