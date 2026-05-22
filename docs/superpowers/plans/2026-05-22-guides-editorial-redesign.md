# Guides Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Guides listing and guide detail pages into a cleaner editorial experience, while replacing the current guide covers with sharper line-style diagram visuals.

**Architecture:** Keep the existing Founder Systems shell and route structure intact, but localize the redesign to the guide surfaces. The listing page becomes a 3-column editorial grid, the detail page becomes a cleaner reading layout, and guide covers shift to a more minimal line-art visual language.

**Tech Stack:** React, React Router, Tailwind utility classes, static SVG guide covers, existing markdown-driven guide detail flow

---

### Task 1: Rebuild the guides listing page into an editorial grid

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\src\pages\Guides.jsx`
- Create: `E:\Work\Founder-Systems-main-merge\src\components\guides\GuideGridCard.jsx`

- [ ] **Step 1: Add a focused card component for guide listing tiles**

Create `E:\Work\Founder-Systems-main-merge\src\components\guides\GuideGridCard.jsx` with a cleaner editorial card layout:

```jsx
import { Link } from 'react-router-dom';

function GuideGridCard({ guide }) {
  return (
    <Link
      to={`/guides/${guide.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border-2 border-brand-black bg-white shadow-[5px_5px_0px_0px_rgba(27,28,26,1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-brand-black bg-[#f6efe5]">
        <img
          src={guide.thumbnail}
          alt={guide.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/54">
          <span className="rounded-full border border-brand-black/15 bg-brand-cream px-3 py-1">{guide.category}</span>
          <span>{guide.readTime}</span>
        </div>
        <h2 className="text-[1.45rem] font-black leading-[1.05] tracking-tight-brand text-brand-black transition-colors duration-200 group-hover:text-brand-orange">
          {guide.title}
        </h2>
        <p className="mt-4 text-[15px] font-medium leading-7 text-brand-black/68">
          {guide.description}
        </p>
      </div>
    </Link>
  );
}

export default GuideGridCard;
```

- [ ] **Step 2: Run a focused import/build check in your head against existing patterns**

Make sure the new component:

- only depends on `react-router-dom`
- does not introduce new libraries
- matches current Tailwind usage and Founder Systems classes

- [ ] **Step 3: Replace the current stacked listing layout with a cleaner hero plus 3-column grid**

Update `E:\Work\Founder-Systems-main-merge\src\pages\Guides.jsx` so the main content uses:

- `max-w-7xl`
- header copy that stays on-brand
- `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
- the new `GuideGridCard`

Use this structure for the main section:

```jsx
<main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-14 md:py-18">
  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
    {guidesData.map((guide) => (
      <GuideGridCard key={guide.id} guide={guide} />
    ))}
  </div>
</main>
```

- [ ] **Step 4: Keep the existing SEO metadata intact while tightening the page copy**

Preserve:

- `title="Founder Guides & Strategy"`
- canonical `/guides`

But tighten the body text to feel more editorial and less generic.

- [ ] **Step 5: Commit**

```bash
git add E:/Work/Founder-Systems-main-merge/src/pages/Guides.jsx E:/Work/Founder-Systems-main-merge/src/components/guides/GuideGridCard.jsx
git commit -m "feat: redesign guides listing grid"
```

### Task 2: Redesign the guide detail page into a cleaner article layout

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\src\pages\GuideDetail.jsx`

- [ ] **Step 1: Keep the fetch/data logic, but simplify the page layout**

Do not rewrite the guide loading flow. Preserve:

- markdown fetch
- related product fetch
- SEO metadata

Only redesign the presentation structure.

- [ ] **Step 2: Replace the current split-card hero with a cleaner editorial hero**

Change the top section to:

- back link
- metadata row with category and read time
- larger title
- cleaner summary/dek
- one wide hero image under the text

Use a structure like:

```jsx
<section className="mx-auto max-w-[980px]">
  <Link ...>Back to Guides</Link>
  <div className="mt-8">
    <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/52">
      <span className="rounded-full border border-brand-black/15 bg-white px-3 py-1">{guide.category}</span>
      <span>{guide.readTime}</span>
    </div>
    <h1 className="mt-5 max-w-[14ch] text-4xl md:text-6xl font-black leading-[0.94] tracking-tight-brand">
      {guide.title}
    </h1>
    <p className="mt-5 max-w-[760px] text-lg md:text-[1.35rem] leading-8 text-brand-black/68 font-medium">
      {guide.description}
    </p>
  </div>
  <div className="mt-10 overflow-hidden rounded-[32px] border-2 border-brand-black bg-white shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
    <img src={guide.thumbnail} alt={guide.title} className="w-full object-cover" />
  </div>
</section>
```

- [ ] **Step 3: Narrow the article body and reduce the boxed-in feel**

Replace the current full-width article container with:

- `max-w-[760px]` or similar
- lighter shadow
- better paragraph and heading spacing
- less aggressive “card inside card” feeling

Use the markdown container like:

```jsx
<article className="prose prose-lg mx-auto mt-16 max-w-[760px] rounded-[28px] border-2 border-brand-black bg-white px-7 py-8 md:px-10 md:py-10 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)] ...">
  <ReactMarkdown>{markdownData}</ReactMarkdown>
</article>
```

- [ ] **Step 4: Make the related product CTA quieter and more editorial**

Keep the related product recommendation, but:

- reduce its visual loudness
- remove oversized decorative framing
- let it read as a next-step suggestion

Keep `ProductCard`, but wrap it in a lighter section:

```jsx
<section className="mx-auto mt-20 max-w-[980px] border-t border-brand-black/12 pt-12">
  ...
</section>
```

- [ ] **Step 5: Commit**

```bash
git add E:/Work/Founder-Systems-main-merge/src/pages/GuideDetail.jsx
git commit -m "feat: redesign guide detail layout"
```

### Task 3: Replace the guide cover visuals with cleaner line-style diagrams

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\public\images\guides\saas-financial-model-guide-cover.svg`
- Modify: `E:\Work\Founder-Systems-main-merge\public\images\guides\pressure-test-startup-idea-cover.svg`
- Modify: `E:\Work\Founder-Systems-main-merge\public\images\guides\founder-offer-outreach-cover.svg`
- Modify: `E:\Work\Founder-Systems-main-merge\public\images\guides\founder-workflow-automation-cover.svg`
- Modify: `E:\Work\Founder-Systems-main-merge\public\images\guides\founder-ai-news-cover.svg`
- Modify: `E:\Work\Founder-Systems-main-merge\public\images\guides\cleaner-investor-deck-cover.svg`

- [ ] **Step 1: Simplify each SVG cover composition**

For each cover:

- reduce the amount of internal text
- keep one small guide label if needed
- use cleaner line diagrams and structured blocks
- keep orange accents sparse
- increase whitespace

The visual language should be:

- diagrammatic
- professional
- simple
- editorial

- [ ] **Step 2: Keep topic-specific visual motifs**

Examples:

- financial model: modular dashboard / sheet blocks
- pressure-test idea: decision tree / signal card flow
- outreach: messaging blocks / CTA / proof chips
- workflow automation: manual / automated / AI-assisted panel split
- AI news: signal -> test -> decision chain
- investor deck: story blocks / slide progression

- [ ] **Step 3: Verify that the SVGs still render correctly as static images**

Check for:

- valid XML
- no broken references
- no clipped major elements

- [ ] **Step 4: Commit**

```bash
git add E:/Work/Founder-Systems-main-merge/public/images/guides/*.svg
git commit -m "feat: refresh guide cover art"
```

### Task 4: Final verification and polish

**Files:**
- Modify if needed: `E:\Work\Founder-Systems-main-merge\public\sitemap.xml`
- Modify if needed: `E:\Work\Founder-Systems-main-merge\src\data\guidesData.js`

- [ ] **Step 1: Rebuild sitemap through the existing script**

Run:

```bash
npm.cmd run generate:sitemap
```

Expected:

- sitemap writes successfully
- all guide URLs remain included

- [ ] **Step 2: Run production build**

Run:

```bash
npm.cmd run build
```

Expected:

- build passes
- only existing chunk-size warning may remain

- [ ] **Step 3: Review working tree for accidental unrelated changes**

Run:

```bash
git status --short
```

Expected:

- only guides-related files changed

- [ ] **Step 4: Commit**

```bash
git add E:/Work/Founder-Systems-main-merge
git commit -m "fix: polish guides editorial experience"
```
