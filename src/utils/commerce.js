const INDIA_TIME_ZONES = new Set(['Asia/Calcutta', 'Asia/Kolkata']);

export function humanizeIdentifier(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

export function detectPreferredCurrency() {
  if (typeof Intl === 'undefined') {
    return 'INR';
  }

  const locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (locale.toUpperCase().includes('-IN') || INDIA_TIME_ZONES.has(timeZone)) {
    return 'INR';
  }
  return 'USD';
}

export function formatMoneyMinor(amountMinor, currency = 'INR', locale) {
  const normalizedCurrency = String(currency || 'INR').toUpperCase();
  const normalizedLocale = locale || (normalizedCurrency === 'INR' ? 'en-IN' : 'en-US');
  const amount = Number(amountMinor || 0) / 100;
  return new Intl.NumberFormat(normalizedLocale, {
    style: 'currency',
    currency: normalizedCurrency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function getCreditUnitAmountMinor(currency, creditUnitAmountsMinor = {}) {
  return Number(creditUnitAmountsMinor?.[String(currency || '').toUpperCase()] || 0);
}

export function formatCreditValue(credits, currency, creditUnitAmountsMinor = {}, locale) {
  const unitAmountMinor = getCreditUnitAmountMinor(currency, creditUnitAmountsMinor);
  if (unitAmountMinor <= 0) {
    return '';
  }
  return formatMoneyMinor(unitAmountMinor * Number(credits || 0), currency, locale);
}

export function mergeCatalogProductData(detailProduct, catalogProduct) {
  if (!detailProduct) {
    return null;
  }

  if (!catalogProduct) {
    return detailProduct;
  }

  return {
    ...catalogProduct,
    ...detailProduct,
    creditPrice: detailProduct.creditPrice ?? catalogProduct.creditPrice ?? 0,
    priceInr: detailProduct.priceInr ?? catalogProduct.priceInr ?? 0,
    priceUsd: detailProduct.priceUsd ?? catalogProduct.priceUsd ?? 0,
    productId: detailProduct.productId ?? catalogProduct.productId,
    category: detailProduct.category ?? catalogProduct.category,
    thumbnail: detailProduct.thumbnail ?? catalogProduct.thumbnail,
    title: detailProduct.title ?? catalogProduct.name ?? detailProduct.title,
  };
}

export function getPurchaseDisplayName(purchase) {
  const firstItem = purchase?.items?.[0];
  return firstItem?.product_name
    || purchase?.metadata?.pack_name
    || humanizeIdentifier(firstItem?.product_slug)
    || humanizeIdentifier(purchase?.metadata?.pack_slug)
    || 'Purchase';
}
