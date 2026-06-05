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

const FALLBACK_STOP_WORDS = new Set([
  'about',
  'against',
  'and',
  'candidate',
  'company',
  'current',
  'description',
  'experience',
  'founding',
  'for',
  'from',
  'have',
  'hiring',
  'lead',
  'manager',
  'role',
  'senior',
  'team',
  'that',
  'the',
  'this',
  'with',
]);

function tokenizeFallbackText(value) {
  return cleanText(value)
    .toLowerCase()
    .split(/[^a-z0-9+#]+/i)
    .filter((token) => token.length >= 3 && !FALLBACK_STOP_WORDS.has(token));
}

function buildFallbackKeywordSet(values = []) {
  return new Set((Array.isArray(values) ? values : [values]).flatMap(tokenizeFallbackText));
}

function isNegatedFallbackKeyword(text, token) {
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `\\b(?:no|not|without|lacks?|missing|thin)\\b[^.\\n;]{0,80}\\b${escapedToken}\\b`,
    'i'
  ).test(cleanText(text));
}

function scoreFallbackRoleMatch(request, profileSignals = []) {
  const roleKeywords = buildFallbackKeywordSet(request.jobDescription);
  const profileTexts = Array.isArray(profileSignals) ? profileSignals.map(cleanText).filter(Boolean) : [];
  const profileKeywords = buildFallbackKeywordSet(profileTexts);
  const matchedKeywords = [...roleKeywords].filter(
    (token) =>
      profileKeywords.has(token) &&
      !profileTexts.some((text) => isNegatedFallbackKeyword(text, token)) &&
      profileTexts.some((text) => tokenizeFallbackText(text).includes(token))
  );
  const matchCount = matchedKeywords.length;

  return {
    matchedKeywords,
    verdict:
      matchCount >= 3
        ? LINKEDIN_CANDIDATE_VERDICTS.strong_fit
        : matchCount >= 1
          ? LINKEDIN_CANDIDATE_VERDICTS.potential_fit
          : LINKEDIN_CANDIDATE_VERDICTS.weak_fit,
  };
}

function buildFallbackResponse(request) {
  const profileSignals = [
    request.profile.headline,
    request.profile.currentCompany,
    request.profile.about,
    ...request.profile.experience,
    ...request.profile.skills,
  ].filter(Boolean);

  const roleMatch = scoreFallbackRoleMatch(request, profileSignals);
  const confidence = request.resumeText ? 'medium' : 'low';
  const hasRoleEvidence = roleMatch.matchedKeywords.length > 0;

  return {
    verdict: roleMatch.verdict,
    confidence,
    candidateSummary: hasRoleEvidence
      ? `${request.profile.fullName || 'This candidate'} has visible overlap with the role on ${roleMatch.matchedKeywords.slice(0, 4).join(', ')}, but this result is running in fallback mode without a live model-backed screen.`
      : `${request.profile.fullName || 'This candidate'} has limited visible role evidence for the target job, and this result is running in fallback mode without a live model-backed screen.`,
    fitSignals: hasRoleEvidence
      ? roleMatch.matchedKeywords.slice(0, 4).map((token) => `Visible overlap with role keyword: ${token}.`)
      : profileSignals.slice(0, 3).length
        ? profileSignals.slice(0, 3)
      : ['Visible profile details suggest partial relevance to the role.'],
    gapsOrRisks: [
      'Visible profile context is limited compared with a full model-backed screen.',
      hasRoleEvidence
        ? 'Keyword overlap is not a substitute for validated scope, outcomes, or hiring-bar evidence.'
        : 'Role evidence is thin in the visible profile; do not treat title seniority as role fit.',
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

  // Special mode: summarize profile without screening against a role
  if (request.jobDescription === '__summarize_only__' || requestBody?.jobDescription === '__summarize_only__') {
    const profileText = [
      request.profile.fullName || requestBody?.profile?.fullName || '',
      request.profile.headline || requestBody?.profile?.headline || '',
      request.profile.about || requestBody?.profile?.about || '',
      ...(request.profile.experience || []),
      ...(request.profile.skills || []),
    ].filter(Boolean).join('\n');

    if (!profileText || profileText.length < 10) {
      writeJson(res, 200, { ok: true, domain: 'General', candidateSummary: 'Could not read enough profile data.', experience: [], education: [], skills: [], fitSignals: [] });
      return;
    }

    if (!process.env.AWS_BEARER_TOKEN_BEDROCK && !process.env.BEDROCK_API_KEY && !process.env.FOUNDER_SYSTEMS_BEDROCK_API_KEY) {
      const hl = profileText.toLowerCase();
      let domain = 'General';
      const dMap = { 'Finance': ['finance','ca inter','ca final','cpa','cfa','audit','tax','chartered'], 'Engineering': ['engineer','developer','software','sde'], 'Marketing': ['marketing','growth','seo','brand'], 'Sales': ['sales','business development'], 'Product': ['product manager'], 'Design': ['design','ux','ui'], 'Data': ['data scientist','data analyst','analytics','ml'], 'HR': ['recruiter','talent','human resources'] };
      for (const [d, kws] of Object.entries(dMap)) { if (kws.some(k => hl.includes(k))) { domain = d; break; } }
      writeJson(res, 200, { ok: true, domain, seniority: '', candidateSummary: profileText.slice(0, 200), experience: [], education: [], skills: [], fitSignals: [] });
      return;
    }

    try {
      const modelResult = await invokeFounderJsonModel({
        req,
        productKey: 'linkedin-candidate-screener',
        systemPrompt: 'Extract profile info from LinkedIn text. Return ONLY valid JSON matching this EXACT format. Do NOT add fields. Do NOT invent information not in the text.\n\nExample output:\n{"ok":true,"domain":"Finance","seniority":"Mid","tagline":"Co-Founder GradeSense | Ex-Grant Thornton | CFA L1","background":"Co-founded GradeSense (edtech). Previously audit at Grant Thornton and PE at Vincere Partners.","career":[{"role":"Co-Founder","company":"GradeSense","period":"2024-present","note":"AI grading platform"},{"role":"Audit Associate","company":"Grant Thornton","period":"2021-2023","note":"Statutory audits"}],"goodFor":"Fintech startups, IB analyst, edtech founder roles","credentials":"MBA Scaler, CA Inter, CFA L1","topSkills":["Financial Analysis","M&A","Audit","Excel","Valuation"]}\n\nRules: Use ONLY info from the text. Never say "passionate" or "eager". List the CURRENT role first. Include ALL companies mentioned.',
        userPrompt: 'Extract from this LinkedIn profile. Only use facts in the text:\n\n' + profileText.slice(0, 4500),
        maxOutputTokens: 450,
        modelTier: 'quality',
        modelTier: 'quality',
        usage: { skipGuard: true },
      });
      applyRateLimitHeaders(res, modelResult.rateLimit);
      writeJson(res, 200, { ok: true, ...modelResult.parsed });
    } catch (err) {
      applyRateLimitHeaders(res, err?.rateLimit);
      writeJson(res, 200, { ok: true, domain: 'General', candidateSummary: profileText.slice(0, 200), experience: [], education: [], skills: [], fitSignals: [] });
    }
    return;
  }

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
      applyRateLimitHeaders(res, modelResult.rateLimit);
      writeJson(res, 200, {
        ok: true,
        ...buildFallbackResponse(request),
        runtime: {
          fallbackUsed: true,
          fallbackReason: parsed.error || 'Model-backed candidate screen was incomplete.',
        },
      });
      return;
    }

    applyRateLimitHeaders(res, modelResult.rateLimit);
    writeJson(res, 200, {
      ok: true,
      ...parsed,
    });
  } catch (error) {
    applyRateLimitHeaders(res, error?.rateLimit);
    writeJson(res, 200, {
      ok: true,
      ...buildFallbackResponse(request),
      runtime: {
        fallbackUsed: true,
        fallbackReason: cleanText(error?.message) || 'LinkedIn candidate screener generation failed.',
      },
    });
  }
}
