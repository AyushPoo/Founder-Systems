import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTelegramBotUrl,
  buildTelegramStartCommand,
  buildTelegramWebBotUrl,
  getAgentProductMeta,
  getAgentProductStatus,
  getTelegramConnectPath,
  getTelegramLaunchUrl,
  normalizeAgentAccountStatus,
} from './agents.js';

test('getAgentProductMeta returns metadata for supported operator slugs', () => {
  assert.deepEqual(getAgentProductMeta('marketing-agent'), {
    slug: 'marketing-agent',
    name: 'Marketing Operator',
    productPath: '/products/marketing-agent',
    category: 'Marketing Tools',
  });

  assert.equal(getAgentProductMeta('unknown-agent'), null);
});

test('telegram URL helpers normalize usernames and deep links', () => {
  assert.equal(buildTelegramBotUrl('@FounderSystemsBot'), 'https://t.me/FounderSystemsBot');
  assert.equal(buildTelegramWebBotUrl('@FounderSystemsBot'), 'https://web.telegram.org/k/#@FounderSystemsBot');
  assert.equal(
    getTelegramLaunchUrl({ bot_username: '@FounderSystemsBot', token: 'start-me' }),
    'https://t.me/FounderSystemsBot?start=start-me',
  );
  assert.equal(
    getTelegramLaunchUrl({ deep_link_url: 'https://t.me/FounderSystemsBot?start=server-token' }),
    'https://t.me/FounderSystemsBot?start=server-token',
  );
  assert.equal(buildTelegramStartCommand('server-token'), '/start server-token');
  assert.equal(getTelegramConnectPath('ops-agent'), '/account/telegram-connect/ops-agent');
});

test('normalizeAgentAccountStatus indexes products by slug and normalizes telegram state', () => {
  const normalized = normalizeAgentAccountStatus({
    shared_wallet: { balance: '14' },
    products: [
      {
        product_slug: 'finance-agent',
        has_access: true,
        telegram_link: {
          linked: true,
          bot_username: '@FinanceOperatorBot',
        },
      },
    ],
  });

  assert.equal(normalized.shared_wallet.balance, 14);
  assert.equal(normalized.productsBySlug['finance-agent'].has_active_pass, true);
  assert.equal(normalized.productsBySlug['finance-agent'].telegram_link.status, 'linked');
  assert.equal(normalized.productsBySlug['finance-agent'].telegram_link.bot_username, '@FinanceOperatorBot');
});

test('getAgentProductStatus falls back to entitlement data when agent status is unavailable', () => {
  const state = getAgentProductStatus(null, 'marketing-agent', {
    entitlements: [
      { product_slug: 'marketing-agent', status: 'active' },
      { product_slug: 'finance-agent', status: 'expired' },
    ],
  });

  assert.deepEqual(state, {
    product_slug: 'marketing-agent',
    has_active_pass: true,
    has_access: true,
    entitlement_status: 'active',
    pass_status: 'active',
    telegram_link: {
      linked: false,
      status: 'unlinked',
      telegram_username: null,
      bot_username: null,
      linked_at: null,
    },
    telegram: {
      linked: false,
      status: 'unlinked',
      telegram_username: null,
      bot_username: null,
      linked_at: null,
    },
  });
});
