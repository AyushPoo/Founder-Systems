import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const routingConfig = JSON.parse(
  await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'),
);

function findRedirect(source) {
  return routingConfig.redirects?.find((redirect) => redirect.source === source);
}

function redirectsOnlyBrowserNavigations(redirect) {
  return redirect.has?.some(
    (matcher) =>
      matcher.type === 'header' &&
      matcher.key === 'accept' &&
      matcher.value === '.*text/html.*',
  );
}

test('product catalog JSON routes redirect browser refreshes back to product pages', () => {
  const catalogRedirect = findRedirect('/products/index.json');
  const productRedirect = findRedirect('/products/:product.json');

  assert.equal(catalogRedirect.destination, '/products');
  assert.equal(catalogRedirect.permanent, false);
  assert.equal(redirectsOnlyBrowserNavigations(catalogRedirect), true);

  assert.equal(productRedirect.destination, '/products/:product');
  assert.equal(productRedirect.permanent, false);
  assert.equal(redirectsOnlyBrowserNavigations(productRedirect), true);
});
