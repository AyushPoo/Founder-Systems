const ctx = $input.first().json || {};
const fsCommits = ctx?.repos?.founder_systems?.commits || [];
const fsFiles = ctx?.repos?.founder_systems?.files || [];
const pdFiles = ctx?.repos?.promptdeck?.files || [];
const external = ctx?.external || {};
const founderNews = external?.founder_news?.items || [];
const startupNews = external?.startup_news?.items || [];
const aiNews = external?.ai_news?.items || [];

const topFs = fsCommits[0] || null;
const topFsFile = fsFiles[0] || null;
const topPd = pdFiles[0] || null;

const now = new Date(ctx?.generated_at_utc || Date.now());
const nowInIst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
const slotHour = Number(new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  hour12: false,
}).format(now));
const weekdayIndex = nowInIst.getDay();
const slot = slotHour < 12 ? 'morning' : 'evening';

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const clip = (value, max = 280) => {
  const text = clean(value);
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}...`;
};
const lower = (value) => clean(value).toLowerCase();
const title = (item) => clean(item?.title || item?.headline || item?.subject || '');
const relativePath = clean(topPd?.relative_path || topFsFile?.relative_path || '');
const commitSubject = clean(topFs?.subject || '');
const changedFiles = Array.isArray(topFs?.files) ? topFs.files.slice(0, 4).join(', ') : '';
const aiPool = [...aiNews, ...startupNews, ...founderNews].filter((item) => title(item));
const aiSignal = aiPool.length ? aiPool[(weekdayIndex + (slot === 'evening' ? 1 : 0)) % aiPool.length] : null;
const aiTitle = title(aiSignal);

const isTrustWork = /auth|sign|login|session|verify|permission|security/i.test(`${commitSubject} ${relativePath}`);
const isDistributionWork = /hero|homepage|landing|headline|pricing|thumbnail|seo|copy|outreach|catalog/i.test(`${commitSubject} ${relativePath}`);
const isSystemWork = /memory|workspace|operator|billing|integration|connection|account|telegram|sync|dashboard/i.test(`${commitSubject} ${relativePath}`);
const isArtifactWork = /deck|slide|promptdeck|document|pdf|report|update|candidate|brief|workspace/i.test(`${commitSubject} ${relativePath}`);

const buildCandidates = () => {
  const items = [];

  if (slot === 'morning' && aiTitle) {
    items.push({
      track: 'ai-reframe',
      postType: 'market reframe',
      hook: clip(`The interesting part of "${aiTitle}" is not the headline. It is what it changes for founders this quarter.`),
      body: clip('Most AI news only matters after you force it into one product, workflow, or distribution assumption. If the story does not change a real operating decision, it is still just content.'),
      backupHook: clip('Every AI headline is secretly a workflow question in disguise.'),
      why: 'Short, opinionated, and tied to a behavior shift instead of generic AI commentary.',
      sources: [aiTitle],
    });
  }

  if (slot === 'morning' && aiTitle && commitSubject) {
    items.push({
      track: 'inside-outside-bridge',
      postType: 'bridge',
      hook: clip('Today\'s AI signal and today\'s founder work were really the same lesson in two outfits.'),
      body: clip(`Outside: "${aiTitle}". Inside: ${lower(commitSubject)}. The founders who win are usually the ones who update assumptions faster than they update their self-story.`),
      backupHook: clip('A good founder loop is outside signal -> internal fix -> sharper assumption.'),
      why: 'Blends market awareness with real build work, which makes the draft feel more grounded and more shareable.',
      sources: [aiTitle, commitSubject],
    });
  }

  if (commitSubject) {
    items.push({
      track: 'build-proof',
      postType: 'build note',
      hook: clip('Most startup trust is won in the unsexy layer.'),
      body: clip(`Today's Founder Systems work was ${lower(commitSubject)}. That kind of change rarely looks exciting from the outside, but it is exactly where product trust and repeat usage start getting earned.`),
      backupHook: clip('Momentum usually looks boring before users feel it.'),
      why: 'Reads like a real builder note instead of generic build-in-public filler.',
      sources: [commitSubject, changedFiles || relativePath].filter(Boolean),
    });
  }

  if (isTrustWork) {
    items.push({
      track: 'trust-handoff',
      postType: 'product lesson',
      hook: clip('Founders usually lose trust in the handoff, not the promise.'),
      body: clip('A polished homepage cannot save a broken sign-in, billing, or permission path. When users finally test the promise, even one shaky handoff can undo the whole story.'),
      backupHook: clip('The page that sells the product is rarely the page that proves it.'),
      why: 'Trust and onboarding posts tend to travel because they feel painfully real to operators and builders.',
      sources: [commitSubject || relativePath, relativePath].filter(Boolean),
    });
  }

  if (isDistributionWork) {
    items.push({
      track: 'packaging',
      postType: 'distribution lesson',
      hook: clip('Most marketing problems are packaging problems wearing better clothes.'),
      body: clip('If the offer, proof, or call to action is muddy, more distribution just scales confusion. A lot of founder growth work is really clarity work pretending to be channel work.'),
      backupHook: clip('Founders often need a sharper promise before they need a bigger audience.'),
      why: 'This is traction-friendly because it compresses a real marketing lesson into a strong, quotable opener.',
      sources: [commitSubject || relativePath, aiTitle].filter(Boolean),
    });
  }

  if (isSystemWork) {
    items.push({
      track: 'operator-system',
      postType: 'systems lesson',
      hook: clip('The more AI tools you add, the more system quality starts to matter.'),
      body: clip('The bottleneck stops being model output and starts becoming memory, permissions, handoffs, and who can act on what. Most teams do not need more AI first. They need less context loss.'),
      backupHook: clip('AI usually breaks at the handoff before it breaks at the prompt.'),
      why: 'Connects the operator ecosystem to a broader systems point people can agree with and share.',
      sources: [commitSubject || relativePath],
    });
  }

  if (isArtifactWork) {
    items.push({
      track: 'artifact-quality',
      postType: 'quality lesson',
      hook: clip('AI products stop feeling magical the second the artifact feels shaky.'),
      body: clip('The real job is not to impress someone for ten seconds. It is to make the deck, doc, report, or update trustworthy enough that they would use it again tomorrow.'),
      backupHook: clip('First-run novelty is easy. Second-run trust is the real product.'),
      why: 'Useful for AI-native audiences because it critiques novelty and points at repeatability.',
      sources: [commitSubject || relativePath],
    });
  }

  if (!items.length) {
    items.push({
      track: 'fallback',
      postType: 'founder observation',
      hook: clip('The highest-leverage founder work is usually one clearer decision and one less broken handoff.'),
      body: clip('Quiet operating work is still leverage. Most companies get stronger because someone removed one recurring friction point before it became everyone else\'s normal.'),
      backupHook: clip('Cleaner follow-through usually beats louder strategy.'),
      why: 'Safe fallback when context is thin, but still sharper than generic inspiration.',
      sources: ['Context payload was thin on this run'],
    });
  }

  return items;
};

const candidates = buildCandidates();

const preferredTracks = slot === 'morning'
  ? ['ai-reframe', 'inside-outside-bridge', 'packaging', 'artifact-quality', 'build-proof', 'fallback']
  : ['build-proof', 'trust-handoff', 'operator-system', 'inside-outside-bridge', 'artifact-quality', 'fallback'];

const ordered = [
  ...preferredTracks.flatMap((track) => candidates.filter((item) => item.track === track)),
  ...candidates.filter((item) => !preferredTracks.includes(item.track)),
];

const seedText = [slot, weekdayIndex, commitSubject, relativePath, aiTitle].join('|');
let hash = 0;
for (let i = 0; i < seedText.length; i += 1) {
  hash = (hash * 33 + seedText.charCodeAt(i)) % 2147483647;
}

const primary = ordered[hash % ordered.length];
const backup = ordered[(hash + 2) % ordered.length] || ordered[(hash + 1) % ordered.length] || primary;
const sourcePoints = Array.from(new Set([...(primary.sources || []), ...(backup.sources || [])])).filter(Boolean).slice(0, 3);

const message = [
  'Founder Systems CMO',
  `${slot === 'morning' ? 'Morning' : 'Evening'} • ${primary.postType} • ${primary.track}`,
  '',
  'Primary',
  primary.hook,
  primary.body,
  '',
  'Backup hook',
  backup.hook || backup.backupHook,
  '',
  'Why this can travel',
  primary.why,
  '',
  'Sources',
  ...sourcePoints.map((item) => `• ${item}`),
].join('\n');

return [{
  json: {
    slot,
    angle: primary.track,
    post_type: primary.postType,
    post: [primary.hook, primary.body].join('\n\n'),
    alt_post: backup.hook || backup.backupHook,
    why_this_post: primary.why,
    source_points_used: sourcePoints,
    telegram_message: message,
  },
}];
