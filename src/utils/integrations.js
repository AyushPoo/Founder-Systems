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

const GOOGLE_CONNECTOR_SLUGS = new Set([
  'gmail',
  'google-drive',
  'google-docs',
  'google-sheets',
  'google-slides',
  'google-calendar',
  'google-search-console',
  'google-analytics-4',
]);

const EXTERNAL_OAUTH_CONNECTOR_SLUGS = new Set([
  'github',
  'hubspot',
  'mailchimp',
  'meta-ads',
  'linkedin',
]);

export const CONNECTOR_CATALOG = [
  {
    slug: 'gmail',
    name: 'Gmail',
    group: 'Google Workspace',
    phase: 'live',
    agents: ['Marketing Operator', 'Ops Operator'],
    description: 'Send explicitly approved outbound emails from the user-owned Gmail account.',
    actions: ['Approved email send', 'Follow-up drafts', 'Customer/prospect replies'],
    scopes: ['gmail.send'],
  },
  {
    slug: 'google-drive',
    name: 'Google Drive',
    group: 'Google Workspace',
    phase: 'planned',
    agents: ['Marketing Operator', 'Finance Operator', 'Ops Operator'],
    description: 'Read and organize user-approved workspace folders, files, and generated artifacts.',
    actions: ['Read selected folders', 'Save approved outputs', 'Attach workspace files'],
    scopes: ['drive.file'],
  },
  {
    slug: 'google-docs',
    name: 'Google Docs',
    group: 'Google Workspace',
    phase: 'planned',
    agents: ['Marketing Operator', 'Finance Operator', 'Ops Operator'],
    description: 'Create and update approved strategy docs, SOPs, memos, and operator drafts.',
    actions: ['Create docs', 'Update drafts', 'Export polished documents'],
    scopes: ['documents', 'drive.file'],
  },
  {
    slug: 'google-sheets',
    name: 'Google Sheets',
    group: 'Google Workspace',
    phase: 'planned',
    agents: ['Finance Operator', 'Ops Operator'],
    description: 'Create and update approved trackers, financial models, KPI dashboards, and operating sheets.',
    actions: ['Create forecast sheets', 'Update KPI trackers', 'Export financial statements'],
    scopes: ['spreadsheets', 'drive.file'],
  },
  {
    slug: 'google-slides',
    name: 'Google Slides',
    group: 'Google Workspace',
    phase: 'planned',
    agents: ['Marketing Operator', 'Finance Operator'],
    description: 'Generate pitch, investor, campaign, and board-ready presentation drafts.',
    actions: ['Create decks', 'Update slides', 'Prepare investor packs'],
    scopes: ['presentations', 'drive.file'],
  },
  {
    slug: 'google-calendar',
    name: 'Google Calendar',
    group: 'Google Workspace',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Schedule approved meetings, reminders, interviews, and operating cadences.',
    actions: ['Create calendar events', 'Draft meeting invites', 'Set follow-up reminders'],
    scopes: ['calendar.events'],
  },
  {
    slug: 'google-search-console',
    name: 'Google Search Console',
    group: 'Marketing Analytics',
    phase: 'planned',
    agents: ['Marketing Operator'],
    description: 'Read SEO performance, search queries, pages, indexing signals, and growth opportunities.',
    actions: ['SEO audits', 'Keyword/page analysis', 'Content opportunity reports'],
    scopes: ['webmasters.readonly'],
  },
  {
    slug: 'google-analytics-4',
    name: 'Google Analytics 4',
    group: 'Marketing Analytics',
    phase: 'planned',
    agents: ['Marketing Operator', 'Finance Operator'],
    description: 'Read funnel, traffic, conversion, channel, and campaign performance data.',
    actions: ['Traffic analysis', 'Conversion diagnostics', 'Channel performance reports'],
    scopes: ['analytics.readonly'],
  },
  {
    slug: 'meta-ads',
    name: 'Meta Ads',
    group: 'Paid Growth',
    phase: 'live',
    agents: ['Marketing Operator'],
    description: 'Read campaign performance and prepare approved paused campaign/ad drafts.',
    actions: ['Ad performance reviews', 'Paused campaign drafts', 'Creative testing plans'],
    scopes: ['ads_read', 'ads_management'],
  },
  {
    slug: 'linkedin',
    name: 'LinkedIn',
    group: 'Social & Outbound',
    phase: 'live',
    agents: ['Marketing Operator'],
    description: 'Connect LinkedIn for profile-aware drafts and official LinkedIn page, ads, or lead workflows where API access is approved.',
    actions: ['Profile-aware drafts', 'Company page post prep', 'LinkedIn ad/lead-gen workflows'],
    scopes: ['openid', 'profile', 'email', 'approved LinkedIn API products when available'],
  },
  {
    slug: 'hubspot',
    name: 'HubSpot',
    group: 'CRM',
    phase: 'live',
    agents: ['Marketing Operator', 'Ops Operator'],
    description: 'Read and update approved contacts, companies, deals, notes, and campaign handoffs.',
    actions: ['Lead list reads', 'CRM notes', 'Pipeline updates'],
    scopes: ['crm.objects.contacts', 'crm.objects.deals'],
  },
  {
    slug: 'pipedrive',
    name: 'Pipedrive',
    group: 'CRM',
    phase: 'planned',
    agents: ['Marketing Operator', 'Ops Operator'],
    description: 'Manage approved sales pipeline tasks, activities, notes, and follow-up queues.',
    actions: ['Pipeline updates', 'Activity creation', 'Follow-up notes'],
    scopes: ['deals', 'activities', 'persons'],
  },
  {
    slug: 'mailchimp',
    name: 'Mailchimp',
    group: 'Email Marketing',
    phase: 'live',
    agents: ['Marketing Operator'],
    description: 'Prepare and send approved newsletters, lifecycle emails, and audience campaigns.',
    actions: ['Campaign drafts', 'Audience segments', 'Approved sends'],
    scopes: ['campaigns', 'lists'],
  },
  {
    slug: 'brevo',
    name: 'Brevo',
    group: 'Email Marketing',
    phase: 'planned',
    agents: ['Marketing Operator'],
    description: 'Prepare and send approved transactional or marketing email campaigns.',
    actions: ['Campaign drafts', 'Contact lists', 'Approved sends'],
    scopes: ['contacts', 'campaigns'],
  },
  {
    slug: 'sendgrid',
    name: 'SendGrid',
    group: 'Email Marketing',
    phase: 'planned',
    agents: ['Marketing Operator', 'Ops Operator'],
    description: 'Send approved transactional, lifecycle, or customer-support emails through user-owned SendGrid.',
    actions: ['Template drafts', 'Approved sends', 'Deliverability checks'],
    scopes: ['mail.send', 'templates'],
  },
  {
    slug: 'wordpress',
    name: 'WordPress',
    group: 'Website CMS',
    phase: 'planned',
    agents: ['Marketing Operator'],
    description: 'Create and update approved blog posts, landing pages, and content briefs.',
    actions: ['Blog drafts', 'Page updates', 'SEO content publishing'],
    scopes: ['posts', 'pages'],
  },
  {
    slug: 'webflow',
    name: 'Webflow',
    group: 'Website CMS',
    phase: 'planned',
    agents: ['Marketing Operator'],
    description: 'Prepare and publish approved site content and campaign landing pages.',
    actions: ['CMS drafts', 'Landing page updates', 'Approved publishing'],
    scopes: ['cms:read', 'cms:write'],
  },
  {
    slug: 'canva',
    name: 'Canva',
    group: 'Creative',
    phase: 'planned',
    agents: ['Marketing Operator'],
    description: 'Create approved campaign, ad, social, and presentation creative drafts.',
    actions: ['Ad creatives', 'Social posts', 'Deck visuals'],
    scopes: ['design:read', 'design:write'],
  },
  {
    slug: 'razorpay',
    name: 'Razorpay',
    group: 'Finance',
    phase: 'planned',
    agents: ['Finance Operator'],
    description: 'Read payments, refunds, settlements, and subscription reports for reconciliation.',
    actions: ['Revenue reports', 'Settlement reconciliation', 'Payment diagnostics'],
    scopes: ['payments:read', 'settlements:read'],
  },
  {
    slug: 'quickbooks',
    name: 'QuickBooks',
    group: 'Accounting',
    phase: 'planned',
    agents: ['Finance Operator'],
    description: 'Read accounting data and prepare approved invoices, bills, and journal drafts.',
    actions: ['Invoice drafts', 'P&L summaries', 'Ledger review'],
    scopes: ['accounting'],
  },
  {
    slug: 'xero',
    name: 'Xero',
    group: 'Accounting',
    phase: 'planned',
    agents: ['Finance Operator'],
    description: 'Read accounting data and prepare approved invoices, bills, and finance reports.',
    actions: ['Invoice drafts', 'Cash reports', 'Reconciliation notes'],
    scopes: ['accounting.transactions', 'accounting.reports.read'],
  },
  {
    slug: 'zoho-books',
    name: 'Zoho Books',
    group: 'Accounting',
    phase: 'planned',
    agents: ['Finance Operator'],
    description: 'Read and prepare approved accounting records for Zoho Books users.',
    actions: ['Invoice drafts', 'Expense review', 'Finance reports'],
    scopes: ['ZohoBooks.fullaccess.READ', 'ZohoBooks.invoices.CREATE'],
  },
  {
    slug: 'tally',
    name: 'Tally',
    group: 'Accounting',
    phase: 'planned',
    agents: ['Finance Operator'],
    description: 'Prepare import-ready accounting artifacts and summaries for Tally workflows.',
    actions: ['Import files', 'Ledger summaries', 'GST-ready reports'],
    scopes: ['User-approved import/export'],
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    group: 'Finance',
    phase: 'planned',
    agents: ['Finance Operator'],
    description: 'Read Stripe revenue, subscriptions, refunds, churn, and payment analytics.',
    actions: ['MRR reports', 'Refund analysis', 'Subscription diagnostics'],
    scopes: ['read_only'],
  },
  {
    slug: 'slack',
    name: 'Slack',
    group: 'Team Ops',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Send approved internal updates, reminders, support summaries, and workflow nudges.',
    actions: ['Approved channel updates', 'Daily summaries', 'Reminder creation'],
    scopes: ['chat:write', 'channels:read'],
  },
  {
    slug: 'notion',
    name: 'Notion',
    group: 'Team Ops',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Create and update approved SOPs, task docs, hiring trackers, and company wiki pages.',
    actions: ['SOP pages', 'Hiring docs', 'Operating dashboards'],
    scopes: ['read_content', 'update_content', 'insert_content'],
  },
  {
    slug: 'clickup',
    name: 'ClickUp',
    group: 'Project Management',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Create and update approved tasks, checklists, owners, due dates, and operating workflows.',
    actions: ['Task creation', 'Checklist updates', 'Status changes'],
    scopes: ['tasks', 'lists'],
  },
  {
    slug: 'asana',
    name: 'Asana',
    group: 'Project Management',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Create and update approved operating tasks, projects, owners, and due dates.',
    actions: ['Task creation', 'Project updates', 'Assignee changes'],
    scopes: ['default'],
  },
  {
    slug: 'trello',
    name: 'Trello',
    group: 'Project Management',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Create and update approved cards, checklists, labels, and project boards.',
    actions: ['Card creation', 'Checklist updates', 'Board summaries'],
    scopes: ['read', 'write'],
  },
  {
    slug: 'linear',
    name: 'Linear',
    group: 'Product Ops',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Create and update approved issues, triage queues, and product operations tasks.',
    actions: ['Issue creation', 'Triage summaries', 'Status updates'],
    scopes: ['issues:create', 'read'],
  },
  {
    slug: 'jira',
    name: 'Jira',
    group: 'Product Ops',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Create and update approved tickets, sprint tasks, and operational issue queues.',
    actions: ['Ticket creation', 'Sprint updates', 'Status changes'],
    scopes: ['read:jira-work', 'write:jira-work'],
  },
  {
    slug: 'zendesk',
    name: 'Zendesk',
    group: 'Customer Support',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Read support tickets and draft approved replies, macros, tags, and escalations.',
    actions: ['Ticket triage', 'Reply drafts', 'Macro creation'],
    scopes: ['tickets:read', 'tickets:write'],
  },
  {
    slug: 'freshdesk',
    name: 'Freshdesk',
    group: 'Customer Support',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Read support queues and draft approved replies, automations, and escalation notes.',
    actions: ['Ticket triage', 'Reply drafts', 'Escalation notes'],
    scopes: ['tickets'],
  },
  {
    slug: 'intercom',
    name: 'Intercom',
    group: 'Customer Support',
    phase: 'planned',
    agents: ['Ops Operator', 'Marketing Operator'],
    description: 'Read conversations and draft approved replies, onboarding messages, and support summaries.',
    actions: ['Conversation summaries', 'Reply drafts', 'Onboarding messages'],
    scopes: ['conversations.read', 'conversations.write'],
  },
  {
    slug: 'typeform',
    name: 'Typeform',
    group: 'Forms',
    phase: 'planned',
    agents: ['Ops Operator', 'Marketing Operator'],
    description: 'Create approved forms and read submissions for onboarding, hiring, research, and support.',
    actions: ['Form drafts', 'Submission summaries', 'Research intake'],
    scopes: ['forms:read', 'forms:write', 'responses:read'],
  },
  {
    slug: 'tally-forms',
    name: 'Tally Forms',
    group: 'Forms',
    phase: 'planned',
    agents: ['Ops Operator', 'Marketing Operator'],
    description: 'Create approved forms and summarize submissions from user-owned Tally form workspaces.',
    actions: ['Form drafts', 'Submission summaries', 'Lead intake'],
    scopes: ['User-approved API access'],
  },
  {
    slug: 'github',
    name: 'GitHub',
    group: 'Engineering Ops',
    phase: 'live',
    agents: ['Ops Operator'],
    description: 'Read issues, create approved tasks, and summarize product/security operations signals.',
    actions: ['Issue creation', 'Release notes', 'Security triage summaries'],
    scopes: ['repo:read', 'issues:write'],
  },
  {
    slug: 'sentry',
    name: 'Sentry',
    group: 'Engineering Ops',
    phase: 'planned',
    agents: ['Ops Operator'],
    description: 'Read incidents and error spikes, then create approved follow-up actions and summaries.',
    actions: ['Incident summaries', 'Error triage', 'Follow-up tasks'],
    scopes: ['event:read', 'project:read'],
  },
];

export function getConnectorBySlug(slug) {
  return CONNECTOR_CATALOG.find((connector) => connector.slug === slug) || null;
}

export function getConnectorStatus(connector, integrations = {}) {
  if (!connector) return 'planned';
  const connected = integrations.integrationBySlug?.[connector.slug];
  if (connected?.status === 'connected') {
    return 'connected';
  }
  if (connector.slug === 'gmail') {
    return integrations.gmail?.can_send ? 'connected' : 'available';
  }
  if (GOOGLE_CONNECTOR_SLUGS.has(connector.slug) || connector.slug === 'razorpay') {
    return 'available';
  }
  if (EXTERNAL_OAUTH_CONNECTOR_SLUGS.has(connector.slug)) {
    return 'available';
  }
  return connector.phase === 'live' ? 'available' : 'planned';
}

export function getConnectorsForAgent(agentName) {
  return CONNECTOR_CATALOG.filter((connector) => connector.agents.includes(agentName));
}

export function normalizeIntegrations(payload) {
  const integrations = Array.isArray(payload?.integrations) ? payload.integrations : [];
  const gmail = integrations.find((item) => item?.provider === 'google' && item?.integration_slug === 'gmail') || null;
  const integrationBySlug = Object.fromEntries(
    integrations
      .filter((item) => item?.integration_slug)
      .map((item) => [item.integration_slug, item]),
  );
  const normalized = {
    integrations,
    integrationBySlug,
    gmail: {
      ...DEFAULT_GMAIL,
      ...(gmail || {}),
      can_send: Boolean(gmail?.can_send),
    },
  };
  const catalog = CONNECTOR_CATALOG.map((connector) => ({
    ...connector,
    status: getConnectorStatus(connector, normalized),
  }));
  return {
    ...normalized,
    catalog,
    connectedCount: catalog.filter((connector) => connector.status === 'connected').length,
    availableCount: catalog.filter((connector) => connector.status === 'available').length,
    plannedCount: catalog.filter((connector) => connector.status === 'planned').length,
  };
}

export function buildConnectionCatalog(integrationStatus = {}) {
  return CONNECTOR_CATALOG.map((connector) => {
    const status = getConnectorStatus(connector, integrationStatus);
    return {
      key: connector.slug,
      name: connector.name,
      group: connector.group,
      groupLabel: connector.group,
      description: connector.description,
      status: status === 'planned' ? 'coming-soon' : status,
      accountLabel:
        integrationStatus.integrationBySlug?.[connector.slug]?.account_email
        || integrationStatus.integrationBySlug?.[connector.slug]?.display_name
        || (connector.slug === 'gmail' ? integrationStatus.gmail?.account_email || '' : ''),
      usedBy: connector.agents,
      actions: connector.actions,
      scopes: connector.scopes,
    };
  });
}

export function getGmailConnectUrl({ apiBase, origin, nextPath = '/account?tab=connections' }) {
  return getIntegrationConnectUrl({ connectorSlug: 'gmail', apiBase, origin, nextPath });
}

export function getIntegrationConnectUrl({
  connectorSlug,
  apiBase,
  origin,
  nextPath = '/account?tab=connections',
}) {
  const cleanBase = String(apiBase || '').replace(/\/+$/, '');
  const cleanOrigin = String(origin || '').replace(/\/+$/, '');
  const next = `${cleanOrigin}${nextPath.startsWith('/') ? nextPath : `/${nextPath}`}`;
  if (GOOGLE_CONNECTOR_SLUGS.has(connectorSlug)) {
    return `${cleanBase}/integrations/google/${connectorSlug}/start?next=${encodeURIComponent(next)}`;
  }
  if (EXTERNAL_OAUTH_CONNECTOR_SLUGS.has(connectorSlug)) {
    return `${cleanBase}/integrations/${connectorSlug}/start?next=${encodeURIComponent(next)}`;
  }
  return '';
}

