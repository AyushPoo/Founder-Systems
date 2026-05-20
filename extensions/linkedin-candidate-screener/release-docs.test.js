import assert from 'assert';
import fs from 'node:fs/promises';

const listingDoc = await fs.readFile(
  new URL('../../docs/marketing/2026-05-20-linkedin-candidate-screener-chrome-store.md', import.meta.url),
  'utf8'
);

assert.equal(listingDoc.includes('Short description'), true);
assert.equal(listingDoc.includes('Privacy disclosure'), true);
assert.equal(listingDoc.includes('Screenshot checklist'), true);

console.log('linkedin candidate screener release docs check passed');
