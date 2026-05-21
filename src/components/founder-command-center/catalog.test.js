import assert from 'node:assert/strict';
import fs from 'node:fs';

const pageSource = fs.readFileSync(
  new URL('./FounderCommandCenterWorkspace.jsx', import.meta.url),
  'utf8',
);

assert.equal(pageSource.includes('Founder Command Center'), true);
assert.equal(pageSource.includes('What changed'), true);
assert.equal(pageSource.includes('Needs attention'), true);

console.log('founder command center component smoke test passed');
