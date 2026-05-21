# Founder Update Generator Design

## Goal

Create a new Founder Systems product that turns messy founder materials for a reporting period into one polished founder update.

The product should accept mixed inputs, synthesize what changed, prioritize the strongest signals, surface gaps or contradictions, and return a clean update that feels editorially sharp rather than mechanically summarized.

## Product Promise

The user can upload whatever they have for a period and receive one polished founder update that explains:

- what changed
- what matters
- wins
- challenges
- metrics or proof points
- what needs attention next
- asks or support needed when relevant

The product is not just a summarizer. It should behave like a founder reporting editor that turns scattered materials into a coherent operating update.

## Why This Product Exists

The existing `Founder Strategy Copilot` already covers idea validation, strategy audit, and business-plan-style packaging. The Batch 2 planning spec overlaps too heavily with that surface.

This product is stronger because it has a clearer job:

- founders already have material
- the material is messy, partial, and spread across formats
- they need one credible update, fast

That is a narrower and more legible buyer moment than generic planning help.

## Positioning

The first version should be framed as `Founder Update Generator`.

It should not launch as:

- a reporting platform
- a board portal
- a stakeholder communication suite
- a recurring workspace product

Those belong in future expansions, but the first version should stay tightly focused on one job: create one polished founder update from mixed inputs.

## Core Workflow

1. User uploads whatever they have for the period.
2. System classifies the inputs.
3. System extracts evidence, progress signals, concerns, metrics, and asks.
4. System synthesizes the inputs into one structured founder update.
5. User copies or downloads the result.

## Supported Inputs

The first version should accept a mixed founder input set such as:

- rough notes
- investor update drafts
- board notes
- KPI CSV files
- spreadsheets
- decks
- memos
- meeting notes
- financial snapshots
- narrative documents

The user should not need to pre-structure the materials perfectly.

## Output Standard

The product should produce one polished update rather than multiple stakeholder variants in the same run.

That update should feel:

- concise
- signal-first
- founder-practical
- export-ready
- stronger than a generic AI summary

## Output Structure

The first version should generate these sections:

- `Topline`
  - a short paragraph on the period and what matters most

- `What changed`
  - the meaningful developments, not a raw recap

- `Wins`
  - concrete positive movement or proof signals

- `Challenges`
  - risks, misses, delays, pressure points, or unresolved issues

- `Metrics and proof`
  - the strongest quantitative or factual support pulled from the inputs

- `What needs attention next`
  - the highest-priority operating focus now

- `Asks or support needed`
  - optional, when the input set suggests specific support requests

- `Confidence or gaps`
  - caveats where evidence is thin, conflicting, or incomplete

## What Makes It Better Than Generic AI

The product must do more than summarize uploaded files.

It should add value by:

- grouping scattered materials into a coherent reporting structure
- prioritizing what matters instead of restating everything
- identifying contradictions across inputs
- surfacing missing proof or weak evidence
- turning rough notes into clean founder-ready language

If the output reads like stitched notes or a document recap, the product is not meeting the bar.

## Scope

### Include In V1

- mixed-file upload
- optional rough-text paste support
- input classification
- evidence extraction
- contradiction or gap detection
- one polished founder update
- Markdown export
- compact confidence or caveat notes

### Exclude From V1

- recurring reporting history
- persistent update workspaces
- email sending
- CRM sync
- board portal workflows
- collaborative editing
- stakeholder-specific variants in one run
- advanced charting or dashboards

## Future-Ready Architecture

Even though V1 returns only one update, the internal structure should support future expansion into:

- founder version
- board version
- investor version

That means the core system should separate:

- input classification
- evidence extraction
- update synthesis
- final rendering

This keeps the first version simple while leaving room for future output variants without a rewrite.

## User Experience

The interface should stay compact and consistent with the stronger recent Founder Systems tools.

### Input Experience

- one upload area for mixed files
- optional freeform text box for extra context
- compact file chips or cards
- minimal configuration

The user should feel like they are handing over a messy packet, not filling out a long reporting wizard.

### Output Experience

- one primary polished update view
- clear sectioned report layout
- visible caveat or gap callouts when needed
- copy and Markdown download actions

## Architecture

### Layer 1: Input Intake

Responsibility:

- accept mixed founder files
- normalize file metadata
- accept optional freeform context

### Layer 2: Input Classifier

Responsibility:

- identify whether an input is primarily:
  - metrics
  - narrative notes
  - financial context
  - planning context
  - draft communication

This does not need to be over-precise in V1, but it should organize the evidence correctly.

### Layer 3: Evidence Extractor

Responsibility:

- extract likely wins
- extract likely problems
- identify notable metrics
- identify asks or support signals
- identify contradictions or missing proof

### Layer 4: Update Synthesizer

Responsibility:

- turn the extracted evidence into one coherent reporting narrative
- prioritize signal over completeness
- preserve honesty where evidence is incomplete

### Layer 5: Output Renderer

Responsibility:

- format the update into clean sections
- support copy and Markdown export

## Data Shape

The backend and frontend should normalize around a result object with sections such as:

- title
- reporting period label if inferred or supplied
- topline
- whatChanged
- wins
- challenges
- metricsAndProof
- nextFocus
- asks
- confidenceGaps
- extractionNotes
- sourceFiles

This shape should stay stable even if some sections are empty.

## Risks

Main risks:

- the output becomes generic if the synthesis is weak
- users expect fully automated board-ready reporting from low-quality inputs
- metrics are thin or inconsistently formatted
- conflicting materials create false confidence if not surfaced explicitly

The product should prefer honesty over fluency when evidence is weak.

## Testing Strategy

The implementation should test:

- mixed-file request validation
- optional text-context handling
- evidence normalization
- contradiction and gap extraction behavior
- update-section normalization
- Markdown export structure

UI checks should confirm:

- compact multi-file input behavior
- clean founder update rendering
- no regression to oversized or cluttered workspace behavior

## Rollout Notes

This product should be built on the fresh branch created from the latest `origin/main` so it inherits the newest Founder Systems app state.

The first release should aim to prove:

- founders will hand over messy inputs
- the output feels materially better than generic AI
- the update structure is reusable for future board and investor variants

## Success Criteria

This version succeeds if:

- a founder can upload a mixed input set without pre-cleaning it
- the tool returns one sharp, believable founder update
- the update highlights real wins, concerns, metrics, and next focus
- contradictions and weak evidence are surfaced rather than hidden
- the output is export-ready and feels premium enough to send or adapt
