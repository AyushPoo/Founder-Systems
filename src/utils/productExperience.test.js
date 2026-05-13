import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCatalogCategories,
  getProductPrimaryAction,
  hasProductPricing,
} from './productExperience.js';

test('getProductPrimaryAction prefers launch URLs for app-style products', () => {
  assert.deepEqual(
    getProductPrimaryAction({
      id: 'founder-outreach-kit',
      launchUrl: '/tools/founder-outreach-kit',
      priceInr: undefined,
      priceUsd: undefined,
    }),
    {
      kind: 'launch',
      href: '/tools/founder-outreach-kit',
      isExternal: false,
    }
  );

  assert.deepEqual(
    getProductPrimaryAction({
      id: 'promptdeck-ai',
      launchUrl: 'https://promptdeck.foundersystems.in',
    }),
    {
      kind: 'launch',
      href: 'https://promptdeck.foundersystems.in',
      isExternal: true,
    }
  );
});

test('getProductPrimaryAction falls back to checkout for priced products', () => {
  assert.deepEqual(
    getProductPrimaryAction({
      id: 'advanced-saas-model',
      priceInr: 2499,
      priceUsd: 30,
    }),
    {
      kind: 'purchase',
    }
  );
});

test('hasProductPricing only returns true when both checkout prices exist', () => {
  assert.equal(hasProductPricing({ priceInr: 499, priceUsd: 10 }), true);
  assert.equal(hasProductPricing({ priceInr: 499 }), false);
  assert.equal(hasProductPricing({ priceUsd: 10 }), false);
  assert.equal(hasProductPricing({}), false);
});

test('buildCatalogCategories keeps defaults and adds new product categories', () => {
  assert.deepEqual(
    buildCatalogCategories([
      { category: 'Strategy' },
      { category: 'Marketing Tools' },
      { category: 'Finance' },
      { category: 'Marketing Tools' },
    ]),
    ['All', 'Finance', 'Operations', 'Strategy', 'Marketing Tools']
  );
});
