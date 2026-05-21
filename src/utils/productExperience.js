const DEFAULT_PRODUCT_CATEGORIES = ['Finance', 'Operations', 'Strategy'];
const INTERNAL_TESTER_EMAIL = 'ayushpoojary1@gmail.com';
const PUBLIC_PRODUCT_IDS = new Set([
  'saas-financial-model',
  'advanced-saas-model',
  'marketplace-financial-model',
  'd2c-ecommerce-model',
]);

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

export function hasProductPricing(product = {}) {
  return Number.isFinite(Number(product?.priceInr)) && Number.isFinite(Number(product?.priceUsd));
}

export function isInternalTesterEmail(email = '') {
  return normalizeEmail(email) === INTERNAL_TESTER_EMAIL;
}

export function isPubliclyAvailableProduct(product = {}) {
  const productId = typeof product === 'string' ? cleanText(product) : cleanText(product?.id);
  return PUBLIC_PRODUCT_IDS.has(productId);
}

export function getProductLaunchState(product = {}, userEmail = '') {
  const productId = typeof product === 'string' ? cleanText(product) : cleanText(product?.id);
  const isInternalTester = isInternalTesterEmail(userEmail);
  const isPubliclyAvailable = isPubliclyAvailableProduct(productId);

  return {
    productId,
    isInternalTester,
    isPubliclyAvailable,
    isComingSoon: !isPubliclyAvailable && !isInternalTester,
    canAccess: isPubliclyAvailable || isInternalTester,
  };
}

export function getProductPrimaryAction(product = {}, userEmail = '') {
  const launchState = getProductLaunchState(product, userEmail);
  if (launchState.isComingSoon) {
    return {
      kind: 'coming-soon',
    };
  }

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
