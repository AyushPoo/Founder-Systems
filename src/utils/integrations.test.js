import assert from 'node:assert/strict';
import { getGmailConnectUrl, normalizeIntegrations } from './integrations.js';

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
  const normalized = normalizeIntegrations({
    integrations: [
      {
        provider: 'google',
        integration_slug: 'gmail',
        status: 'connected',
        account_email: 'founder@gmail.com',
        can_send: true,
      },
    ],
  });
  assert.equal(normalized.gmail.status, 'connected');
  assert.equal(normalized.gmail.account_email, 'founder@gmail.com');
  assert.equal(normalized.gmail.can_send, true);
}

{
  const normalized = normalizeIntegrations(null);
  assert.equal(normalized.gmail.status, 'disconnected');
  assert.equal(normalized.gmail.can_send, false);
}

