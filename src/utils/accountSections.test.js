import assert from 'node:assert/strict';
import {
  ACCOUNT_SECTIONS,
  DEFAULT_ACCOUNT_SECTION,
  getAccountSectionFromQuery,
  getAccountSectionMeta,
} from './accountSections.js';

assert.equal(DEFAULT_ACCOUNT_SECTION, 'overview');
assert.deepEqual(
  ACCOUNT_SECTIONS.map((section) => section.key),
  ['overview', 'workspace', 'products', 'operators', 'connections', 'billing', 'activity', 'settings']
);
assert.equal(getAccountSectionFromQuery('credits'), 'billing');
assert.equal(getAccountSectionFromQuery('history'), 'activity');
assert.equal(getAccountSectionFromQuery('memory'), 'workspace');
assert.equal(getAccountSectionFromQuery('settings'), 'settings');
assert.equal(getAccountSectionMeta('connections').label, 'Connections');

console.log('accountSections tests passed');
