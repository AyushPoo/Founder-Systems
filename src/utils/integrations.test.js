import assert from 'node:assert/strict';
import {
  CONNECTOR_CATALOG,
  buildConnectionCatalog,
  getConnectorBySlug,
  getConnectorsForAgent,
  getGmailConnectUrl,
  getIntegrationConnectUrl,
  normalizeIntegrations,
} from './integrations.js';

const apiBase = 'https://api.foundersystems.in';

{
  const url = getGmailConnectUrl({
    apiBase,
    origin: 'https://foundersystems.in',
    nextPath: '/account?tab=settings',
  });
  assert.equal(
    url,
    'https://api.foundersystems.in/integrations/google/gmail/start?next=https%3A%2F%2Ffoundersystems.in%2Faccount%3Ftab%3Dsettings',
  );
}

{
  const url = getIntegrationConnectUrl({
    connectorSlug: 'google-sheets',
    apiBase,
    origin: 'https://foundersystems.in',
  });
  assert.equal(
    url,
    'https://api.foundersystems.in/integrations/google/google-sheets/start?next=https%3A%2F%2Ffoundersystems.in%2Faccount%3Ftab%3Dconnections',
  );
}

{
  const url = getIntegrationConnectUrl({
    connectorSlug: 'github',
    apiBase,
    origin: 'https://foundersystems.in',
  });
  assert.equal(
    url,
    'https://api.foundersystems.in/integrations/github/start?next=https%3A%2F%2Ffoundersystems.in%2Faccount%3Ftab%3Dconnections',
  );
}

{
  const normalized = normalizeIntegrations({
    integrations: [
      {
        provider: 'google',
        integration_slug: 'gmail',
        status: 'connected',
        account_email: 'founder@gmail.com',
        can_send: true,
      },
      {
        provider: 'google',
        integration_slug: 'google-sheets',
        status: 'connected',
        account_email: 'founder@gmail.com',
      },
      {
        provider: 'github',
        integration_slug: 'github',
        status: 'connected',
        account_email: 'founder@example.com',
      },
    ],
  });
  assert.equal(normalized.gmail.status, 'connected');
  assert.equal(normalized.gmail.account_email, 'founder@gmail.com');
  assert.equal(normalized.gmail.can_send, true);
  assert.equal(normalized.connectedCount, 3);
  assert.equal(normalized.catalog.find((connector) => connector.slug === 'gmail').status, 'connected');
  assert.equal(normalized.catalog.find((connector) => connector.slug === 'google-sheets').status, 'connected');
  assert.equal(normalized.catalog.find((connector) => connector.slug === 'github').status, 'connected');
}

{
  const normalized = normalizeIntegrations(null);
  assert.equal(normalized.gmail.status, 'disconnected');
  assert.equal(normalized.gmail.can_send, false);
  assert.equal(normalized.catalog.find((connector) => connector.slug === 'gmail').status, 'available');
  assert.ok(normalized.plannedCount > 20);
}

{
  assert.ok(CONNECTOR_CATALOG.length >= 30);
  assert.equal(getConnectorBySlug('meta-ads').name, 'Meta Ads');
  assert.equal(buildConnectionCatalog(normalizeIntegrations(null)).find((connector) => connector.key === 'github').status, 'available');
  assert.equal(getConnectorBySlug('quickbooks').agents.includes('Finance Operator'), true);
  assert.equal(getConnectorsForAgent('Marketing Operator').some((connector) => connector.slug === 'linkedin'), true);
  assert.equal(getConnectorsForAgent('Ops Operator').some((connector) => connector.slug === 'zendesk'), true);
  assert.equal(buildConnectionCatalog(normalizeIntegrations(null)).length, CONNECTOR_CATALOG.length);
  assert.equal(buildConnectionCatalog(normalizeIntegrations(null)).find((connector) => connector.key === 'quickbooks').status, 'coming-soon');
}

console.log('integrations tests passed');
