import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectPreferredCurrency,
  formatCreditValue,
  formatMoneyMinor,
  getPurchaseDisplayName,
  mergeCatalogProductData,
} from './commerce.js';

test('formatMoneyMinor formats INR and USD amounts cleanly', () => {
  assert.equal(formatMoneyMinor(149900, 'INR', 'en-IN'), '₹1,499');
  assert.equal(formatMoneyMinor(3000, 'USD', 'en-US'), '$30');
});

test('formatCreditValue converts credits into the chosen currency value', () => {
  assert.equal(formatCreditValue(8, 'INR', { INR: 20000 }, 'en-IN'), '₹1,600');
  assert.equal(formatCreditValue(8, 'USD', { USD: 300 }, 'en-US'), '$24');
});

test('mergeCatalogProductData preserves detail content while inheriting catalog pricing', () => {
  const merged = mergeCatalogProductData(
    { id: 'saas-financial-model', title: 'The 10-Minute SaaS Financial Model', subtitle: 'Pitch clarity' },
    { id: 'saas-financial-model', priceInr: 1499, priceUsd: 20, creditPrice: 8, name: 'SaaS Financial Model Template' },
  );

  assert.equal(merged.title, 'The 10-Minute SaaS Financial Model');
  assert.equal(merged.priceInr, 1499);
  assert.equal(merged.creditPrice, 8);
});

test('getPurchaseDisplayName prefers product names and falls back to pack names', () => {
  assert.equal(
    getPurchaseDisplayName({ items: [{ product_name: 'SaaS Financial Model' }] }),
    'SaaS Financial Model',
  );
  assert.equal(
    getPurchaseDisplayName({ metadata: { pack_name: 'Starter Credit Pack' } }),
    'Starter Credit Pack',
  );
});

test('detectPreferredCurrency returns one of the supported currencies', () => {
  assert.ok(['INR', 'USD'].includes(detectPreferredCurrency()));
});
