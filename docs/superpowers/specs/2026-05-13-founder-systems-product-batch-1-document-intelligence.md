# Founder Systems Product Batch 1: Document Intelligence

## Batch Thesis

This batch creates the lowest-friction set of founder tools in the portfolio.

All five products start from a simple user behavior:

- upload a document
- parse it
- classify it
- run a founder-specific analysis
- return a structured report

That makes this batch the best place to establish the core document-intelligence engine for Founder Systems.

## Why This Batch Comes First

These tools share the same hard parts:

- file upload
- PDF text extraction
- OCR fallback for image-heavy pages
- chunking large documents
- structured report rendering
- export to Markdown or PDF

If Founder Systems gets this foundation right once, the same modules can power later fundraising, planning, and writing products.

## Shared Reusable Primitives

Recommended shared modules for this batch:

- `document upload and validation`
- `PDF text extraction with OCR fallback`
- `document type classifier`
- `chunked summarization pipeline`
- `report card and section renderer`
- `download and share export layer`
- `billing wrapper for one-off or credit-based usage`

## Launch Packaging Recommendation

Build the document-analysis engine as one flagship founder-facing tool first.

Recommended external packaging for the first launch:

- `1.1 Founder PDF Summarizer` remains the public entry point
- `1.2 SAFE / Term Sheet Explainer` ships as a financing-document mode inside `1.1`
- `1.3 Investor Memo / Deck Summarizer` ships as a fundraising-material mode inside `1.1`

Reason:

- the buyer intent is still "I have a document and need clarity quickly"
- the workflow and infrastructure are almost identical
- one strong tool is easier to explain and distribute than three adjacent tools

Standalone product splits can happen later if pricing, search demand, or usage patterns clearly diverge.

## Recommended Internal Build Order

1. `1.1 Founder PDF Summarizer`
2. `1.2 SAFE / Term Sheet Explainer`
3. `1.3 Investor Memo / Deck Summarizer`
4. `1.4 Data Room Readiness Auditor`
5. `1.5 Deck Share Analytics Lite`

The first four tools primarily reuse the same offline document-analysis workflow. The fifth product introduces light sharing and analytics and should come after the reporting engine is stable.

## 1.1 Founder PDF Summarizer

### Product Summary

Founder PDF Summarizer turns uploaded founder documents into structured takeaways. The product is aimed at startup operators who need fast clarity from decks, memos, grant documents, partnership documents, and research files without manually reading every page.

### Reference Products

- `ChatPDF`: copy the instant upload-to-answer workflow and document chat mental model. Avoid generic outputs that ignore startup context. Reference: [ChatPDF](https://www.chatpdf.com/)
- `DocSend`: copy the founder-facing document workflow credibility and clean reporting style. Avoid turning the product into a sharing platform in version one. Reference: [DocSend Pricing](https://www.docsend.com/pricing/)

### Target Buyer

Primary buyer:

- founders
- chiefs of staff
- startup analysts
- advisors reviewing startup materials

Buying moment:

- when they have a long document and need a quick decision
- when they want to prepare for a meeting before reading the full file

Trust driver:

- it is analyzing the founder's own document
- it gives structured outputs instead of vague chat

### Core Workflow

1. User uploads a PDF.
2. Product asks for document mode:
   - pitch deck
   - investor memo
   - grant document
   - market report
   - general founder PDF
3. System extracts text, runs OCR if needed, and detects document density.
4. System produces:
   - summary
   - key takeaways
   - risks or unclear areas
   - recommended next questions
5. User exports the result or opens a follow-up question view.

### Inputs And Outputs

Inputs:

- PDF up to a defined page and size limit
- optional mode selection

Outputs:

- executive summary
- key bullets by section
- risk and ambiguity notes
- next-step questions
- exportable report

### MVP Scope

Include:

- PDF upload
- mode selection
- extraction plus OCR fallback
- sectioned summary report
- export as Markdown or PDF

Exclude:

- live collaboration
- persistent knowledge base
- document chat memory across sessions
- deck-share tracking

### Build Approach

Use a simple document-analysis pipeline:

- frontend upload form in the current Founder Systems UI
- backend document endpoint on the existing AWS API layer
- PDF extraction using a standard parser with OCR fallback only when text extraction is weak
- document chunking based on page count and token budget
- structured prompts for each document mode
- save result payloads with compact JSON summaries, not raw extracted text when avoidable

### Shared Components

New reusable assets created here:

- upload component
- extraction pipeline
- document mode selector
- report renderer
- export action bar

### Pricing Model

Best pricing:

- `INR 149 to 299` per document
- `INR 499` for a five-document pack

### Operating Cost

Primary cost drivers:

- OCR on image-heavy files
- large token payloads
- repeated reprocessing of the same file

Low-cost tactics:

- cache extracted text by file hash
- cache structured summaries
- keep follow-up questions on compact summaries rather than full raw text where possible

### Main Risks

- weak extraction on scanned files
- summaries that are too generic
- users expecting legal or financial certainty

### Build Order Recommendation

Build immediately. This is the foundation product for the rest of the batch.

### Build Notes After Shipping

To be updated after launch.

### Reusable Assets Created

To be updated after launch.

### Changes For Related Products

To be updated after launch.

## 1.2 SAFE / Term Sheet Explainer

### Product Summary

SAFE / Term Sheet Explainer helps founders understand financing documents without pretending to replace legal counsel. It converts dense fundraising terms into plain-English explanations, highlights founder-sensitive clauses, and flags what should be reviewed with a lawyer or advisor.

### Reference Products

- `ChatPDF`: copy the upload-and-ask workflow for dense documents. Avoid generic answers with no financing context. Reference: [ChatPDF](https://www.chatpdf.com/)
- `DocSend`: copy the polished founder-document positioning and trust-building presentation. Avoid making document sharing the core of the product. Reference: [DocSend Pricing](https://www.docsend.com/pricing/)

### Target Buyer

Primary buyer:

- first-time founders
- pre-seed and seed founders
- operator teams helping with fundraising prep

Buying moment:

- when a founder receives a SAFE or term sheet draft
- when they need to understand what changed between two documents

Trust driver:

- the output is explicitly educational, not legal advice
- it highlights concrete clauses founders care about

### Core Workflow

1. User uploads a SAFE, note, or term sheet PDF.
2. User chooses document type if the system is unsure.
3. System extracts the text and identifies core terms:
   - valuation cap
   - discount
   - pro rata
   - liquidation preference
   - board or control terms
4. System produces:
   - plain-English explanation
   - founder watch-outs
   - questions to ask counsel or investors
   - summary of unusual clauses
5. User exports a founder briefing note.

### Inputs And Outputs

Inputs:

- SAFE or term sheet PDF
- optional stage or round context

Outputs:

- clause summary
- plain-English explanations
- founder risk list
- lawyer discussion checklist

### MVP Scope

Include:

- SAFE and simple term sheet support
- clause extraction
- explanation view
- risk checklist

Exclude:

- redlining
- auto-negotiation suggestions beyond high-level guidance
- jurisdiction-specific legal workflows

### Build Approach

Build on top of the Batch 1 document pipeline.

Add:

- a legal-document subtype classifier
- a clause extraction schema
- term-specific prompt templates
- a rule layer for common financing concepts so outputs stay stable even if extraction is messy

### Shared Components

Reuses from `1.1`:

- upload and extraction
- OCR fallback
- report layout
- export controls

New reusable assets:

- clause extraction schema
- financing-term glossary layer

### Pricing Model

Best pricing:

- `INR 299 to 799` per document
- optional bundle with deck and memo analysis later

### Operating Cost

Primary cost drivers:

- long legal documents
- clause-level extraction on poor scans

Low-cost tactics:

- keep prompts structured and clause-first
- store extracted clause summaries separately for re-use

### Main Risks

- legal expectations
- inaccurate parsing of dense clauses
- users over-trusting the tool

### Build Order Recommendation

Build second, once `1.1` extraction quality is stable, but package it first as a financing-doc mode inside `1.1` before promoting it into a standalone product.

### Build Notes After Shipping

To be updated after launch.

### Reusable Assets Created

To be updated after launch.

### Changes For Related Products

To be updated after launch.

## 1.3 Investor Memo / Deck Summarizer

### Product Summary

Investor Memo / Deck Summarizer converts fundraising materials into founder-specific summaries that focus on market signal, business model clarity, investor objections, and the strongest discussion angles. It works for both a founder reviewing another company's materials and for advisors screening large volumes of decks and memos.

### Reference Products

- `ChatPDF`: copy the fast document understanding workflow. Avoid chat-heavy outputs that bury the conclusion. Reference: [ChatPDF](https://www.chatpdf.com/)
- `Papermark`: copy the clean, modern document workflow feel and startup-facing positioning. Avoid turning v1 into a full data room product. Reference: [Papermark Pricing](https://www.papermark.com/pricing)

### Target Buyer

Primary buyer:

- founders benchmarking other decks
- angel scouts
- analysts
- accelerators and advisors

Buying moment:

- when they need fast screening of decks or memos
- when they want a structured digest instead of reading every file

Trust driver:

- outputs are startup-specific
- objections and missing points are explicit

### Core Workflow

1. User uploads an investor memo or pitch deck PDF.
2. User selects:
   - memo mode
   - pitch deck mode
   - benchmark mode
3. System extracts text and section structure.
4. System produces:
   - company summary
   - business model summary
   - traction or proof signals
   - likely investor objections
   - missing information
5. User exports the report or compares multiple files later in a future version.

### Inputs And Outputs

Inputs:

- memo or deck PDF
- optional mode

Outputs:

- startup snapshot
- strengths
- concerns
- questions to investigate
- fundraising-readiness notes

### MVP Scope

Include:

- single-document analysis
- memo and deck modes
- founder or investor-style output variants

Exclude:

- visual slide-level design grading
- portfolio-wide comparisons
- share links and analytics

### Build Approach

Reuse the Batch 1 extraction engine.

Add:

- memo-versus-deck classification
- a structured rubric for startup materials
- output sections tuned for business model clarity, traction, and fundraising signal

### Shared Components

Reuses from `1.1`:

- extraction pipeline
- report renderer
- export actions

Reuses from `1.2`:

- clause or structure extraction pattern

### Pricing Model

Best pricing:

- `INR 199 to 499` per file
- `INR 1,499` multi-file screening pack for advisors

### Operating Cost

Primary cost drivers:

- large decks with OCR-heavy slides
- repeated founder experimentation on the same file

Low-cost tactics:

- cache by file hash
- keep slide or section summaries separate from final report generation

### Main Risks

- weak extraction on image-first decks
- users expecting deep design critique rather than strategic analysis

### Build Order Recommendation

Build third, after the baseline summarizer and financing explainer are stable, but package it first as a fundraising-material mode inside `1.1` before promoting it into a standalone product.

### Build Notes After Shipping

To be updated after launch.

### Reusable Assets Created

To be updated after launch.

### Changes For Related Products

To be updated after launch.

## 1.4 Data Room Readiness Auditor

### Product Summary

Data Room Readiness Auditor reviews a founder's fundraising folder or uploaded document set and returns a clear readiness score, missing-items list, and cleanup recommendations. The product helps founders prepare for diligence without overbuilding a full virtual data room platform.

### Reference Products

- `DocSend`: copy the fundraising and diligence framing. Avoid building the full share-permission surface in version one. Reference: [DocSend Pricing](https://www.docsend.com/pricing/)
- `Papermark`: copy the startup-friendly feel and document-collection mindset. Avoid feature sprawl into collaboration. Reference: [Papermark Pricing](https://www.papermark.com/pricing)

### Target Buyer

Primary buyer:

- founders entering investor conversations
- finance or ops leads at early startups
- fundraising advisors

Buying moment:

- before opening a round
- before sending investor materials widely

Trust driver:

- gives a practical checklist instead of a generic diligence article
- audits the founder's actual materials

### Core Workflow

1. User uploads a ZIP or a set of PDFs and spreadsheets.
2. User chooses company stage:
   - pre-seed
   - seed
   - growth
3. System classifies the files and matches them against a stage-based checklist.
4. System scores:
   - completeness
   - clarity
   - consistency
   - investor-readiness
5. System returns:
   - missing documents
   - weak documents
   - cleanup actions
   - suggested share order

### Inputs And Outputs

Inputs:

- multiple uploaded files
- startup stage
- optional fundraising context

Outputs:

- readiness score
- missing-item checklist
- weak-point notes
- recommended next fixes

### MVP Scope

Include:

- upload of multiple PDFs and common spreadsheet files
- stage-specific checklist
- completeness scoring
- action checklist

Exclude:

- live folder sync
- investor permissions
- deal-room collaboration

### Build Approach

Build on top of the document engine, but keep v1 simple:

- accept a limited set of file formats
- classify each file by probable document type
- map present files to a predefined readiness checklist
- analyze only a small text sample for each file unless the user requests a full pass

### Shared Components

Reuses from `1.1` and `1.3`:

- upload flows
- text extraction
- report rendering

New reusable assets:

- multi-file job orchestration
- stage-based checklist engine
- file-type classifier

### Pricing Model

Best pricing:

- `INR 999 to 2,499` per audit
- optional accelerator or advisor pack later

### Operating Cost

Primary cost drivers:

- many uploaded files
- running full analysis on every file

Low-cost tactics:

- default to checklist plus sampled analysis
- let users choose full deep scan as a premium option later

### Main Risks

- founders expecting full diligence advice
- messy file naming makes classification noisy
- broad scope if too many file types are supported early

### Build Order Recommendation

Build fourth, once single-document analysis and file classification are proven.

### Build Notes After Shipping

To be updated after launch.

### Reusable Assets Created

To be updated after launch.

### Changes For Related Products

To be updated after launch.

## 1.5 Deck Share Analytics Lite

### Product Summary

Deck Share Analytics Lite gives founders a simple link-based way to share a deck and see basic engagement signals such as opens, time spent, and page-level activity. The product is deliberately narrow: it is not a full DocSend competitor, but a lightweight founder-facing analytics layer for pitch materials.

### Reference Products

- `DocSend`: copy simple link sharing, deck analytics, and founder trust cues. Avoid enterprise permissions and heavy admin workflows. Reference: [DocSend Pricing](https://www.docsend.com/pricing/)
- `Papermark`: copy the modern document-share feel and startup simplicity. Avoid feature overload in v1. Reference: [Papermark Pricing](https://www.papermark.com/pricing)

### Target Buyer

Primary buyer:

- founders actively sharing decks
- advisors who send materials on behalf of founders

Buying moment:

- when the founder needs feedback on whether a deck is even being opened and read

Trust driver:

- fast setup
- analytics tied to a real fundraising action

### Core Workflow

1. User uploads a deck PDF.
2. System creates a branded view link.
3. Founder shares the link manually.
4. Viewer events are recorded:
   - open
   - page progression
   - time-on-page estimate
5. Founder sees a lightweight dashboard with:
   - total opens
   - viewer sessions
   - top-viewed slides
   - drop-off points

### Inputs And Outputs

Inputs:

- deck PDF
- optional title and short description

Outputs:

- public or restricted share link
- session summary
- page engagement report

### MVP Scope

Include:

- PDF upload
- share link
- basic open and page analytics
- simple dashboard

Exclude:

- email gating
- granular permissions
- watermarking
- team collaboration
- CRM sync

### Build Approach

Keep the implementation intentionally light:

- convert the PDF into a browser-viewable deck
- render pages in a simple viewer
- log page navigation events to Postgres
- show founder-facing analytics in a minimal dashboard

This is the first product in the batch that needs more persistent state than a one-off report.

### Shared Components

Reuses from earlier tools:

- deck upload and processing
- PDF conversion
- summary/report UI styles

New reusable assets:

- share-link model
- viewer analytics events
- engagement dashboard components

### Pricing Model

Best pricing:

- `INR 499` per active deck for 30 days
- or bundle into a later fundraising pack

### Operating Cost

Primary cost drivers:

- file storage
- page-render bandwidth
- analytics event storage

Low-cost tactics:

- short retention windows
- simple aggregated analytics instead of full session replay

### Main Risks

- users compare it directly to mature platforms
- PDF rendering quality affects trust
- analytics are less useful if traffic volume is tiny

### Build Order Recommendation

Build last in this batch, after the core document workflows are already stable.

### Build Notes After Shipping

To be updated after launch.

### Reusable Assets Created

To be updated after launch.

### Changes For Related Products

To be updated after launch.

## Batch Reuse Map

Products `1.2`, `1.3`, and `1.4` should reuse the same extraction, classification, and report primitives created for `1.1`.

Product `1.5` should reuse:

- upload handling
- PDF processing
- billing wrapper
- founder-facing report components

It adds a new persistence layer for shared links and viewer events, which should remain optional for later products rather than becoming a requirement for the full batch.

## Post-Build Update Log

To be updated as products in this batch ship.
