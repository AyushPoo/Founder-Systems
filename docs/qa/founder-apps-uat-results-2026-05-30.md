# Founder Apps UAT Results

Date: 2026-05-30
Environment: `https://foundersystems.in`
Production deployment: `founder-systems-mzns8tgno-ayushpoos-projects.vercel.app`
Branch: `codex/production-e2e-stabilization-20260527`

## Executive Summary

The scoped apps are substantially production-safe after the stabilization fixes. Automated suites passed, production API edge checks passed, and the latest production deployment is ready and aliased to `foundersystems.in`.

A fresh production edge sweep on 2026-05-30 caught one additional Command Center parsing issue: decimal metrics such as `$48.5k` were truncated to `$48` by the prior live deployment. The parser has been fixed, covered with a regression test, deployed, and retested successfully against production.

The main remaining caveat is signed-in browser automation: Chrome was not running during this UAT turn, and the selected Chrome profile did not have the Codex extension installed. Because of that, the signed-in UI walkthrough could not be freshly repeated in this run. Previous signed-in production checks were completed on 2026-05-28, and this run adds fresh automated and API-level verification.

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

- `npx.cmd --yes vercel inspect https://foundersystems.in`: ready on deployment `founder-systems-mzns8tgno-ayushpoos-projects.vercel.app`.
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

## App Results

### Founder Strategy Copilot

Status: Pass with browser-retake recommended.
Rating: 8.5/10.

Covered:

- Conversation route no longer depends on the brittle n8n path.
- Short prompt asks a targeted follow-up.
- Final generation is auth-protected.
- Server-side repair layer prevents generic Nova output for the retention memo scenario.

Residual risk:

- Fresh signed-in browser retest still needed because Chrome automation was unavailable in this run.

### Founder Outreach Kit

Status: Functional, output quality follow-up needed.
Rating: 7.5-8/10.

Covered:

- API test suite passed.
- Previous production UI pass confirmed intake, approval, and generation now complete.
- Current runtime tier is Nova Lite rather than Nova Micro for stronger campaign generation.

Residual risk:

- Email copy in the previous production pass was too short and generic. This is P2 quality risk, not a P0/P1 functional blocker.

Recommended fix:

- Add server-side campaign repair or stricter prompt rules requiring each email to include a pain trigger, one proof point, a relevant personalization line, and a clear CTA.

### Founder Document Intelligence

Status: Pass.
Rating: 9/10.

Covered:

- Document suite passed.
- Previous production upload generated workspace analysis.
- Empty upload rejects clearly.
- Output covered contradiction between MRR growth and cash collection decline, missing proof, watch-outs, priority questions, key metrics, and extraction notes.

Residual risk:

- Fresh signed-in browser upload retake is still recommended once Chrome automation is available.

### Founder Update Generator

Status: Pass.
Rating: 9/10.

Covered:

- Update suite passed.
- Empty input rejects clearly.
- Previous production notes-only run produced `Current period`, avoided invented dates, split wins/challenges, and included confidence gaps.

Residual risk:

- File-plus-notes production retake should be repeated with browser upload available.

### LinkedIn Candidate Screener

Status: Pass for web fallback; model-backed quality still dependent on runtime.
Rating: 8/10.

Covered:

- Route now has a production-testable web fallback form.
- Missing JD/profile rejects clearly.
- Model malformed/incomplete response no longer traps the user.
- Mismatched profile/JD returns conservative `weak_fit`, `low` confidence fallback.

Residual risk:

- Fallback keyword scoring is intentionally conservative and lower-confidence.
- Chrome extension flow on LinkedIn was not retested in this run.

### Founder Command Center

Status: Pass with minor UX cleanup recommended.
Rating: 8.5/10.

Covered:

- Command Center suite passed.
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
- Browser signed-in checks are blocked until Chrome is running with the extension-enabled profile.

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
- P2: Command Center should deduplicate repeated QA memory candidates.
- P2: Command Center section classification should avoid putting all risks into Finance when the area is customer or hiring.
- P2: Repeat signed-in UI UAT when Chrome is running and the Codex extension-enabled profile is selected.
- P3: Build still emits the known Vite chunk-size warning.

## UAT Judgment

No P0/P1 blockers were found in the fresh automated/API pass. The scoped apps are functionally stable enough for controlled production use, with Outreach copy quality and fresh signed-in browser retest as the main remaining follow-ups.
