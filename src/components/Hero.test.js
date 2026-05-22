import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const heroSource = readFileSync(new URL('./Hero.jsx', import.meta.url), 'utf8');

test('hero no longer includes the founders clarity badge copy', () => {
  assert.equal(
    heroSource.includes('Built for founders who want clarity and momentum'),
    false
  );
});

test('hero still keeps the main landing headline', () => {
  assert.equal(heroSource.includes('Turn Founder Chaos Into'), true);
  assert.equal(heroSource.includes('Systems.'), true);
});
