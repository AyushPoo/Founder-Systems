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

export function buildConnectionCatalog(integrationStatus = {}) {
  return [
    {
      key: 'gmail',
      name: 'Gmail',
      group: 'communication',
      groupLabel: 'Communication',
      description: 'Send approved emails from your connected Gmail account.',
      status: integrationStatus.gmail?.can_send ? 'connected' : 'available',
      accountLabel: integrationStatus.gmail?.account_email || '',
      usedBy: ['Marketing Operator', 'Founder Update Generator'],
    },
    {
      key: 'google-sheets',
      name: 'Google Sheets',
      group: 'sheets-reporting',
      groupLabel: 'Sheets and reporting',
      description: 'Read KPI trackers, finance models, and planning sheets.',
      status: 'coming-soon',
      accountLabel: '',
      usedBy: ['Finance Operator', 'Founder Command Center'],
    },
    {
      key: 'google-docs',
      name: 'Google Docs',
      group: 'docs-files',
      groupLabel: 'Docs and files',
      description: 'Read strategy notes, update drafts, and shared operating docs.',
      status: 'coming-soon',
      accountLabel: '',
      usedBy: ['Ops Operator', 'Founder Update Generator'],
    },
    {
      key: 'google-slides',
      name: 'Google Slides',
      group: 'docs-files',
      groupLabel: 'Docs and files',
      description: 'Pull narrative decks and presentation drafts into Founder Systems.',
      status: 'coming-soon',
      accountLabel: '',
      usedBy: ['Marketing Operator', 'Founder Spec Generator'],
    },
    {
      key: 'google-drive',
      name: 'Google Drive',
      group: 'docs-files',
      groupLabel: 'Docs and files',
      description: 'Access shared folders and workspace files without copy-pasting links.',
      status: 'coming-soon',
      accountLabel: '',
      usedBy: ['Ops Operator', 'Founder Command Center'],
    },
  ];
}

export function getGmailConnectUrl({ apiBase, origin, nextPath = '/account?tab=settings' }) {
  const cleanBase = String(apiBase || '').replace(/\/+$/, '');
  const cleanOrigin = String(origin || '').replace(/\/+$/, '');
  const next = `${cleanOrigin}${nextPath.startsWith('/') ? nextPath : `/${nextPath}`}`;
  return `${cleanBase}/integrations/google/gmail/start?next=${encodeURIComponent(next)}`;
}

