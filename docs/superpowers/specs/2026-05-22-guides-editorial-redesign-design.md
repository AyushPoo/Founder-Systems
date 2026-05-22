# Guides Editorial Redesign

## Goal

Upgrade the Guides experience so it feels cleaner, more professional, and more editorial without changing the overall Founder Systems shell.

This redesign should:

- keep the existing global Founder Systems navbar, footer, and overall brand system
- make the guides listing feel closer to a clean editorial grid instead of stacked product cards
- make the guide detail pages feel closer to a premium article reading experience
- replace the current awkward guide thumbnails with cleaner line-art / product-diagram covers

This is a local refinement of the Guides surface, not a full-site rebrand.

## References and interpretation

The user referenced:

- Blume-style cleaner listing layouts
- Stellaris-style article detail pages

The intent is not to copy those sites literally. The intent is to borrow the cleaner editorial structure:

- more whitespace
- calmer card hierarchy
- cleaner reading columns
- less visual heaviness
- stronger use of imagery and diagrams

while still preserving the Founder Systems visual identity.

## Scope

### In scope

- Guides listing page
- Guide detail page
- Guide cover artwork / thumbnails
- Supporting metadata presentation on guide cards and guide pages

### Out of scope

- Full-site redesign
- Navbar redesign
- Footer redesign
- Product pages outside the guides-related CTA module
- Core product layout changes outside the guide-related surfaces

## Design principles

### 1. Founder Systems shell stays

Keep:

- current site navigation
- current typography family stack unless already changed elsewhere
- current color system based on cream, black, white, and orange

Do not turn the guides into a disconnected microsite.

### 2. Cleaner editorial rhythm

Guides should feel:

- quieter
- more deliberate
- easier to scan
- less like oversized product cards

The current guides layout is too bulky and overframed. The redesign should reduce visual noise and let layout, type, and imagery carry more of the page.

### 3. Diagram-led covers

Guide thumbnails should use the site’s line-art / diagram style rather than photo-based editorial imagery.

They should feel:

- product-thinking oriented
- simple
- professional
- restrained

They should avoid:

- poster-like text overload
- loud gradients
- fake realism
- cluttered illustration scenes

## Guides listing page

### Current issue

The listing page currently uses large stacked cards with too much framing, too much vertical mass, and guide art that reads more like awkward posters than polished editorial covers.

### New structure

Use a grid-based editorial layout:

- desktop: 3 cards per row
- tablet: 2 cards per row
- mobile: 1 card per row

### Card structure

Each card should include:

- cover image at the top
- metadata row
  - category
  - read time
- title
- short summary
- optional supporting subtitle only if it adds value

### Card styling

Cards should:

- be more uniform in size
- have lighter shadow treatment than the current chunky treatment
- keep a crisp outline, but not dominate the page
- feel more like editorial tiles than feature boxes

Recommended visual characteristics:

- rounded corners stay, but more restrained
- black border stays, but interior spacing improves
- shadow is lighter and tighter
- more breathing room between cards
- better title line lengths

### Listing page header

Keep the hero/header area, but simplify its visual weight relative to the content below.

The page should lead into the card grid more quickly and feel more like a reading library than a product landing page.

## Guide cover system

### Direction

All guide covers should follow one consistent visual language:

- warm light background
- black line-work
- simple product/workflow diagram forms
- sparse orange accent usage
- minimal in-cover text

### Cover composition rules

Each cover should:

- have one strong visual focal point
- connect visually to the topic
- use whitespace intentionally
- feel more like a designed diagram than a social graphic

Examples of appropriate visual motifs:

- cards, tiles, and stacked workflow panels
- arrows, split flows, or signal paths
- dashboards, sheets, and structured blocks
- simplified document, deck, or system modules

### Cover text

Do not rely on large title text inside the image.

If text appears inside the image at all, it should be very limited:

- small guide label
- small metadata
- tiny keyword chips only when useful

The real page title should do the heavy lifting outside the thumbnail.

## Guide detail page

### Current issue

The current guide detail page still feels too card-heavy and boxed-in. It reads more like a product showcase than a premium article.

### New layout

The guide page should become a cleaner article experience with:

- a calmer article hero
- a wide hero image near the top
- a narrower reading column for the body
- more controlled spacing
- a quieter related product CTA lower on the page

### Detail page structure

1. Back link
2. Article metadata row
   - category
   - read time
3. Large title
4. Short deck / summary
5. Wide hero diagram image
6. Main article body in a narrower reading column
7. Related tool CTA near the end

### Article hero

The hero should feel simpler than the current split-card treatment.

It should:

- emphasize title and summary first
- use the visual as support, not as a boxed side panel
- create more top-of-article breathing room

### Body width

The markdown content should sit in a more editorial reading width instead of a broad, overframed slab.

Target:

- narrower max width
- strong heading hierarchy
- calmer line length
- more generous vertical rhythm

### Typography behavior

The article body should feel more premium by:

- slightly reducing visual clutter in prose styles
- improving spacing between headings and paragraphs
- reducing unnecessary heavy framing around the content container
- keeping headings strong but not overbearing

### Related product CTA

Keep the related product recommendation, but make it feel quieter and more context-aware.

It should behave like:

- “If this guide was useful, use this tool next”

not like:

- a loud sales interruption

## SEO considerations

The previous sitemap and route indexing issues have already been improved. The redesign must preserve that progress.

### Keep

- guide pages indexable
- guide listing indexable
- product detail pages indexable
- internal tool routes noindex

### Ensure for guides

Each guide should still have:

- unique title
- unique description
- canonical
- image path that can support sharing and previews

## Implementation notes

### Files likely affected

- `src/pages/Guides.jsx`
- `src/pages/GuideDetail.jsx`
- `src/data/guidesData.js`
- guide cover image files under `public/images/guides`
- optional guide-related visual helpers or small shared components if warranted

### Keep implementation focused

Do not spread this redesign into unrelated pages.

If a shared component is updated, it should only be because it directly improves guide rendering without creating regressions elsewhere.

## Success criteria

The redesign is successful if:

- the guides listing reads as a clean editorial grid
- desktop shows 3 guides per row cleanly
- thumbnails feel intentionally designed and no longer awkward
- the guide detail pages feel significantly more premium and readable
- the Founder Systems shell still feels intact
- the new design looks more professional without looking generic or disconnected from the brand
