import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('./FounderSpecGenerator.jsx', import.meta.url), 'utf8');

assert.equal(pageSource.includes("const FINAL_API_URL = '/api/founder-spec-generate';"), true);
assert.equal(pageSource.includes('apiUrl = CONVERSATION_API_URL'), true);
assert.equal(pageSource.includes('apiUrl: FINAL_API_URL'), true);

console.log('FounderSpecGenerator final-generation route tests passed');
