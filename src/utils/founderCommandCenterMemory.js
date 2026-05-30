function toList(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return String(value || '').trim();
}

function readText(item = {}) {
  return cleanText(
    item?.summary_text
      || item?.value_json?.text
      || item?.value_json?.value
      || item?.label,
  );
}

function readArea(item = {}) {
  return cleanText(item?.value_json?.area || item?.value_json?.category).toLowerCase();
}

function ageInDays(isoValue, nowValue) {
  const created = new Date(isoValue || 0).getTime();
  const now = new Date(nowValue || Date.now()).getTime();
  if (!created || Number.isNaN(created) || Number.isNaN(now)) {
    return 0;
  }
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

function toCard(item = {}, now = Date.now()) {
  return {
    id: item?.id || `${item?.type || 'signal'}-${item?.label || 'item'}`,
    type: cleanText(item?.type).toLowerCase(),
    label: cleanText(item?.label) || 'Untitled signal',
    text: readText(item),
    area: readArea(item) || 'general',
    source: cleanText(item?.source_product),
    confidence: cleanText(item?.confidence) || 'inferred',
    ageDays: ageInDays(item?.created_at, now),
  };
}

function cardSignature(card = {}) {
  const text = cleanText(card.text).toLowerCase();
  const area = cleanText(card.area).toLowerCase();
  if (text) {
    return `${area}|${text}`;
  }

  return [
    cleanText(card.type).toLowerCase(),
    cleanText(card.label).toLowerCase(),
    area,
  ].join('|');
}

function dedupeCards(cards = []) {
  const seen = new Set();
  return cards.filter((card) => {
    const signature = cardSignature(card);
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}

function sortRecent(items = [], now = Date.now()) {
  return [...items].sort((left, right) => {
    return toCard(left, now).ageDays - toCard(right, now).ageDays;
  });
}

export function summarizeMemoryFreshness(memoryItems = [], now = Date.now()) {
  const list = toList(memoryItems);
  const ages = list.map((item) => ageInDays(item?.created_at, now));
  return {
    totalSignals: list.length,
    newestDays: ages.length ? Math.min(...ages) : null,
    oldestDays: ages.length ? Math.max(...ages) : null,
    hasStaleSignals: ages.some((value) => value >= 7),
  };
}

export function buildFounderCommandCenterSnapshot({ memoryItems = [], now = Date.now() } = {}) {
  const list = toList(memoryItems);
  const recent = dedupeCards(sortRecent(list, now).map((item) => toCard(item, now)));
  const metrics = recent.filter((item) => item.type === 'metric');
  const risks = recent.filter((item) => item.type === 'risk');

  return {
    companySummary: recent.slice(0, 3).map((item) => item.text).filter(Boolean).join(' '),
    topMetrics: metrics.slice(0, 3),
    whatChanged: recent.slice(0, 4),
    needsAttention: risks.slice(0, 4),
    freshness: summarizeMemoryFreshness(list, now),
  };
}

export function buildFounderCommandCenterSections({ memoryItems = [], now = Date.now() } = {}) {
  const cards = dedupeCards(toList(memoryItems).map((item) => toCard(item, now)));
  return {
    strategy: {
      items: cards.filter((item) => item.area === 'strategy' || item.type === 'priority' || item.type === 'question'),
    },
    finance: {
      items: cards.filter((item) => item.area === 'finance' || (item.type === 'metric' && item.area === 'general')),
    },
    customer: {
      items: cards.filter((item) => item.area === 'customer'),
    },
    fundraising: {
      items: cards.filter((item) => item.area === 'fundraising' || item.type === 'document'),
    },
    gtm: {
      items: cards.filter((item) => item.area === 'gtm'),
    },
    hiring: {
      items: cards.filter((item) => item.area === 'hiring'),
    },
    documents: {
      items: cards.filter((item) => item.type === 'document' || item.type === 'update'),
    },
    memoryHealth: {
      items: cards.filter((item) => item.confidence !== 'confirmed' || item.ageDays >= 7),
    },
  };
}

export function extractEditableMemoryItems(memoryItems = [], now = Date.now()) {
  return dedupeCards(toList(memoryItems).map((item) => toCard(item, now)))
    .filter((item) => ['metric', 'priority', 'risk', 'fact', 'update'].includes(item.type));
}
