# Non-Financial Thumbnail Refresh Design

## Goal

Replace the weak, inconsistent non-financial product thumbnails across Founder Systems with one unified visual system that feels clean, professional, and unmistakably on-brand.

This refresh should remove the current dependence on repeated generic fallback images like:

- `/images/strategy.png`
- `/images/systems.png`
- `/images/finance.png`

for non-financial products.

The result should make the product grid feel like one coherent suite rather than a mix of screenshots, placeholders, and one-off visuals.

## Scope

This spec covers:

- non-financial product thumbnails in the main product catalog
- non-financial product thumbnails used on product detail pages
- replacement of generic shared fallback images for those products

This spec does **not** cover:

- financial model thumbnails and spreadsheet proof imagery
- guide covers
- payment/provider logos
- About page portrait
- hero/landing page illustrations

## Core Direction

All non-financial product thumbnails should move to one shared `diagram-led` cover system.

Each cover should:

- use a warm cream background
- use thin black linework
- use restrained orange accents
- use a simple product diagram instead of a screenshot
- use minimal text
- preserve a premium, calm, editorial feel

The visual goal is:

- more professional
- more consistent
- more intentional
- still clearly Founder Systems

## Recommended Approach

### Approach 1: Unified diagram cover system Recommended

Create custom line-style covers for all non-financial products using the same visual grammar.

Why this is the right approach:

- strongest consistency across the suite
- avoids weak screenshot dependence
- matches the existing Founder Systems visual language better than random photo or UI covers
- scales cleanly as more operator and AI products are added

### Rejected alternatives

#### Screenshot plus diagram hybrid

Useful for proving realism, but too messy for the current site because some non-financial tools do not yet have polished enough UI to carry the thumbnail.

#### Editorial poster covers

Too text-heavy and too easy to make noisy at small sizes.

## Shared Visual System

### Common design language

Every thumbnail should use:

- cream background
- thin black outlines
- simple geometric frames, cards, arrows, nodes, or panels
- one controlled orange accent area
- small uppercase label or product marker
- generous negative space

### What thumbnails should communicate

Each image should signal:

- the product family
- the product’s job
- a distinct visual idea

without trying to explain the entire product.

### What thumbnails should avoid

- full UI screenshots as the main thumbnail
- long titles inside the image
- poster-like text blocks
- heavy gradients
- thick comic-book style borders
- multiple competing focal points
- excessive orange

## Layout Template

All covers should share one base structure:

1. small top-left label
2. one main central diagram
3. one bottom support band with chips, markers, or small blocks
4. one orange accent zone for focus

Text should remain secondary to the diagram.

Target ratio:

- `70-80%` diagram and shape
- `20-30%` text and helper markers

## Variation Rules

To keep the family consistent without feeling duplicated, each cover should use one of three composition types:

### 1. Panel/frame compositions

Best for:

- Founder Command Center
- Founder Update Generator
- PromptDeck AI

### 2. Flow/sequence compositions

Best for:

- Founder Outreach Kit
- Ops Operator
- Founder Strategy Copilot

### 3. Profile/grid/signal compositions

Best for:

- LinkedIn Candidate Screener
- Marketing Operator
- Finance Operator
- Founder Document Intelligence

## Product-by-Product Visual Motifs

### Founder Strategy Copilot

- branching decision map
- nodes and route splits
- brief boxes and directional arrows

### Founder Outreach Kit

- message card stack
- sequence flow
- audience or campaign lanes

### Founder Document Intelligence

- layered documents
- extraction brackets
- annotation marks
- structured output blocks

### Founder Update Generator

- summary card
- signal bands
- narrative/output blocks

### Founder Command Center

- modular dashboard frame
- connected overview tiles
- system hub layout

### LinkedIn Candidate Screener

- profile card
- signal chips
- fit grid or role-match markers

### Marketing Operator

- campaign blocks
- content lane
- message or distribution flow

### Finance Operator

- controlled grid
- metric blocks
- finance planning bands

### Ops Operator

- workflow path
- checklists
- handoff or process nodes

### PromptDeck AI

- slide stack
- structured presentation frame
- storyboard markers

## File Format and Asset Strategy

Preferred:

- SVG for the line-art covers

Fallback:

- PNG only where necessary

Requirements:

- consistent aspect ratio across product cards
- sharp rendering at both card and detail-page sizes
- easy manual editing later if the visual system evolves

## Batch Strategy

### Batch 1

Replace these together:

- Founder Strategy Copilot
- Founder Outreach Kit
- Founder Document Intelligence
- Founder Update Generator
- Founder Command Center
- LinkedIn Candidate Screener
- Marketing Operator
- Finance Operator
- Ops Operator
- PromptDeck AI

Why:

- they are currently the weakest and most inconsistent thumbnail set
- several depend on repeated generic art
- updating them together creates an immediate catalog-wide quality jump

### Leave unchanged for now

- financial model thumbnails
- guide covers
- payment logos
- founder/about imagery

## Rollout Rule

Do not ship a half-state where:

- some non-financial products use the new premium cover system
- others still use the old repeated generic fallbacks

That mixed state will still feel messy and unfinished.

So the rollout should:

1. generate the full non-financial batch
2. replace thumbnail references for that batch
3. remove the old fallback usage for those products
4. verify card cropping and detail-page media behavior

## Success Criteria

The refresh succeeds if:

- product cards feel visually coherent at a glance
- non-financial products no longer look duplicated
- thumbnails feel more premium than screenshot placeholders
- the visual system clearly belongs to Founder Systems
- card-scale readability improves

## Notes for Implementation

- keep existing product structure and references stable where possible
- avoid touching financial model imagery in this pass
- prefer adding new product-specific cover files instead of reusing generic shared image assets
- verify both `/products` and individual `/products/:slug` views after replacement
