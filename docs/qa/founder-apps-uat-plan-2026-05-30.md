# Founder Apps UAT Plan

Date: 2026-05-30
Owner: Founder Systems QA / stabilization
Environment: Production custom domain `https://foundersystems.in`, latest `main`
Scope: Founder Systems apps excluding PromptDeck, financial models, AI operators, and Telegram messaging quality.

## Goal

Verify that each scoped app works end to end for a signed-in production user, fails clearly on bad input, preserves recovery paths, and produces founder-useful output. A product is considered production-safe only when the main user flow reaches output, failures are visible and recoverable, and output quality is specific enough to be trusted.

## Apps In Scope

- Founder Strategy Copilot: `/tools/founder-spec-generator`
- Founder Outreach Kit: `/tools/founder-outreach-kit`
- Founder Document Intelligence: `/tools/founder-pdf-summarizer`
- Founder Update Generator: `/tools/founder-update-generator`
- LinkedIn Candidate Screener: `/tools/linkedin-candidate-screener`
- Founder Command Center: `/tools/founder-command-center`

## Shared UAT Matrix

Run these checks across all scoped products where applicable:

- Auth: signed-out route handling, signed-in route handling, recently refreshed session, refresh recovery, deep-link behavior, and expired-session recovery.
- Credits: visible wallet state, locked product behavior, unlock CTA behavior, coming-soon behavior, no broken zero-credit state after account load, and gated AI generation reserves without blocking valid requests.
- Runtime: model-backed route succeeds or produces a structured fallback with confidence and reason.
- Error quality: empty input, invalid file, malformed model response, unavailable model, and retry states show understandable messages.
- Persistence: refresh/back navigation does not trap the user in a broken state.
- Workspace memory: imported memory is opt-in, app works with no memory, latest refresh is not polluted by stale memory, saved candidates remain editable, and stale memory does not corrupt later flows.
- UI resilience: desktop layout, mobile layout, long text, empty states, loading state, retry state, disabled states, copy/download/export controls, back navigation, and browser refresh.

## Required User States

Each app should be tested with these states before final approval:

- Signed out.
- Signed in with valid session.
- Signed in after browser refresh.
- Signed in with populated workspace memory.
- Signed in with zero meaningful workspace memory.
- Direct deep link to the tool route.

Each AI app should also be tested with these input classes:

- Strong input with clear context.
- Weak input with vague context.
- Malformed input or missing required fields.
- Partial input where the user stops halfway or omits evidence.

Each upload app should also be tested with these file classes:

- One clean supported file.
- Multiple supported files.
- Contradictory files.
- Unsupported file.
- Empty or malformed file.
- Oversized file.

## App Charters

### Founder Strategy Copilot

Happy path:
- Start fresh from "Package the plan."
- Enter a known idea with ICP, pain, proof, and manual delivery.
- Generate the final founder strategy brief.

Boundary path:
- Very short prompt should ask a useful follow-up.
- Long messy idea should produce a provisional plan without looping forever.
- Contradictory answers should surface risk instead of hiding it.
- Missing answer midway should produce a recovery prompt rather than advancing with invented context.
- Back navigation should not trap the user in an unrecoverable state.

Failure and recovery:
- Runtime unavailable should show lower-confidence fallback, not a frozen UI.
- Refresh should preserve draft or allow `New plan`.
- Final output should not contain generic freemium/dashboard advice when the founder asked for manual validation.

Pass criteria:
- Final output includes problem, ICP, wedge, MVP scope, exclusions, pricing test, GTM, first-week actions, next-30-day actions, risks, and evidence boundaries.

### Founder Outreach Kit

Happy path:
- Complete conversational intake.
- Review and approve structured draft.
- Generate campaign.
- Inspect strategy, email, LinkedIn, objections, and export tabs.

Boundary path:
- Weak offer should trigger guidance before generation.
- Founder changes direction mid-intake should require re-approval before generation.
- Long audience/proof detail should stay internally consistent.
- No proof/no traction should become cautious copy, not fabricated credibility.
- Too many audience details should be summarized into a coherent ICP.
- Refresh before approval should recover the draft or make the reset clear.

Failure and recovery:
- Generation failure should not lose the approved draft.
- Missing required fields should disable or block generation with clear copy.
- Export should not silently fail.

Pass criteria:
- Campaign includes specific audience, pain, proof, CTA, email sequence with usable bodies, LinkedIn copy, objections, and export rows.

### Founder Document Intelligence

Happy path:
- Upload a valid CSV/XLSX/PDF-style founder document set.
- Generate workspace synthesis.
- Verify contradictions, missing proof, watch-outs, next actions, and per-file analysis.

File coverage:
- PDF.
- DOCX.
- XLSX.
- CSV.
- PPTX if enabled by the current runtime path.
- Financing document such as SAFE, note, or priced-round memo.

Boundary path:
- Multiple files with conflicting facts should surface contradictions.
- Sparse file should include extraction-quality caveats.
- Financing/SAFE path should route to explainer where applicable.
- Ambiguous financing document should explain uncertainty rather than choosing a false lens.
- Weak extraction quality should be visible in output notes.

Failure and recovery:
- Unsupported file type is rejected before submission.
- Oversized file is rejected with size copy.
- Empty upload keeps analyze disabled or returns clear error.
- Malformed file payload should fail clearly without corrupting workspace state.

Pass criteria:
- Output identifies document lens, strongest signals, concerns, key metrics, extraction notes, contradictions, missing proof, and next questions.

### Founder Update Generator

Happy path:
- Generate update from rough notes only.
- Generate update from files plus notes where upload is available.
- Copy/download controls should activate after output.

Boundary path:
- Files only and notes only should both work.
- Conflicting metrics should become caveats.
- Missing reporting period should become `Current period`.
- Sparse evidence should produce asks/gaps instead of fake certainty.
- Long notes should remain concise and sectioned.

Failure and recovery:
- Invalid upload is rejected.
- Runtime fallback should preserve source material and confidence gaps.
- Retry after model/runtime failure should keep the user's notes and selected files.

Pass criteria:
- Output has clear sections: topline, what changed, wins, challenges, metrics/proof, next focus, asks, confidence gaps, extraction notes.

### LinkedIn Candidate Screener

Happy path:
- Use web fallback form with role, visible profile, skills, and optional resume/profile notes.
- Generate verdict, confidence, summary, fit signals, gaps, interview checks, and recruiter notes.

Boundary path:
- Missing JD or missing profile name returns useful message.
- Weak profile returns lower-confidence or weak-fit result.
- Mismatch profile/JD does not overstate fit.
- Long resume text should be summarized into the decision rather than overwhelming the UI.
- Empty profile should not create a confident verdict.

Failure and recovery:
- Incomplete model JSON should degrade to structured fallback, not an error-only state.
- Runtime failure should still produce a conservative fallback with reason.
- Chrome extension/live LinkedIn handoff should not produce undefined helper or runtime errors.

Pass criteria:
- Recruiter receives a scan-ready structured screen and confidence is honest.

### Founder Command Center

Happy path:
- Refresh memory from notes.
- Refresh memory from upload where supported.
- Verify latest refresh preview, memory cards, drill-down sections, and linked actions.

Boundary path:
- No uploads/no notes returns clear error.
- Conflicting or stale memory is not blended into the latest refresh.
- Metrics and risks are classified into the right sections.
- Partial connected data should show confidence limits instead of pretending the workspace is complete.
- Repeated QA refreshes should not create duplicate memory candidates.

Failure and recovery:
- Missing auth for persistence shows preview mode or clear save failure.
- Malformed upload does not corrupt workspace memory.
- Section drill-down links and connected actions should resolve to valid routes.

Pass criteria:
- Latest refresh surfaces what changed, needs attention, top metrics, section cards, memory health, editable signals, and connected next steps.

## Evidence Commands

Run before final UAT judgment:

```powershell
npm.cmd run test:founder-copilot
npm.cmd run test:document-intelligence
npm.cmd run test:founder-update
node api\founder-outreach-generate.test.js
npm.cmd run test:founder-command-center
npm.cmd run test:linkedin-candidate-screener
npm.cmd run build
npx.cmd --yes vercel inspect https://foundersystems.in
```

## Severity Rules

- P0: app unusable, auth broken, incorrect credit deduction/access grant, invalid export, silent data corruption.
- P1: main realistic flow breaks, route/gating wrong, common document path misroutes, model failure traps user.
- P2: confusing recovery, inconsistent UI, weak fallback quality, memory/persistence oddity that does not fully block usage.
- P3: layout, spacing, minor copy, or non-blocking output polish.

## Completion Criteria

- Every scoped app has a production happy-path result.
- Every scoped app has at least one bad-input or recovery check.
- Upload apps have boundary/failure coverage.
- Shared auth, credits, memory, and model-runtime behavior are checked.
- All P0/P1 issues are fixed or explicitly accepted.
- Final report records pass/fail, rating, bugs, and follow-up recommendations.

## Sign-Off Rule

An app can be marked 9/10 only when the happy path reaches output, at least one weak/malformed input path is handled clearly, runtime failure has a recoverable state or structured fallback, and the output is specific enough that a founder could act on it without rewriting the whole artifact.
