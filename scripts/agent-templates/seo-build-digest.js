const audit = $input.first().json || {};
const pages = audit?.pages || [];
const totalIssues = audit?.total_issues || 0;
const broken = pages.filter((page) => (page.issues || []).length > 0);
const worst = [...broken].sort((a, b) => (b.issues?.length || 0) - (a.issues?.length || 0))[0] || null;
const topPages = broken.slice(0, 3);
const sourceHtmlIssues = [
  'missing <title>',
  'missing meta description',
  'missing H1',
];

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const looksLikeSpaShell = (page) => (page?.issues || []).some((issue) => sourceHtmlIssues.includes(issue));

let summary = '';
let nextMove = '';

if (!totalIssues) {
  summary = 'Clean run. No obvious SEO hygiene issues showed up in the scheduled audit.';
  nextMove = 'No urgent fix needed. Keep shipping and let the next crawl confirm the same result.';
} else if (looksLikeSpaShell(worst)) {
  summary = `Main issue: crawlers are still seeing the SPA shell on ${worst.path}, not the route-specific HTML.`;
  nextMove = 'Ship route-level source HTML with a real title, description, and H1 before worrying about lower-signal tweaks.';
} else {
  summary = `${totalIssues} SEO issues showed up across ${broken.length} pages.`;
  nextMove = 'Fix the highest-signal route first instead of spreading effort across every page.';
}

const bullets = topPages.length
  ? topPages.map((page) => `• ${page.path}: ${clean((page.issues || []).join('; '))}`)
  : ['• No urgent pages right now'];

const message = [
  'Founder Systems SEO',
  `${audit?.checked_pages || pages.length} pages checked • ${totalIssues} issues`,
  '',
  'What stands out',
  summary,
  '',
  'Priority pages',
  ...bullets,
  '',
  'Next move',
  nextMove,
].join('\n');

return [{
  json: {
    total_issues: totalIssues,
    worst_page: worst?.path || null,
    summary,
    recommendation: nextMove,
    top_pages: topPages,
    telegram_message: message,
  },
}];
