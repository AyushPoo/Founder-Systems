# Founder Systems Workspace Settings Redesign

Date: 2026-05-22  
Status: Approved for planning  
Owner: Founder Systems

## Goal

Redesign the current Founder Systems `Account` surface into a cleaner, more professional `Workspace Settings` experience that feels closer to modern AI products like Codex and Claude, while staying inside the Founder Systems visual language.

The current page is functionally useful, but it tries to do too many jobs at once:

- account home
- shared memory manager
- per-product preference center
- billing and wallet page
- product and credit history
- operator pass management
- Gmail integration entry point

The redesign should make the page calmer, easier to scan, and easier to navigate without losing capability.

## Product Principle

Founder Systems is becoming a connected ecosystem, not a loose collection of tools. The settings surface should reflect that clearly.

The page should explain the system through four simple mental models:

- `Workspace`: what Founder Systems knows
- `Products`: how individual tools behave
- `Operators`: which operator agents are active and where they run
- `Connections`: which outside apps Founder Systems can access

This structure is the foundation for future integrations like Gmail, Google Sheets, Google Docs, Google Slides, and Google Drive across Marketing, Finance, and Ops.

## New Page Name

Use:

- `Workspace Settings`

Do not position the main surface as a generic `Account` page in the actual UI language. The route can remain `/account` for now, but the user-facing page title and header should feel like a workspace control center.

## Information Architecture

Replace the current tab structure with a left-sidebar settings shell.

### Sidebar sections

- `Overview`
- `Workspace`
- `Products`
- `Operators`
- `Connections`
- `Billing`
- `Activity`
- `Settings`

### Rename existing sections

- `Memory` -> `Workspace`
- `Credits` -> `Billing`
- `History` -> `Activity`

Add:

- `Operators`
- `Connections`

## Intended Responsibilities By Section

### Overview

Purpose:

- calm workspace home
- fast snapshot of the founder's current setup
- entry point to the most common actions

Should show:

- workspace name
- current credit balance
- connected tools count
- active operators count
- recent activity
- quick actions

Suggested quick actions:

- `Add workspace note`
- `Connect Gmail`
- `Buy credits`
- `Open operator access`

### Workspace

Purpose:

- manage shared founder context
- review and edit the facts Founder Systems tools can use
- archive or promote memory items

This replaces the current `Memory` tab.

Use positioning like:

- `Shared workspace`
- `This is the shared context your tools can read from. You stay in control of what gets saved.`

### Products

Purpose:

- control how each Founder Systems product uses shared context
- manage import behavior
- decide whether products can save back to workspace memory
- control start-fresh behavior

This section is about product behavior, not billing or access.

### Operators

Purpose:

- manage operator pass status
- show Telegram or future operator access state
- open setup or reconnect flows

This should be pulled out of the current `Credits` tab.

Each operator card should clearly show:

- pass active or inactive
- Telegram linked or not linked
- open or reconnect action

This is where Marketing Operator, Finance Operator, and Ops Operator should live.

### Connections

Purpose:

- connect external apps Founder Systems can use
- manage connected accounts
- assign which operators and products can use each connection

This is a first-class section, not a small card hidden inside Settings.

This is the key system layer for:

- Gmail
- Google Sheets
- Google Docs
- Google Slides
- Google Drive
- future Notion, Slack, Calendar, and similar connections

### Billing

Purpose:

- show wallet balance
- buy credit packs
- buy custom credits
- show unlocked products

This is the home for financial actions, not operator setup.

### Activity

Purpose:

- show purchases
- show credit ledger
- show usage history
- show product-related events

This replaces `History`.

### Settings

Purpose:

- account-level preferences
- Gmail status if a dedicated connection detail view is not yet built
- future defaults like preferred currency, notification behavior, or workspace defaults

This should stop acting as a miscellaneous dump for unrelated controls.

## Connections Design

The `Connections` page should feel like a lightweight internal app directory.

Do not call these `Plugins` in Founder Systems.

Use:

- `Connections`

Subtitle:

- `Connect the tools Founder Systems can work with on your behalf.`

### Page structure

Two zones:

- `Connected`
- `Available`

Optional lightweight grouping:

- `Communication`
- `Docs and files`
- `Sheets and reporting`
- `Planning and workspace`

### Connection cards

Each connection card should show:

- app icon
- app name
- one-line value statement
- connection status
- connected account email when applicable
- `Used by` list
- primary action

Example statuses:

- `Connected`
- `Not connected`
- `Needs attention`

Example actions:

- `Connect`
- `Manage`
- `Reconnect`
- `Disconnect`

### Example card behavior

#### Gmail

- `Send approved emails from your connected Gmail account.`
- status: `Connected`
- connected account: `ayushpoojary1@gmail.com`
- used by:
  - `Marketing Operator`
- actions:
  - `Manage access`
  - `Reconnect`
  - `Disconnect`

#### Google Sheets

- `Read KPI trackers, finance models, and planning sheets.`
- status: `Not connected`
- used by:
  - `Finance Operator`
  - `Founder Command Center`
- action:
  - `Connect`

#### Google Docs

- `Read strategy notes, update drafts, and shared operating docs.`
- status: `Not connected`
- used by:
  - `Ops Operator`
  - `Founder Update Generator`
- action:
  - `Connect`

## Connection Access Model

Every connection should have scoped access.

The UI question should be:

- `Who can use this connection?`

Supported assignees should include:

- `Marketing Operator`
- `Finance Operator`
- `Ops Operator`
- `Founder Update Generator`
- `Founder Command Center`
- future tools and agents

Default rule:

- no connection should silently be available to every operator and tool
- access should be explicit and visible

This makes the system easier to trust and easier to reason about.

## Layout Direction

The settings redesign should move away from "landing page energy inside account."

The target feel is:

- calmer
- more product-grade
- easier to scan
- less visually loud

### Structural direction

Replace:

- giant hero
- overview cards plus tab pills plus long content blocks

With:

- smaller header
- fixed left nav on desktop
- one main settings panel on the right
- tighter section cards
- more stable visual rhythm

### Visual direction

Keep Founder Systems branding, but reduce noise in settings:

- less thick-shadow heaviness everywhere
- fewer giant orange accents
- more whitespace
- shorter helper text
- tighter labels
- clearer status pills
- more muted supporting text

This page should feel more like software than marketing.

## Copy Direction

The writing should be shorter, calmer, and more operational.

Avoid language like:

- "supercharge"
- "unlock productivity"
- "next-level"

Prefer:

- `Send approved emails from your connected account.`
- `Read planning sheets and KPI exports.`
- `Choose which tools can use this connection.`
- `Keep your shared context and credits organized in one place.`

### Header rewrite

Current direction is too broad.

Use:

- `Workspace settings`

Support line:

- `Manage your shared context, connected tools, operator access, and credits in one place.`

### Section copy rewrites

#### Workspace

- `Shared context your tools can read from and save back into.`

#### Products

- `Choose how each Founder Systems product uses shared workspace context.`

#### Operators

- `Manage active operator passes and where they run.`

#### Connections

- `Connect the apps Founder Systems can work with on your behalf.`

#### Billing

- `Manage credits, top-ups, and unlocked products.`

#### Activity

- `Review purchases, usage, and product actions.`

#### Settings

- `Manage account defaults and integrations.`

## Product Navigation Rewrite

Use this left-nav structure and wording:

- `Overview`
- `Workspace`
- `Products`
- `Operators`
- `Connections`
- `Billing`
- `Activity`
- `Settings`

This is the preferred final navigation for the redesign.

## Implementation Notes

The route can stay `/account` for now.

The main UI can still reuse the existing account data layer from `FounderWorkspaceContext` and related API utilities. This redesign is primarily:

- information architecture
- layout refactor
- copy rewrite
- section split
- new `Connections` UI surface

No large backend model change is required just to support the first version of the redesign.

However, the `Connections` section should be designed in a way that can later support:

- Gmail
- Google Sheets
- Google Docs
- Google Slides
- Google Drive
- operator-specific permissions
- product-specific permissions

## Build Order Recommendation

Implement in this sequence:

1. restructure `/account` into sidebar settings layout
2. rename section labels and reduce the current hero weight
3. split `Operators` out from `Billing`
4. add `Connections`
5. rewrite section copy and helper text
6. polish spacing, card hierarchy, and status pills

This ensures the architecture becomes correct before detail polish.

## Success Criteria

The redesign is successful if:

- the page feels like product software, not a marketing page
- the founder can understand the system quickly
- memory, products, operators, and connections feel clearly separated
- Gmail and future Sheets/Docs/Drive connections have an obvious home
- the page becomes easier to scale as more operators and integrations are added
- the first screen feels calmer and easier to navigate than the current account page

