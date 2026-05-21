export const LINKEDIN_CANDIDATE_VERDICTS = {
  strong_fit: 'strong_fit',
  potential_fit: 'potential_fit',
  weak_fit: 'weak_fit',
};

const CONFIDENCE_LEVELS = new Set(['high', 'medium', 'low']);

function cleanText(value) {
  return String(value ?? '').trim();
}

function cleanList(values) {
  return Array.isArray(values) ? values.map(cleanText).filter(Boolean) : [];
}

function normalizeProfile(profile = {}) {
  return {
    fullName: cleanText(profile.fullName),
    headline: cleanText(profile.headline),
    location: cleanText(profile.location),
    currentCompany: cleanText(profile.currentCompany),
    about: cleanText(profile.about),
    experience: cleanList(profile.experience),
    education: cleanList(profile.education),
    skills: cleanList(profile.skills),
    recentActivity: cleanList(profile.recentActivity),
    externalLinks: cleanList(profile.externalLinks),
  };
}

export function normalizeLinkedinCandidateRequest(input = {}) {
  return {
    jobDescription: cleanText(input.jobDescription),
    resumeText: cleanText(input.resumeText),
    includeActivity: Boolean(input.includeActivity),
    includeExternalLinks: Boolean(input.includeExternalLinks),
    profile: normalizeProfile(input.profile),
  };
}

export function normalizeLinkedinCandidateResponse(payload = {}) {
  const verdict = cleanText(payload.verdict).toLowerCase();
  const confidence = cleanText(payload.confidence).toLowerCase();
  const candidateSummary = cleanText(payload.candidateSummary);
  const fitSignals = cleanList(payload.fitSignals);
  const gapsOrRisks = cleanList(payload.gapsOrRisks);
  const interviewChecks = cleanList(payload.interviewChecks);
  const recruiterNotes = cleanList(payload.recruiterNotes);

  if (
    !Object.values(LINKEDIN_CANDIDATE_VERDICTS).includes(verdict) ||
    !CONFIDENCE_LEVELS.has(confidence) ||
    !candidateSummary ||
    fitSignals.length === 0 ||
    gapsOrRisks.length === 0 ||
    interviewChecks.length === 0 ||
    recruiterNotes.length === 0
  ) {
    return {
      ok: false,
      error: 'LinkedIn candidate screener response is incomplete.',
    };
  }

  return {
    ok: true,
    verdict,
    confidence,
    candidateSummary,
    fitSignals,
    gapsOrRisks,
    interviewChecks,
    recruiterNotes,
    inputsUsed: cleanList(payload.inputsUsed),
  };
}

export function buildRecruiterNotes(result = {}) {
  const normalized = normalizeLinkedinCandidateResponse(result);

  if (!normalized.ok) {
    return 'Recruiter notes unavailable.';
  }

  return [
    `Verdict: ${normalized.verdict}`,
    `Confidence: ${normalized.confidence}`,
    '',
    normalized.candidateSummary,
    '',
    'Fit signals:',
    ...normalized.fitSignals.map((item) => `- ${item}`),
    '',
    'Gaps or risks:',
    ...normalized.gapsOrRisks.map((item) => `- ${item}`),
    '',
    'Interview checks:',
    ...normalized.interviewChecks.map((item) => `- ${item}`),
    '',
    'Recruiter notes:',
    ...normalized.recruiterNotes.map((item) => `- ${item}`),
  ].join('\n');
}
