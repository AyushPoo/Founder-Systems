const DEFAULT_GMAIL = {
  provider: 'google',
  integration_slug: 'gmail',
  status: 'disconnected',
  account_email: null,
  display_name: null,
  scopes: [],
  can_send: false,
  connected_at: null,
  last_used_at: null,
};

export function normalizeIntegrations(payload) {
  const integrations = Array.isArray(payload?.integrations) ? payload.integrations : [];
  const gmail = integrations.find((item) => item?.provider === 'google' && item?.integration_slug === 'gmail') || null;
  return {
    integrations,
    gmail: {
      ...DEFAULT_GMAIL,
      ...(gmail || {}),
      can_send: Boolean(gmail?.can_send),
    },
  };
}

export function getGmailConnectUrl({ apiBase, origin, nextPath = '/account?tab=settings' }) {
  const cleanBase = String(apiBase || '').replace(/\/+$/, '');
  const cleanOrigin = String(origin || '').replace(/\/+$/, '');
  const next = `${cleanOrigin}${nextPath.startsWith('/') ? nextPath : `/${nextPath}`}`;
  return `${cleanBase}/integrations/google/gmail/start?next=${encodeURIComponent(next)}`;
}

