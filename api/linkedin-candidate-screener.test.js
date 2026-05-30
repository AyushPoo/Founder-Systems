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
const originalInternalApiKey = process.env.FS_API_KEY_INTERNAL;

process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';
process.env.FS_API_KEY_INTERNAL = 'internal-test-key';
globalThis.fetch = async (url) => {
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
          reference_id: 'reserve-linkedin-test-1',
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
  };
};

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
if (typeof originalInternalApiKey === 'undefined') {
  delete process.env.FS_API_KEY_INTERNAL;
} else {
  process.env.FS_API_KEY_INTERNAL = originalInternalApiKey;
}

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

const mismatchFallbackRes = createResponse();
await handler(
  {
    method: 'POST',
    body: {
      jobDescription:
        'Founding product marketing manager for B2B SaaS. Own launches, positioning, customer research, and pricing narrative.',
      profile: {
        fullName: 'Jordan Lee',
        headline: 'Engineering Manager for infrastructure',
        currentCompany: 'CloudOps',
        experience: ['Led Kubernetes reliability team'],
        skills: ['Kubernetes', 'SRE', 'Terraform'],
      },
    },
  },
  mismatchFallbackRes
);

const mismatchFallbackPayload = JSON.parse(mismatchFallbackRes.body);
assert.equal(mismatchFallbackRes.statusCode, 200);
assert.equal(mismatchFallbackPayload.ok, true);
assert.notEqual(mismatchFallbackPayload.verdict, 'strong_fit');
assert.equal(mismatchFallbackPayload.verdict, 'weak_fit');
assert.match(mismatchFallbackPayload.candidateSummary, /limited visible role evidence|fallback mode/i);
assert.equal(
  mismatchFallbackPayload.gapsOrRisks.some((item) => /role evidence|model-backed/i.test(item)),
  true
);

const negatedEvidenceFallbackRes = createResponse();
await handler(
  {
    method: 'POST',
    body: {
      jobDescription:
        'Founding product marketing manager for B2B SaaS. Own launches, positioning, customer research, and pricing narrative.',
      profile: {
        fullName: 'Jordan Lee',
        headline: 'Engineering Manager for infrastructure reliability',
        currentCompany: 'CloudOps',
        about:
          'Led Kubernetes reliability team and managed incident response programs. No visible launches, positioning, pricing, or customer research ownership.',
        experience: [
          'Led Kubernetes reliability team and managed incident response programs. No visible launches',
          'positioning',
          'pricing',
          'or customer research ownership.',
        ],
        skills: ['Kubernetes', 'SRE', 'incident response', 'platform engineering'],
      },
    },
  },
  negatedEvidenceFallbackRes
);

const negatedEvidenceFallbackPayload = JSON.parse(negatedEvidenceFallbackRes.body);
assert.equal(negatedEvidenceFallbackRes.statusCode, 200);
assert.equal(negatedEvidenceFallbackPayload.ok, true);
assert.equal(negatedEvidenceFallbackPayload.verdict, 'weak_fit');
assert.doesNotMatch(negatedEvidenceFallbackPayload.candidateSummary, /visible overlap.*launches/i);

if (typeof originalApiKey === 'undefined') {
  delete process.env.AWS_BEARER_TOKEN_BEDROCK;
} else {
  process.env.AWS_BEARER_TOKEN_BEDROCK = originalApiKey;
}

console.log('linkedin-candidate-screener API tests passed');
