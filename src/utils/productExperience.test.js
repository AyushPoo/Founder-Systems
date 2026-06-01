import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCatalogCategories,
  getProductPrimaryAction,
  getProductLaunchState,
  hasProductPricing,
  isInternalTesterEmail,
} from './productExperience.js';

test('getProductPrimaryAction preserves launch URLs for internally enabled app-style products', () => {
  assert.deepEqual(
    getProductPrimaryAction({
      id: 'founder-outreach-kit',
      launchUrl: '/tools/founder-outreach-kit',
      priceInr: undefined,
      priceUsd: undefined,
    }, 'ayushpoojary1@gmail.com'),
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
    }, 'ayushpoojary1@gmail.com'),
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

test('getProductLaunchState keeps public products open and gates private apps', () => {
  assert.deepEqual(
    getProductLaunchState({ id: 'advanced-saas-model' }),
    {
      productId: 'advanced-saas-model',
      isInternalTester: false,
      isPubliclyAvailable: true,
      isComingSoon: false,
      canAccess: true,
    }
  );

  assert.deepEqual(
    getProductLaunchState({ id: 'founder-spec-generator' }),
    {
      productId: 'founder-spec-generator',
      isInternalTester: false,
      isPubliclyAvailable: true,
      isComingSoon: false,
      canAccess: true,
    }
  );

  assert.deepEqual(
    getProductLaunchState({ id: 'founder-outreach-kit' }),
    {
      productId: 'founder-outreach-kit',
      isInternalTester: false,
      isPubliclyAvailable: true,
      isComingSoon: false,
      canAccess: true,
    }
  );

  assert.deepEqual(
    getProductLaunchState({ id: 'future-tool' }),
    {
      productId: 'future-tool',
      isInternalTester: false,
      isPubliclyAvailable: false,
      isComingSoon: true,
      canAccess: false,
    }
  );
});

test('internal tester email bypasses launch gate for non-financial tools', () => {
  assert.equal(isInternalTesterEmail('ayushpoojary1@gmail.com'), true);
  assert.equal(isInternalTesterEmail('AYUSHPOOJARY1@GMAIL.COM'), true);
  assert.equal(isInternalTesterEmail('someone@example.com'), false);

  assert.deepEqual(
    getProductPrimaryAction(
      {
        id: 'founder-outreach-kit',
        launchUrl: '/tools/founder-outreach-kit',
      },
      'ayushpoojary1@gmail.com'
    ),
    {
      kind: 'launch',
      href: '/tools/founder-outreach-kit',
      isExternal: false,
    }
  );

  assert.deepEqual(
    getProductPrimaryAction({
      id: 'founder-outreach-kit',
      launchUrl: '/tools/founder-outreach-kit',
    }),
    {
      kind: 'launch',
      href: '/tools/founder-outreach-kit',
      isExternal: false,
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
      { category: 'AI Operators' },
    ]),
    ['All', 'Finance', 'Operations', 'Strategy', 'Marketing Tools', 'AI Operators']
  );
});
