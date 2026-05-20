import assert from 'assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeApiHandler, resolveApiHandlerModule } from './apiDevServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writableEnded: false,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload) {
      this.body = String(payload ?? '');
      this.writableEnded = true;
    },
  };
}

const screenerModulePath = resolveApiHandlerModule('/api/linkedin-candidate-screener', rootDir);
assert.equal(
  screenerModulePath,
  path.join(rootDir, 'api', 'linkedin-candidate-screener.js')
);

assert.equal(resolveApiHandlerModule('/api/does-not-exist', rootDir), null);
assert.equal(resolveApiHandlerModule('/products/linkedin-candidate-screener', rootDir), null);

const validationRes = createResponse();
await executeApiHandler({
  rootDir,
  pathname: '/api/linkedin-candidate-screener',
  method: 'POST',
  body: {
    jobDescription: '',
    profile: {},
  },
  res: validationRes,
});

assert.equal(validationRes.statusCode, 400);
assert.match(validationRes.body, /provide a job description and a visible linkedin profile/i);

const stringBodyRes = createResponse();
await executeApiHandler({
  rootDir,
  pathname: '/api/linkedin-candidate-screener',
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    jobDescription: 'Founding AE',
    profile: {
      fullName: 'Nina Cole',
      headline: 'Account Executive at SaaSCo',
    },
  }),
  res: stringBodyRes,
});

assert.equal(stringBodyRes.statusCode, 200);
assert.match(stringBodyRes.body, /candidateSummary/i);

console.log('apiDevServer tests passed');
