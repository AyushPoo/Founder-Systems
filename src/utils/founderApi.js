const API_BASE = (import.meta.env.VITE_FOUNDER_SYSTEMS_API_URL || 'https://api.foundersystems.in').replace(/\/+$/, '');

export function getFounderApiBaseUrl() {
  return API_BASE;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let detail = 'Request failed';
    try {
      const payload = await response.json();
      detail = payload?.detail || payload?.message || detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getAuthSession() {
  return apiFetch('/auth/session', { method: 'GET' });
}

export function startMagicLink(payload) {
  return apiFetch('/auth/magic-link/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function signOutFounderSession() {
  return apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
}

export function getGoogleAuthStartUrl(nextPath = '/account') {
  const next = `${window.location.origin}${nextPath}`;
  return `${API_BASE}/auth/google/start?next=${encodeURIComponent(next)}&remember=1`;
}

export function getWorkspaceBootstrap() {
  return apiFetch('/workspace', { method: 'GET' });
}

export function listWorkspaceMemory({ includeArchived = false } = {}) {
  const search = includeArchived ? '?include_archived=1' : '';
  return apiFetch(`/workspace/memory${search}`, { method: 'GET' });
}

export function createWorkspaceMemory(payload) {
  return apiFetch('/workspace/memory', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateWorkspaceMemory(itemId, payload) {
  return apiFetch(`/workspace/memory/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function promoteWorkspaceMemory(itemId, payload) {
  return apiFetch(`/workspace/memory/${itemId}/promote`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listWorkspacePreferences() {
  return apiFetch('/workspace/preferences', { method: 'GET' });
}

export function updateWorkspacePreference(productSlug, payload) {
  return apiFetch(`/workspace/preferences/${productSlug}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getWorkspaceRecommendations(productSlug) {
  return apiFetch(`/workspace/recommendations?product_slug=${encodeURIComponent(productSlug)}`, {
    method: 'GET',
  });
}

export function getWalletSummary() {
  return apiFetch('/wallet', { method: 'GET' });
}

export function getWalletLedger() {
  return apiFetch('/wallet/ledger', { method: 'GET' });
}

export function getWalletUsageEvents() {
  return apiFetch('/wallet/usage-events', { method: 'GET' });
}

export function createCreditPackCheckout(payload) {
  return apiFetch('/wallet/packs/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createProductCheckout(payload) {
  return apiFetch('/checkout/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function confirmClientCheckout(payload) {
  return apiFetch('/checkout/confirm-client', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function unlockProductWithCredits(productSlug) {
  return apiFetch(`/products/${productSlug}/unlock-with-credits`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function spendProductCredits(productSlug, payload) {
  return apiFetch(`/products/${productSlug}/usage-spend`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getFounderEntitlements() {
  return apiFetch('/entitlements', { method: 'GET' });
}

export function getFounderPurchases() {
  return apiFetch('/purchases', { method: 'GET' });
}
