const BENCHMARKS = [
  {
    id: 'slurrp-farm',
    companyName: 'Slurrp Farm',
    category: 'millet snacks',
    keywords: ['millet', 'ragi', 'jowar', 'kids', 'healthy snacks', 'snacks', 'food'],
    pattern:
      'Built a millet-first packaged food brand by making traditional grains feel modern, convenient, and family-friendly.',
    whyItMatters:
      'Shows that millet can work when the wedge is sharp and the positioning is not just “healthy,” but tied to a specific buyer and use case.',
    tractionSignal: 'Expanded from cereals into cookies, pancakes, noodles, and snacks.',
    sourceLabel: 'Slurrp Farm about',
    sourceUrl: 'https://slurrpfarm.com/pages/about-us',
  },
  {
    id: 'whole-truth',
    companyName: 'The Whole Truth',
    category: 'clean-label snacks',
    keywords: ['protein', 'bars', 'clean label', 'healthy snacks', 'snacks', 'fitness', 'food'],
    pattern:
      'Won by making ingredient transparency the product story, not just the nutrition panel.',
    whyItMatters:
      'Useful if the founder wants to compete on trust, ingredients, and brand honesty rather than only flavor or price.',
    tractionSignal: 'Scaled a clean-label portfolio across protein bars, energy bars, muesli, and powders.',
    sourceLabel: 'The Whole Truth store',
    sourceUrl: 'https://thewholetruthfoods.com/learn/truth-be-told/sign-up',
  },
  {
    id: 'happilo',
    companyName: 'Happilo',
    category: 'healthy snacking',
    keywords: ['nuts', 'dried fruits', 'snacks', 'healthy snacks', 'office snacks', 'gifting', 'food'],
    pattern:
      'Built a broad healthy-snacking brand with strong distribution, e-commerce presence, and varied pack formats.',
    whyItMatters:
      'Good reference for office-snack, gifting, and convenience-led distribution strategy.',
    tractionSignal: '200+ channel partners and nationwide distribution network.',
    sourceLabel: 'Happilo about',
    sourceUrl: 'https://happilo.com/pages/about-us',
  },
  {
    id: 'true-elements',
    companyName: 'True Elements',
    category: 'healthy breakfast and snacks',
    keywords: ['breakfast', 'granola', 'oats', 'muesli', 'healthy snacks', 'office', 'food'],
    pattern:
      'Built around honest labels, repeat breakfast occasions, and “healthy but convenient” routines.',
    whyItMatters:
      'Helpful for founders thinking about repeat office consumption rather than one-off impulse snacking.',
    tractionSignal: 'Offers breakfast, snacks, and convenience-led formats across oats, muesli, seeds, and mixes.',
    sourceLabel: 'True Elements about',
    sourceUrl: 'https://true-elements.com/pages/about-us',
  },
];

function normalize(text) {
  return String(text || '').toLowerCase();
}

function getSearchText(session) {
  const messages = Array.isArray(session?.messages) ? session.messages : [];
  return messages
    .filter((message) => message?.role === 'user' || message?.role === 'assistant')
    .map((message) => message.content)
    .join(' \n ');
}

export function getFounderBenchmarkMatches(session, limit = 3) {
  const haystack = normalize(getSearchText(session));
  if (!haystack) return [];

  return BENCHMARKS.map((entry) => {
    const score = entry.keywords.reduce(
      (total, keyword) => (haystack.includes(normalize(keyword)) ? total + 1 : total),
      0
    );
    return { ...entry, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export default BENCHMARKS;
