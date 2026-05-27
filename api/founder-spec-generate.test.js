import assert from 'node:assert/strict';
import process from 'node:process';
import handler from './founder-spec-generate.js';

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

const request = {
  method: 'POST',
  headers: { cookie: 'session=test-session' },
  body: {
    mode: 'messy_idea',
    requestFinal: true,
    message: 'Generate the founder verdict and spec now.',
    session: {
      mode: 'messy_idea',
      messages: [
        { role: 'user', content: 'Build a weekly finance and pipeline memo for SaaS founders.' },
        { role: 'user', content: 'I can reach eight bootstrapped founders this week.' },
      ],
    },
  },
};

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
        return { authenticated: true, user: { id: 'user_strategy_test' } };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/reserve')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true, reference_id: 'reserve-strategy-test-1' };
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
        output: {
          message: {
            content: [{
              text: JSON.stringify({
                mode: 'show_recommendation',
                stage: 'final_verdict',
                activePanel: 'action_plan',
                confidence: 'medium',
                recommendation: {
                  title: 'Start with Monday risk memos',
                  summary: 'Validate trusted export-based alerts before adding integrations.',
                },
                verdict: { standing: 'Test before building' },
                actionPlan: { firstWeek: ['Interview eight founders'] },
                brief: { problem: 'Founders manually merge financial and pipeline risk signals.' },
                markdown: '# Founder Strategy Brief\n\n## Next 30 Days\nInterview founders.',
              }),
            }],
          },
        },
      };
    },
  };
};

const successRes = createResponse();
await handler(request, successRes);
assert.equal(successRes.statusCode, 200, successRes.body);
assert.equal(parseJsonBody(successRes).stage, 'final_verdict');
assert.match(parseJsonBody(successRes).markdown, /Founder Strategy Brief/i);

delete process.env.AWS_BEARER_TOKEN_BEDROCK;
const fallbackRes = createResponse();
await handler(request, fallbackRes);
assert.equal(fallbackRes.statusCode, 200, fallbackRes.body);
assert.equal(parseJsonBody(fallbackRes).runtime.fallbackUsed, true);
assert.match(parseJsonBody(fallbackRes).markdown, /runtime unavailable|lower-confidence/i);
process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';

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

  throw new Error(`Unexpected request after unauthorized session: ${url}`);
};

const unauthorizedRes = createResponse();
await handler(request, unauthorizedRes);
assert.equal(unauthorizedRes.statusCode, 401);
assert.match(parseJsonBody(unauthorizedRes).error, /authentication required/i);

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

console.log('founder-spec-generate API tests passed');
