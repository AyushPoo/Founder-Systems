import assert from 'node:assert/strict';
import test from 'node:test';

import {
  consumeProductRateLimit,
  estimateReservedOutputTokens,
  getBedrockModelId,
} from './founderAiRuntime.js';

test('getBedrockModelId returns cheap defaults and supports quality tier', () => {
  assert.equal(getBedrockModelId('cheap'), 'amazon.nova-micro-v1:0');
  assert.equal(getBedrockModelId('quality'), 'us.anthropic.claude-haiku-4-5-20251001-v1:0');
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

test('consumeProductRateLimit ignores spoofable email headers when deriving identity', () => {
  const forwardedFor = `203.0.113.${Date.now() % 200}`;
  const firstReq = {
    headers: {
      'x-forwarded-for': forwardedFor,
      'x-user-email': 'first@example.com',
    },
  };
  const secondReq = {
    headers: {
      'x-forwarded-for': forwardedFor,
      'x-user-email': 'second@example.com',
    },
  };

  for (let index = 0; index < 6; index += 1) {
    consumeProductRateLimit('founder-update-generator', firstReq);
  }

  assert.throws(
    () => consumeProductRateLimit('founder-update-generator', secondReq),
    /temporarily rate-limited/i
  );
});

test('estimateReservedOutputTokens keeps guard estimates below oversized model caps', () => {
  assert.equal(estimateReservedOutputTokens(2400, 4), 800);
  assert.equal(estimateReservedOutputTokens(2200, 3), 725);
  assert.equal(estimateReservedOutputTokens(500, 1), 500);
});

console.log('founderAiRuntime tests passed');
