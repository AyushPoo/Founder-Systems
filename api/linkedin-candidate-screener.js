import process from 'node:process';
import {
  LINKEDIN_CANDIDATE_VERDICTS,
  normalizeLinkedinCandidateRequest,
  normalizeLinkedinCandidateResponse,
} from '../shared/linkedinCandidateScreener.js';
import {
  applyRateLimitHeaders,
  invokeFounderJsonModel,
} from './_lib/founderAiRuntime.js';

function writeJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
  }
  res.end(JSON.stringify(payload));
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function buildFallbackResponse(request) {
  const profileSignals = [
    request.profile.headline,
    request.profile.currentCompany,
    ...request.profile.experience,
    ...request.profile.skills,
  ].filter(Boolean);

  const signalText = profileSignals.join(' ').toLowerCase();
  const looksStrong =
    signalText.includes('lead') ||
    signalText.includes('head') ||
    signalText.includes('manager');
  const confidence = request.resumeText ? 'medium' : 'low';

  return {
    verdict: looksStrong
      ? LINKEDIN_CANDIDATE_VERDICTS.strong_fit
      : LINKEDIN_CANDIDATE_VERDICTS.potential_fit,
    confidence,
    candidateSummary: `${request.profile.fullName || 'This candidate'} shows visible relevance to the target role, but this result is running in fallback mode without a live model-backed screen.`,
    fitSignals: profileSignals.slice(0, 3).length
      ? profileSignals.slice(0, 3)
      : ['Visible profile details suggest partial relevance to the role.'],
    gapsOrRisks: [
      'Visible profile context is limited compared with a full model-backed screen.',
    ],
    interviewChecks: ['Verify ownership, measurable outcomes, and role scope live.'],
    recruiterNotes: [
      'Use this as a first-pass screen and verify the important claims in conversation.',
    ],
    inputsUsed: [
      'linkedin_profile',
      request.jobDescription ? 'job_description' : '',
      request.resumeText ? 'resume' : '',
      request.includeActivity ? 'recent_activity' : '',
      request.includeExternalLinks ? 'external_links' : '',
    ].filter(Boolean),
  };
}

function extractOutputText(payload = {}) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const textParts = [];

  output.forEach((item) => {
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((part) => {
      if (typeof part?.text === 'string' && part.text.trim()) {
        textParts.push(part.text.trim());
      }
    });
  });

  return textParts.join('\n').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    writeJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const requestBody =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return {};
          }
        })()
      : req.body || {};
  const request = normalizeLinkedinCandidateRequest(requestBody);

  if (!request.jobDescription || !request.profile.fullName) {
    writeJson(res, 400, {
      error: 'Provide a job description and a visible LinkedIn profile before screening.',
    });
    return;
  }

  if (
    !process.env.AWS_BEARER_TOKEN_BEDROCK &&
    !process.env.BEDROCK_API_KEY &&
    !process.env.FOUNDER_SYSTEMS_BEDROCK_API_KEY
  ) {
    writeJson(res, 200, {
      ok: true,
      ...buildFallbackResponse(request),
    });
    return;
  }

  try {
    const modelResult = await invokeFounderJsonModel({
      req,
      productKey: 'linkedin-candidate-screener',
      systemPrompt:
        'You are a recruiter screening assistant. Return only JSON with verdict, confidence, candidateSummary, fitSignals, gapsOrRisks, interviewChecks, recruiterNotes, and inputsUsed.',
      userPrompt: JSON.stringify(request),
      maxOutputTokens: 500,
      modelTier: 'cheap',
    });

    const parsed = normalizeLinkedinCandidateResponse(modelResult.parsed);

    if (!parsed.ok) {
      writeJson(res, 502, { error: parsed.error });
      return;
    }

    applyRateLimitHeaders(res, modelResult.rateLimit);
    writeJson(res, 200, {
      ok: true,
      ...parsed,
    });
  } catch (error) {
    applyRateLimitHeaders(res, error?.rateLimit);
    writeJson(res, Number.isInteger(error?.statusCode) ? error.statusCode : 502, {
      error: cleanText(error?.message) || 'LinkedIn candidate screener generation failed.',
    });
  }
}
