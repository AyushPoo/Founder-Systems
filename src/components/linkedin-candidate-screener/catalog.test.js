import assert from 'assert';
import fs from 'node:fs/promises';

const catalog = JSON.parse(
  await fs.readFile(new URL('../../../public/product-data/index.json', import.meta.url), 'utf8')
);

const product = catalog.find((item) => item.id === 'linkedin-candidate-screener');
assert.equal(Boolean(product), true);
assert.equal(product.name, 'LinkedIn Candidate Screener');

console.log('linkedin candidate screener catalog check passed');
