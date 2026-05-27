import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const routeSource = readFileSync(new URL('./InternalProductRoute.jsx', import.meta.url), 'utf8');

assert.equal(routeSource.includes('const { loadingSession, user } = useFounderWorkspace();'), true);
assert.equal(routeSource.includes('if (loadingSession)'), true);
assert.equal(routeSource.includes('Checking tool access'), true);

console.log('InternalProductRoute tests passed');
