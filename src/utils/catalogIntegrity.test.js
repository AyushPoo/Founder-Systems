import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('public product catalog is valid JSON and includes current product surfaces', async () => {
  const raw = await readFile(new URL('../../public/product-data/index.json', import.meta.url), 'utf8');
  const products = JSON.parse(raw);
  const productIds = new Set(products.map((product) => product.id));

  assert.equal(Array.isArray(products), true);
  assert.equal(productIds.has('founder-command-center'), true);
  assert.equal(productIds.has('founder-pdf-summarizer'), true);
  assert.equal(productIds.has('linkedin-candidate-screener'), true);
  assert.equal(productIds.has('marketing-agent'), true);
  assert.equal(productIds.has('finance-agent'), true);
  assert.equal(productIds.has('ops-agent'), true);
});
