const AGENT_PRODUCTS = {
  'marketing-agent': {
    slug: 'marketing-agent',
    name: 'Marketing Operator',
    productPath: '/products/marketing-agent',
    category: 'Marketing Tools',
  },
  'finance-agent': {
    slug: 'finance-agent',
    name: 'Finance Operator',
    productPath: '/products/finance-agent',
    category: 'Finance',
  },
  'ops-agent': {
    slug: 'ops-agent',
    name: 'Operations Operator',
    productPath: '/products/ops-agent',
    category: 'Operations',
  },
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTelegramLink(value) {
  const raw = value && typeof value === 'object' ? value : {};
  return {
    linked: Boolean(raw.linked),
    status: raw.status || (raw.linked ? 'linked' : 'unlinked'),
    telegram_username: raw.telegram_username || null,
    bot_username: raw.bot_username || null,
    linked_at: raw.linked_at || null,
  };
}

function normalizeAgentProductStatus(value) {
  const raw = value && typeof value === 'object' ? value : {};
  const productSlug = slugify(raw.product_slug || raw.slug || raw.productSlug);
  const hasActivePass = Boolean(raw.has_active_pass ?? raw.has_access);
  const entitlementStatus = raw.entitlement_status || raw.pass_status || (hasActivePass ? 'active' : null);
  const telegramLink = normalizeTelegramLink(raw.telegram_link || raw.telegram || raw.telegramLink);

  return {
    ...raw,
    product_slug: productSlug,
    has_active_pass: hasActivePass,
    has_access: Boolean(raw.has_access ?? hasActivePass),
    entitlement_status: entitlementStatus,
    pass_status: raw.pass_status || entitlementStatus,
    telegram_link: telegramLink,
    telegram: telegramLink,
  };
}

export const AGENT_PRODUCT_SLUGS = Object.keys(AGENT_PRODUCTS);

export function isAgentProductSlug(value) {
  return AGENT_PRODUCT_SLUGS.includes(slugify(value));
}

export function getAgentProductMeta(productSlug) {
  return AGENT_PRODUCTS[slugify(productSlug)] || null;
}

export function getTelegramConnectPath(productSlug) {
  return `/account/telegram-connect/${slugify(productSlug)}`;
}

export function buildTelegramBotUrl(botUsername) {
  const normalized = String(botUsername || '').trim().replace(/^@+/, '');
  if (!normalized) return null;
  return `https://t.me/${normalized}`;
}

export function buildTelegramDeepLinkUrl(botUsername, token) {
  const botUrl = buildTelegramBotUrl(botUsername);
  const normalizedToken = String(token || '').trim();
  if (!botUrl || !normalizedToken) return null;
  return `${botUrl}?start=${encodeURIComponent(normalizedToken)}`;
}

export function buildTelegramStartCommand(token) {
  const normalizedToken = String(token || '').trim();
  return normalizedToken ? `/start ${normalizedToken}` : '';
}

export function getTelegramLaunchUrl(value) {
  const raw = value && typeof value === 'object' ? value : {};
  return raw.deep_link_url || buildTelegramDeepLinkUrl(raw.bot_username, raw.token);
}

export function normalizeAgentAccountStatus(value) {
  if (!value || typeof value !== 'object') return null;

  const sharedWallet = value.shared_wallet && typeof value.shared_wallet === 'object'
    ? {
      ...value.shared_wallet,
      balance: Number.isFinite(Number(value.shared_wallet.balance)) ? Number(value.shared_wallet.balance) : null,
      available_balance: Number.isFinite(Number(value.shared_wallet.available_balance))
        ? Number(value.shared_wallet.available_balance)
        : Number.isFinite(Number(value.shared_wallet.balance))
          ? Number(value.shared_wallet.balance)
          : null,
      exhausted: typeof value.shared_wallet.exhausted === 'boolean'
        ? value.shared_wallet.exhausted
        : Number.isFinite(Number(value.shared_wallet.balance))
          ? Number(value.shared_wallet.balance) <= 0
          : null,
    }
    : null;

  const productEntries = Array.isArray(value.products) ? value.products : Object.values(value.products || {});
  const products = productEntries
    .map((product) => normalizeAgentProductStatus(product))
    .filter((product) => product.product_slug);
  const productsBySlug = Object.fromEntries(products.map((product) => [product.product_slug, product]));

  return {
    ...value,
    shared_wallet: sharedWallet,
    products: productsBySlug,
    productList: products,
    productsBySlug,
  };
}

export function getAgentProductStatus(agentAccountStatus, productSlug, fallback = {}) {
  const product = normalizeAgentAccountStatus(agentAccountStatus)?.productsBySlug?.[slugify(productSlug)];
  if (product) return product;

  const entitlement = (fallback.entitlements || []).find((item) => item.product_slug === slugify(productSlug));
  if (!entitlement) return null;
  const telegramLink = normalizeTelegramLink(null);
  return {
    product_slug: slugify(productSlug),
    has_active_pass: entitlement.status === 'active',
    has_access: entitlement.status === 'active',
    entitlement_status: entitlement.status,
    pass_status: entitlement.status,
    telegram_link: telegramLink,
    telegram: telegramLink,
  };
}
