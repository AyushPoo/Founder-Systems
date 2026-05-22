import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildConnectionCatalog } from '../../utils/integrations.js';

const panelSource = readFileSync(new URL('./ConnectionsPanel.jsx', import.meta.url), 'utf8');
const catalog = buildConnectionCatalog({
  gmail: {
    can_send: true,
    account_email: 'ayushpoojary1@gmail.com',
  },
});

assert.equal(panelSource.includes('Connections'), true);
assert.equal(panelSource.includes('Used by'), true);
assert.equal(panelSource.includes('Connected'), true);
assert.equal(panelSource.includes('Available'), true);
assert.equal(catalog.some((item) => item.name === 'Gmail'), true);
assert.equal(catalog.some((item) => item.name === 'Google Sheets'), true);
assert.equal(catalog.find((item) => item.key === 'gmail')?.status, 'connected');

console.log('ConnectionsPanel tests passed');
