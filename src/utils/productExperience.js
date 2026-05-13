const DEFAULT_PRODUCT_CATEGORIES = ['Finance', 'Operations', 'Strategy'];

function cleanText(value) {
  return String(value || '').trim();
}

export function hasProductPricing(product = {}) {
  return Number.isFinite(Number(product?.priceInr)) && Number.isFinite(Number(product?.priceUsd));
}

export function getProductPrimaryAction(product = {}) {
  const launchUrl = cleanText(product?.launchUrl);
  if (launchUrl) {
    return {
      kind: 'launch',
      href: launchUrl,
      isExternal: !launchUrl.startsWith('/'),
    };
  }

  if (hasProductPricing(product)) {
    return {
      kind: 'purchase',
    };
  }

  return {
    kind: 'none',
  };
}

export function buildCatalogCategories(products = []) {
  const categories = ['All', ...DEFAULT_PRODUCT_CATEGORIES];

  for (const product of Array.isArray(products) ? products : []) {
    const category = cleanText(product?.category);
    if (category && !categories.includes(category)) {
      categories.push(category);
    }
  }

  return categories;
}
