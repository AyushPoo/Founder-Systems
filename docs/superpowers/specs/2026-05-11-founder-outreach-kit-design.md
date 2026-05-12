# Founder Outreach Kit Design

## Goal

Ship a standalone Founder Systems tool that takes a rough founder offer and turns it into a ready-to-send outbound campaign with strategist-style diagnosis, founder-native copy, and exportable campaign assets.

## Product Shape

`Founder Outreach Kit` will live as a standalone tool route at `/tools/founder-outreach-kit`.

It will also be discoverable through the existing products catalog:

- add a new `Marketing Tools` filter
- add a new product card in `public/products/index.json`
- add a matching product detail JSON file in `public/products/founder-outreach-kit.json`
- use `launchUrl` so the product detail page can launch the tool directly

The page should feel like a working founder desk, not a marketing landing page. The first viewport should immediately show the intake workspace and the promised outcome.

## MVP Scope

### Included

- Hybrid intake flow with structured steps plus coaching
- Support for text and image attachments
- Optional website URL field
- AI diagnosis before campaign generation
- `Fix Before Sending` section for weak inputs
- Full outbound output:
  - ICP snapshot
  - 3 positioning angles
  - 5-email sequence
  - 10 subject lines
  - LinkedIn message sequence
  - objection replies
  - copy-friendly export
  - CSV export rows
- Local saved campaigns via browser storage
- Regenerate/edit loop

### Explicitly excluded from MVP

- Payments
- Auth
- Team workspaces
- Persistent backend storage
- Website scraping
- CRM integrations
- Live Google Sheets export

## User Flow

### Intake

Use a five-step guided workflow:

1. `Offer`
2. `Customer`
3. `Pain + proof`
4. `CTA + tone`
5. `Generate`

Each step combines:

- structured inputs
- small suggestion chips or examples
- “what makes this stronger” guidance
- soft warnings for vague positioning
- attachment upload

The interaction should never feel like a hard gate. If inputs are weak, the user should still be able to continue, but the tool should clearly explain what needs tightening.

### Output

Render results in tabs:

- `Strategy`
- `Emails`
- `LinkedIn`
- `Objections`
- `Export`

The output should be optimized for scanning and copy-paste use. Each sequence item should support one-click copy.

### Saved campaigns

For MVP, save campaigns locally in `localStorage`. Users should be able to:

- reopen a saved campaign
- edit inputs
- regenerate output
- export again
- delete local campaigns

## AI Behavior

The generator should behave like a founder-led outbound strategist, not a generic SDR prompt.

Prompt behavior:

- be specific
- be concise
- prefer plain language
- challenge weak positioning
- improve vague inputs before writing copy
- write like a real founder or operator when appropriate
- avoid generic SaaS filler and fake friendliness

### Diagnosis first, generation second

Within one API request, the model should:

1. assess input quality
2. identify gaps
3. produce `fixBeforeSending`
4. generate the final campaign package

Important weakness categories:

- weak ICP
- vague pain
- missing proof
- broad market
- unclear offer
- weak CTA

Weak inputs should not block output. The tool should generate anyway, while surfacing the fixes clearly.

## Technical Architecture

This repository is a Vite React app, not a Next.js app. The “dedicated API route” for MVP should therefore be implemented as a Vercel serverless endpoint under `/api`, with the frontend posting to that endpoint.

### Frontend

New page:

- `src/pages/FounderOutreachKit.jsx`

Suggested component boundaries:

- `src/components/founder-outreach/OutreachWorkspace.jsx`
- `src/components/founder-outreach/OutreachProgress.jsx`
- `src/components/founder-outreach/OutreachIntakeForm.jsx`
- `src/components/founder-outreach/OutreachCoachPanel.jsx`
- `src/components/founder-outreach/OutreachOutputTabs.jsx`
- `src/components/founder-outreach/StrategyTab.jsx`
- `src/components/founder-outreach/EmailsTab.jsx`
- `src/components/founder-outreach/LinkedInTab.jsx`
- `src/components/founder-outreach/ObjectionsTab.jsx`
- `src/components/founder-outreach/ExportTab.jsx`
- `src/components/founder-outreach/SavedCampaignsDrawer.jsx`
- `src/components/founder-outreach/AttachmentPicker.jsx`

### Utilities

- `src/utils/outreachCampaign.js`
- `src/utils/outreachCampaignStorage.js`
- `src/utils/outreachCampaignExport.js`

### API

- `api/founder-outreach-generate.js`

The API should:

- validate and normalize incoming intake data
- assemble model context from inputs and attachment summaries
- call the configured LLM provider
- parse structured JSON
- normalize malformed or partial output into the expected response shape

## Data Contracts

### Frontend intake shape

Use the provided `OutreachCampaignInput` as the base, with UI support fields for:

- attachments
- draft id
- updatedAt

### API output shape

Use the provided `OutreachCampaignOutput` as the base, plus:

- `ok: boolean`
- `error?: string`
- `diagnosticNotes?: string[]`
- `normalizedInput?: OutreachCampaignInput`
- `generatedAt?: string`

## Attachments

Support up to a small number of files in MVP.

- Text files: parse locally and send excerpted content
- Images: keep metadata and file object handling in the UI so the product is ready for multimodal expansion
- Unsupported file types: keep the file visible, but explain that full parsing is not yet available

The existing attachment pattern in `src/pages/FounderSpecGenerator.jsx` should be reused where helpful, but the Outreach Kit should have its own focused data model rather than inheriting the current copilot session shape.

## Export

The tool should provide:

- copy-friendly campaign view
- CSV download
- rows formatted for spreadsheet import with:
  - `step`
  - `channel`
  - `subject`
  - `body`
  - `delay_days`
  - `goal`

## Validation and Error Handling

Required for generation:

- `productName`
- `offer`
- `targetCustomer`
- `buyerRole`
- `painPoint`
- `desiredOutcome`
- `cta`
- `tone`
- at least one `channel`

Behavior principles:

- preserve user input on failure
- never discard saved local data during retries
- if the API returns partial data, render what is available and identify missing sections
- show calm corrective guidance instead of hard-stop error walls

## Testing

MVP verification should cover:

- normalization utilities
- export row generation
- local storage save/load/delete behavior
- API response normalization
- one full manual journey through intake -> generate -> export -> save -> reload

## Assumptions

- The current workspace is not attached to a `.git` repository, so the implementation plan should not rely on commit checkpoints inside this directory.
- No backend database is required for MVP.
- Payment can be layered in later once output quality is validated.
