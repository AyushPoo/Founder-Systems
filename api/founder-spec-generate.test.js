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
assert.equal(Boolean(parseJsonBody(fallbackRes).brief.excludedFeatures), true);
assert.equal(Boolean(parseJsonBody(fallbackRes).evidence[0].title), true);
assert.equal(Boolean(parseJsonBody(fallbackRes).evidence[0].summary), true);
assert.doesNotMatch(parseJsonBody(fallbackRes).brief.problem, /Generate the founder verdict/i);

const longContextFallbackRes = createResponse();
await handler({
  ...request,
  body: {
    ...request.body,
    session: {
      ...request.body.session,
      messages: [
        {
          role: 'user',
          content: `Initial context: ${'cash visibility and pipeline reconciliation. '.repeat(24)}`,
        },
        {
          role: 'user',
          content: 'Second signal: eight reachable founders agreed to review an anonymized memo prototype.',
        },
      ],
    },
  },
}, longContextFallbackRes);
assert.equal(longContextFallbackRes.statusCode, 200, longContextFallbackRes.body);
assert.match(parseJsonBody(longContextFallbackRes).brief.problem, /- Initial context:/);
assert.match(parseJsonBody(longContextFallbackRes).brief.problem, /\n- Second signal:/);
process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';

globalThis.fetch = async () => ({
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
                title: 'Free strategy draft',
                summary: 'StrategyForge can now produce the final plan without a credit reservation.',
              },
              verdict: { standing: 'Proceed with validation' },
              actionPlan: { firstWeek: ['Run the manual proof test'] },
              brief: { problem: 'Founders need a free first strategy spec.' },
              markdown: '# Founder Strategy Brief\n\n## Free beta access\nGenerate the plan.',
            }),
          }],
        },
      },
    };
  },
});

const freeAccessRes = createResponse();
await handler(request, freeAccessRes);
assert.equal(freeAccessRes.statusCode, 200, freeAccessRes.body);
assert.match(parseJsonBody(freeAccessRes).markdown, /Free beta access/i);

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
