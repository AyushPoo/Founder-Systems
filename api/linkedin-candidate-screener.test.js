import assert from 'assert';
import process from 'node:process';
import handler from './linkedin-candidate-screener.js';

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

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.AWS_BEARER_TOKEN_BEDROCK;

process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';
globalThis.fetch = async () => ({
  ok: true,
  async json() {
    return {
      output_text: JSON.stringify({
        verdict: 'potential_fit',
        confidence: 'medium',
        candidateSummary: 'Strong SaaS marketer with some enterprise gaps.',
        fitSignals: ['Relevant GTM background.'],
        gapsOrRisks: ['No clear pricing ownership.'],
        interviewChecks: ['Verify enterprise sales enablement depth.'],
        recruiterNotes: ['Worth screening if pricing exposure is sufficient.'],
        inputsUsed: ['linkedin_profile', 'job_description'],
      }),
    };
  },
});

const res = createResponse();
await handler(
  {
    method: 'POST',
    body: {
      jobDescription: 'Senior Product Marketing Manager',
      profile: {
        fullName: 'Avery Shah',
        headline: 'Product Marketing Lead at Drift',
      },
    },
  },
  res
);

assert.equal(res.statusCode, 200);
assert.equal(JSON.parse(res.body).ok, true);

globalThis.fetch = originalFetch;
delete process.env.AWS_BEARER_TOKEN_BEDROCK;

const fallbackRes = createResponse();
await handler(
  {
    method: 'POST',
    body: {
      jobDescription: 'Founding recruiter',
      profile: {
        fullName: 'Nina Cole',
        headline: 'Talent Partner | early-stage SaaS hiring',
        experience: ['Scaled GTM hiring from 12 to 80 people'],
      },
    },
  },
  fallbackRes
);

const fallbackPayload = JSON.parse(fallbackRes.body);
assert.equal(fallbackRes.statusCode, 200);
assert.equal(fallbackPayload.ok, true);
assert.equal(Array.isArray(fallbackPayload.recruiterNotes), true);

if (typeof originalApiKey === 'undefined') {
  delete process.env.AWS_BEARER_TOKEN_BEDROCK;
} else {
  process.env.AWS_BEARER_TOKEN_BEDROCK = originalApiKey;
}

console.log('linkedin-candidate-screener API tests passed');
