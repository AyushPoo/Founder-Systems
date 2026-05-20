import assert from 'assert';
import {
  LINKEDIN_CANDIDATE_VERDICTS,
  buildRecruiterNotes,
  normalizeLinkedinCandidateRequest,
  normalizeLinkedinCandidateResponse,
} from './linkedinCandidateScreener.js';

const request = normalizeLinkedinCandidateRequest({
  jobDescription: 'Senior product marketer for B2B SaaS',
  profile: {
    fullName: 'Avery Shah',
    headline: 'Product Marketing Lead at Drift',
    currentCompany: 'Drift',
  },
  includeActivity: true,
});

assert.equal(request.jobDescription, 'Senior product marketer for B2B SaaS');
assert.equal(request.profile.fullName, 'Avery Shah');
assert.equal(request.includeActivity, true);

const normalized = normalizeLinkedinCandidateResponse({
  verdict: 'strong_fit',
  confidence: 'high',
  candidateSummary: 'Strong PMM profile with relevant SaaS motion experience.',
  fitSignals: ['Led product launches for B2B SaaS products.'],
  gapsOrRisks: ['No explicit pricing ownership shown.'],
  interviewChecks: ['Verify ownership of enterprise messaging.'],
  recruiterNotes: ['Likely worth first-round screen for PMM scope.'],
});

assert.equal(normalized.ok, true);
assert.equal(normalized.verdict, LINKEDIN_CANDIDATE_VERDICTS.strong_fit);
assert.equal(
  buildRecruiterNotes(normalized).includes('Likely worth first-round screen'),
  true
);

assert.equal(
  normalizeLinkedinCandidateResponse({
    verdict: 'unknown',
    fitSignals: [],
  }).ok,
  false
);

console.log('linkedinCandidateScreener shared tests passed');
