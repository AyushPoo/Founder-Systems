# Founder Document Intelligence: Multi-File Analyst Design

## Goal

Evolve `Founder Document Intelligence` from a compact single-file summarizer into a broader founder workspace analyst that can ingest multiple founder-related files, classify them, analyze them with document-specific lenses, and synthesize the set into a founder-ready briefing.

This version should feel meaningfully more useful than giving one file to ChatGPT. The differentiation comes from structured multi-file understanding, contradiction detection, missing-proof detection, and founder-specific next-step guidance.

## Product Promise

The user can upload one or more founder-related files and receive:

- a clear read on what each file is
- a specialized analysis for each file type
- a cross-file synthesis of the whole set
- contradictions and gaps across files
- founder-specific watch-outs and next actions

The public product remains one flagship tool rather than splitting into multiple adjacent products.

## Why This Direction

The current product already supports broader file types and several founder lenses, but the experience is still close to a strong single-file summary workflow. That is useful, but it is not yet defensible enough against a generic model workflow.

The next step should optimize for broader support and stronger founder value rather than perfecting one narrow analysis type. A multi-file founder analyst creates a clearer product moat because it:

- understands relationships across files
- spots contradictions a user may miss
- identifies missing support or missing documents
- produces a founder-specific action brief rather than a generic summary

## Scope

### Include In This Version

- multi-file upload inside the existing `Founder Document Intelligence` tool
- support for the current common founder file types
- automatic document classification per file
- specialized per-file analysis templates
- cross-file synthesis for the full upload set
- contradiction detection across files
- missing-proof and missing-document callouts
- stronger financial and financing-document analysis
- unified Markdown export for the full workspace report

### Exclude For Now

- background async job orchestration
- persistent document workspaces across sessions
- live data room sharing
- investor permissions
- saved workspace history
- full spreadsheet-model interpretation at cell level
- a rebuilt OCR-heavy scanned-document pipeline
- slide-design grading and visual critique

## Target Document Types

The router should recognize and handle at least these categories:

- `pitch-deck`
- `investor-memo`
- `safe`
- `term-sheet`
- `convertible-note`
- `financial-statement`
- `annual-report`
- `market-report`
- `grant-document`
- `strategy-doc`
- `ops-doc`
- `contract`
- `general-founder-doc`

If the classifier is uncertain, the file should fall back to `general-founder-doc` and surface the ambiguity in extraction or confidence notes.

## Core User Workflow

1. User uploads one or more files.
2. The workspace shows compact file chips or cards with remove controls.
3. The system validates the set and begins analysis.
4. Each file is classified into a likely founder document type.
5. The system runs the matching analysis lens for each file.
6. The system runs a synthesis pass across the full set.
7. The user receives:
   - a workspace-level founder brief
   - per-file analysis cards
   - a unified exportable report

## User Experience

The interface should stay compact and consistent with existing Founder Systems patterns, especially the tighter workspace feel used in `Founder Spec Generator`.

### Input Experience

- keep the current compact workspace shell
- replace single-file input with multi-file input
- show uploaded files as compact removable items
- allow optional focus guidance for the analysis run
- avoid turning the input area into a full document manager

### Output Experience

The result pane should present two levels of output:

#### Workspace-Level Output

- `Overall read`
- `What matters most`
- `Cross-file contradictions`
- `Missing proof or missing documents`
- `Financial / legal / fundraising watch-outs`
- `Priority questions to answer next`
- `Suggested next actions`

#### Per-File Output

Each file card should show:

- detected type
- concise plain-English summary
- strongest signals
- biggest concerns
- what to inspect next
- extraction confidence or caveats

### Document-Specific Enrichment

Certain file types should add tailored output sections:

- `SAFE / term sheet / note`
  - clause implications
  - control risks
  - founder watch-outs
  - counsel questions

- `annual report / financial statement`
  - key metric movement
  - pressure points
  - management-vs-numbers gaps
  - anomalies to inspect

- `deck / memo`
  - investor objections
  - weak claims
  - missing evidence
  - likely pushback

- `contract / legal doc`
  - obligations
  - risky clauses
  - negotiation flags

- `grant document`
  - eligibility
  - compliance burden
  - execution risk

## Architecture

The product should shift from a `mode-first` design to a `document-set-first` design.

### Layer 1: Upload Set

Responsibility:

- accept and validate multiple files
- normalize file metadata
- preserve order and file identity for the final report

Notes:

- reuse existing validation rules where possible
- extend request shape from a single file payload to a list of files
- keep direct-upload constraints explicit in the UI

### Layer 2: Per-File Router

Responsibility:

- infer likely document type for each file
- choose the correct analysis template
- provide a confidence note when classification is uncertain

Notes:

- preserve the current override architecture even if the first multi-file release keeps routing automatic
- default to broad founder-safe behavior on ambiguous files

### Layer 3: Per-File Analyst

Responsibility:

- run specialized prompts and normalization rules per file type
- produce a standard file-analysis object plus type-specific enrichments

Notes:

- current SAFE logic should remain reusable as an internal specialist path
- annual report and financial statement analysis should be deepened rather than replaced
- deck and memo analysis should become more evaluative, not just descriptive

### Layer 4: Cross-File Synthesizer

Responsibility:

- merge all file-level findings
- detect contradictions, missing proof, repeated risks, and likely next questions
- create the final founder briefing

This is the key differentiator layer and should not be treated as a simple concatenation step.

## Data Shape

The frontend and backend should move toward two normalized result objects.

### Workspace Analysis

Expected sections:

- workspace title
- files analyzed
- overall read
- what matters most
- cross-file contradictions
- missing proof or missing documents
- watch-outs
- priority questions
- suggested next actions
- extraction or confidence notes

### File Analysis

Expected sections:

- file id
- filename
- detected type
- summary
- strongest signals
- concerns
- focus areas
- extraction quality
- optional type-specific fields

This structure keeps rendering predictable while allowing richer analysis for particular file types.

## Differentiation Standard

The product should not look like "ChatGPT with upload."

A successful output should do at least one of the following clearly:

- connect claims across multiple files
- catch contradictions between files
- identify missing support that weakens the story
- turn legal or financial material into founder-facing guidance
- tell the founder what to inspect, fix, or ask next

If the output is only descriptive, the product is not meeting the bar.

## Error Handling

The workflow should stay honest and compact when confidence is weak.

- if a file is unsupported, reject only that file and explain why
- if extraction is weak, continue when possible and surface caveats clearly
- if classification is uncertain, fall back to `general-founder-doc`
- if one file fails during a multi-file run, prefer partial results over total failure when feasible
- if the synthesis layer has insufficient signal, return a smaller but explicit workspace brief instead of hallucinating certainty

## Testing Strategy

The next implementation should expand beyond simple normalization checks.

Add tests for:

- multi-file request validation
- supported-file-set validation
- classification routing
- file-analysis normalization for new document types
- cross-file synthesis merging
- contradiction extraction behavior
- missing-proof and missing-document sections
- Markdown generation for multi-file workspace reports

Where possible, tests should exercise real behavior and stable normalization boundaries rather than only checking presence of fields.

## Rollout Notes

This version is still a branch-ready product step before external account wiring or persistent workspace infrastructure.

The intended launch posture is:

- one compact flagship tool
- broader founder document coverage
- deeper founder-specific outputs
- multi-file synthesis as the main differentiator

## Recommended Implementation Order

1. Extend request and validation utilities from single-file to multi-file input.
2. Add a normalized workspace-analysis result shape.
3. Build document classification and routing for each file.
4. Upgrade per-file prompt templates and response normalization.
5. Add cross-file synthesis logic and Markdown export.
6. Update the workspace UI for multi-file upload and two-level output rendering.
7. Add regression tests and full branch verification.

## Success Criteria

This version succeeds if:

- a user can upload a mixed founder file set in one run
- the product returns a believable type-aware analysis for each file
- the workspace output surfaces contradictions and gaps across files
- the final report tells the founder what matters and what to do next
- the UI remains compact and does not regress the existing shipped experience
