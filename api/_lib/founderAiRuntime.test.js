import assert from 'node:assert/strict';
import test from 'node:test';

import {
  consumeProductRateLimit,
  getBedrockModelId,
} from './founderAiRuntime.js';

test('getBedrockModelId returns cheap defaults and supports quality tier', () => {
  assert.equal(getBedrockModelId('cheap'), 'amazon.nova-micro-v1:0');
  assert.equal(getBedrockModelId('quality'), 'anthropic.claude-haiku-4-5-20251001-v1:0');
});

test('consumeProductRateLimit throws after the configured window budget is exhausted', () => {
  const req = {
    headers: {
      'x-forwarded-for': `test-${Date.now()}`,
    },
  };

  for (let index = 0; index < 6; index += 1) {
    const state = consumeProductRateLimit('founder-update-generator', req);
    assert.equal(state.limit, 6);
  }

  assert.throws(
    () => consumeProductRateLimit('founder-update-generator', req),
    /temporarily rate-limited/i
  );
});

console.log('founderAiRuntime tests passed');
