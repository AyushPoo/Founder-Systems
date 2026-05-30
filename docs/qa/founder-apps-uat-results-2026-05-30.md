# Founder Apps UAT Results

Date: 2026-05-30
Environment: `https://foundersystems.in`
Production deployment: current `https://foundersystems.in` production alias
Branch: `codex/production-e2e-stabilization-20260527`

## Executive Summary

The scoped apps are substantially production-safe after the stabilization fixes. Automated suites passed, production API edge checks passed, and the latest production deployment is ready and aliased to `foundersystems.in`.

A fresh production edge sweep on 2026-05-30 caught one additional Command Center parsing issue: decimal metrics such as `$48.5k` were truncated to `$48` by the prior live deployment. The parser has been fixed, covered with a regression test, deployed, and retested successfully against production.

Signed-in browser UAT was completed after Chrome was launched with the extension-enabled `Ayush` profile. This pass found and fixed two additional issues: Outreach model output could return too-thin/generic campaign assets, and the LinkedIn web fallback could count negated profile notes as positive role evidence. Both fixes are covered by regression tests, deployed, and retested against production.

## Verification Evidence

Automated suites:

- `npm.cmd run test:founder-copilot`: passed.
- `npm.cmd run test:document-intelligence`: passed.
- `npm.cmd run test:founder-update`: passed.
- `node api\founder-outreach-generate.test.js`: passed.
- `npm.cmd run test:founder-command-center`: passed.
- `npm.cmd run test:linkedin-candidate-screener`: passed.
- `npm.cmd run build`: passed with existing Vite large-chunk warning.

Production deployment:

- `npx.cmd --yes vercel inspect https://foundersystems.in`: production alias ready.
- Aliases include `https://foundersystems.in` and `https://www.foundersystems.in`.

Production API edge checks:

- Tool routes returned HTTP 200. The direct HTML is a SPA shell, so route content markers require rendered browser verification.
- Strategy conversation with short prompt returned a useful follow-up question.
- Strategy final generation without session returned `401 Authentication required.`
- Document Intelligence empty upload returned `400 Upload at least one supported founder document file.`
- Founder Update empty input returned `400 Upload at least one founder update file or paste rough period notes.`
- Command Center notes extracted `Founder note`, `MRR growth`, `Cash collection pressure`, `Onboarding churn risk`, and `Hiring pause`.
- Command Center decimal metric parsing is covered by regression test and production retest for `$48.5k` MRR and `$39.5k` cash collection values.
- LinkedIn missing JD/profile returned `400 Provide a job description and a visible LinkedIn profile before screening.`
- LinkedIn profile/JD mismatch returned structured `weak_fit`, `low` confidence fallback.

Signed-in browser checks:

- Founder Strategy Copilot generated a fresh downloadable founder brief; visible pricing recommended a paid concierge pilot rather than generic freemium.
- Founder Document Intelligence uploaded `founder-metrics.csv`, generated a workspace brief, surfaced MRR/cash contradiction, and enabled copy/download.
- Founder Update Generator generated a notes-only update with sections, caveats, copy, and download.
- Founder Outreach Kit completed intake, approval, generation, email tab, copy sequence, export tab, and saved-memory prompt. After fixes, production generated 4 specific emails and 6 specific subject lines with no generic automation drift.
- Founder Command Center refreshed signed-in workspace memory from notes, preserved `$48.5k` and `$39.5k`, populated changed/risk/metric cards, and kept connected tool links valid.
- LinkedIn Candidate Screener web fallback returned `Weak Fit`, low confidence, structured gaps/checks/notes, and clear fallback wording for a profile whose notes explicitly lacked launch, positioning, pricing, and customer research evidence.

## App Results

### Founder Strategy Copilot

Status: Pass.
Rating: 9/10.

Covered:

- Conversation route no longer depends on the brittle n8n path.
- Short prompt asks a targeted follow-up.
- Final generation is auth-protected.
- Server-side repair layer prevents generic Nova output for the retention memo scenario.
- Signed-in browser retest produced a fresh downloadable founder brief.

### Founder Outreach Kit

Status: Pass with minor copy polish recommended.
Rating: 8.5-9/10.

Covered:

- API test suite passed.
- Production UI pass confirmed intake, approval, generation, email review, copy, export, and memory handoff.
- Current runtime tier is Nova Lite rather than Nova Micro for stronger campaign generation.
- Weak/generic model campaign sections are repaired from a founder-specific scaffold when needed.

Residual risk:

- Repaired fallback copy now avoids awkward leading-verb phrases such as `if Get one...`; remaining copy polish is editorial, not functional.
- Conversational intake can still mis-map answers if the user ignores the current question; the approval step allows correction before generation.

### Founder Document Intelligence

Status: Pass.
Rating: 9/10.

Covered:

- Document suite passed.
- Previous production upload generated workspace analysis.
- Signed-in browser upload retest generated workspace analysis from CSV.
- Empty upload rejects clearly.
- Output covered contradiction between MRR growth and cash collection decline, missing proof, watch-outs, priority questions, key metrics, and extraction notes.

Residual risk:

- Broader DOCX/PPTX browser upload coverage remains useful, but the signed-in CSV upload path passed.

### Founder Update Generator

Status: Pass.
Rating: 9/10.

Covered:

- Update suite passed.
- Empty input rejects clearly.
- Previous production notes-only run produced `Current period`, avoided invented dates, split wins/challenges, and included confidence gaps.
- Signed-in browser notes-only run passed with copy/download controls.

Residual risk:

- File-plus-notes production retake remains useful for broader upload coverage.

### LinkedIn Candidate Screener

Status: Pass for web fallback; model-backed quality still dependent on runtime.
Rating: 8.5/10.

Covered:

- Route now has a production-testable web fallback form.
- Missing JD/profile rejects clearly.
- Model malformed/incomplete response no longer traps the user.
- Mismatched profile/JD returns conservative `weak_fit`, `low` confidence fallback.
- Negated profile evidence no longer creates a false `Strong Fit` verdict.
- Signed-in browser UI retest returned `Weak Fit`, low confidence, and structured recruiter notes.

Residual risk:

- Fallback keyword scoring is intentionally conservative and lower-confidence.
- Chrome extension flow on LinkedIn was not retested in this run; the web fallback path was.

### Founder Command Center

Status: Pass with minor UX cleanup recommended.
Rating: 8.5/10.

Covered:

- Command Center suite passed.
- Signed-in browser refresh passed from notes.
- Empty notes/files path rejects clearly in UI/API coverage.
- Latest refresh is separated from older workspace memory.
- Notes now extract metric/risk cards: MRR growth, cash pressure, onboarding churn risk, hiring pause.
- Decimal metric values are preserved in production.

Residual risk:

- Existing saved memory can create duplicate editable signals over repeated QA runs.
- Finance section currently includes some risk cards even when area is customer/hiring because section logic also includes risk type. This is visible but not blocking.

## Shared Surface Results

Auth:

- Final AI generation endpoints enforce authentication where expected.
- Signed-in checks were completed in the extension-enabled Chrome profile.

Credits and model gating:

- Production uses `amazon.nova-micro-v1:0` for cheap tier and `amazon.nova-lite-v1:0` for quality tier.
- Anthropic Claude Haiku 4.5 remains blocked by AWS Marketplace payment instrument, so it should not be used as production default until billing is fixed.

Workspace memory:

- Latest Command Center refresh no longer silently blends stale memory into the active snapshot.
- Editable memory controls remain available.

Error quality:

- Empty input, missing auth, missing JD/profile, and empty upload produce understandable errors.
- LinkedIn malformed model response now falls back instead of surfacing only an error.

## Open Items

- P2: Outreach generated email bodies need more depth and personalization to reach 9/10.
- P3: Further Outreach copy polish can improve tone, but generated assets are specific and usable.
- P3: Command Center could add richer customer/fundraising drill-downs later, but repeated signals and customer/hiring risk classification are fixed.

## UAT Judgment

No P0/P1 blockers were found after fresh automated, API, production, and signed-in browser verification. The scoped apps are functionally stable enough for controlled production use. The final polish pass fixed Outreach fallback sentence shape, Command Center dedupe/section classification, and the prior Vite chunk-size warning.
