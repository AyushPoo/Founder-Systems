import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shellSource = readFileSync(new URL('./AccountSettingsShell.jsx', import.meta.url), 'utf8');

assert.equal(shellSource.includes('Workspace settings'), true);
assert.equal(shellSource.includes('xl:grid-cols-[220px_minmax(0,1fr)]'), true);
assert.equal(shellSource.includes('activeSection === section.key'), true);

console.log('AccountSettingsShell tests passed');
