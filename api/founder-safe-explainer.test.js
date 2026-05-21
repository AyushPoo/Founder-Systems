import assert from 'assert';
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'events';
import process from 'node:process';
import { MAX_SAFE_EXPLAINER_PDF_SIZE_BYTES } from '../src/utils/founderSafeExplainer.js';
import handler from './founder-safe-explainer.js';

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload) {
      this.body = String(payload ?? '');
    },
  };
}

function createStreamingRequest(bodyText) {
  const req = new EventEmitter();
  req.method = 'POST';
  process.nextTick(() => {
    if (bodyText) {
      req.emit('data', Buffer.from(bodyText));
    }
    req.emit('end');
  });
  return req;
}

function parseJsonBody(res) {
  return JSON.parse(res.body);
}

const malformedReq = createStreamingRequest('{"filename":"seed-safe.pdf"');
const malformedRes = createResponse();
await handler(malformedReq, malformedRes);

assert.equal(malformedRes.statusCode, 400);
assert.match(parseJsonBody(malformedRes).error, /invalid json|malformed json|parse/i);

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.AWS_BEARER_TOKEN_BEDROCK;

delete process.env.AWS_BEARER_TOKEN_BEDROCK;
const missingKeyReq = {
  method: 'POST',
  body: {
    filename: 'seed-safe.pdf',
    mimeType: 'application/pdf',
    fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
    fileSize: 2048,
    mode: 'safe',
    roundContext: 'Pre-seed',
    focus: 'Flag control terms',
  },
};
const missingKeyRes = createResponse();
await handler(missingKeyReq, missingKeyRes);

assert.equal(missingKeyRes.statusCode, 503);
assert.match(parseJsonBody(missingKeyRes).error, /aws_bearer_token_bedrock/i);

const oversizedPayloadReq = {
  method: 'POST',
  body: {
    filename: 'seed-safe.pdf',
    mimeType: 'application/pdf',
    fileData: `data:application/pdf;base64,${Buffer.alloc(MAX_SAFE_EXPLAINER_PDF_SIZE_BYTES + 1).toString('base64')}`,
    fileSize: 1,
    mode: 'safe',
    roundContext: 'Pre-seed',
    focus: 'Flag control terms',
  },
};
const oversizedPayloadRes = createResponse();
await handler(oversizedPayloadReq, oversizedPayloadRes);

assert.equal(oversizedPayloadRes.statusCode, 400);
assert.match(parseJsonBody(oversizedPayloadRes).error, /smaller than/i);

let capturedRequest = null;

process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';
globalThis.fetch = async (url, options = {}) => {
  capturedRequest = {
    url,
    options,
  };

  return {
    ok: true,
    status: 200,
    async json() {
      return {
        output_text: JSON.stringify({
          documentType: 'SAFE',
          title: 'Acme SAFE explainer',
          mode: 'safe',
          summary: 'This SAFE is standard on headline economics, but one side letter expands investor rights.',
          clauseHighlights: [
            {
              clause: 'Valuation cap',
              value: '$10M',
              explanation: 'The investor converts at a price no worse than a $10M valuation.',
              founderImpact: 'A lower cap means more dilution for founders if the next round is priced higher.',
            },
          ],
          founderWatchouts: ['The MFN clause could import more aggressive later terms.'],
          unusualClauses: ['A board observer right appears in a side letter.'],
          counselQuestions: ['Should the board observer right terminate automatically after the next round?'],
          extractionQuality: {
            label: 'high',
            notes: ['All pages were processed cleanly.'],
          },
        }),
      };
    },
  };
};

const successReq = {
  method: 'POST',
  body: {
    filename: 'seed-safe.pdf',
    mimeType: 'application/pdf',
    fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
    fileSize: 2048,
    mode: 'safe',
    roundContext: 'Pre-seed extension',
    focus: 'Flag control terms',
  },
};
const successRes = createResponse();
await handler(successReq, successRes);

if (typeof originalApiKey === 'undefined') {
  delete process.env.AWS_BEARER_TOKEN_BEDROCK;
} else {
  process.env.AWS_BEARER_TOKEN_BEDROCK = originalApiKey;
}
globalThis.fetch = originalFetch;

assert.equal(successRes.statusCode, 200);

const successPayload = parseJsonBody(successRes);
assert.equal(successPayload.ok, true);
assert.equal(successPayload.mode, 'safe');
assert.equal(successPayload.documentType, 'SAFE');
assert.equal(successPayload.title, 'Acme SAFE explainer');
assert.equal(successPayload.clauseHighlights.length, 1);
assert.match(successPayload.disclaimer, /not legal advice/i);

assert.match(capturedRequest.url, /bedrock-runtime\..+\/model\/.+\/converse$/i);
assert.equal(capturedRequest.options.method, 'POST');

const parsedBody = JSON.parse(capturedRequest.options.body);
assert.equal(parsedBody.inferenceConfig.maxTokens, 900);
assert.equal(parsedBody.messages[0].content[0].text.includes('Explain this startup financing PDF for a founder.'), true);
assert.equal(parsedBody.messages[0].content[1].document.format, 'pdf');
assert.equal(parsedBody.messages[0].content[1].document.source.bytes, 'JVBERi0xLjQK');

console.log('founder-safe-explainer API tests passed');
