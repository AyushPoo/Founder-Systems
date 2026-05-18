import assert from 'assert';
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'events';
import process from 'node:process';
import { MAX_PDF_SIZE_BYTES } from '../src/utils/founderPdfSummary.js';
import handler from './founder-pdf-summarize.js';

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

const malformedReq = createStreamingRequest('{"filename":"deck.pdf"');
const malformedRes = createResponse();
await handler(malformedReq, malformedRes);

assert.equal(malformedRes.statusCode, 400);
assert.match(parseJsonBody(malformedRes).error, /invalid json|malformed json|parse/i);

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENAI_API_KEY;

delete process.env.OPENAI_API_KEY;
const missingKeyReq = {
  method: 'POST',
  body: {
    filename: 'deck.pdf',
    mimeType: 'application/pdf',
    fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
    fileSize: 2048,
    mode: 'pitch-deck',
    focus: 'Focus on traction clarity',
  },
};
const missingKeyRes = createResponse();
await handler(missingKeyReq, missingKeyRes);

assert.equal(missingKeyRes.statusCode, 503);
assert.match(parseJsonBody(missingKeyRes).error, /openai_api_key/i);

const oversizedPayloadReq = {
  method: 'POST',
  body: {
    filename: 'deck.pdf',
    mimeType: 'application/pdf',
    fileData: `data:application/pdf;base64,${Buffer.alloc(MAX_PDF_SIZE_BYTES + 1).toString('base64')}`,
    fileSize: 1,
    mode: 'pitch-deck',
    focus: 'Focus on traction clarity',
  },
};
const oversizedPayloadRes = createResponse();
await handler(oversizedPayloadReq, oversizedPayloadRes);

assert.equal(oversizedPayloadRes.statusCode, 400);
assert.match(parseJsonBody(oversizedPayloadRes).error, /smaller than/i);

const invalidPayloadReq = {
  method: 'POST',
  body: {
    filename: 'deck.pdf',
    mimeType: 'application/pdf',
    fileData: 'data:text/plain;base64,SGVsbG8=',
    fileSize: 8,
    mode: 'pitch-deck',
    focus: 'Focus on traction clarity',
  },
};
const invalidPayloadRes = createResponse();
await handler(invalidPayloadReq, invalidPayloadRes);

assert.equal(invalidPayloadRes.statusCode, 400);
assert.match(parseJsonBody(invalidPayloadRes).error, /pdf/i);
let capturedRequest = null;

process.env.OPENAI_API_KEY = 'test-key';
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
          documentType: 'Pitch deck',
          title: 'Acme seed deck',
          mode: 'pitch-deck',
          executiveSummary: 'The deck is clear on the problem and product, but it needs harder proof on traction.',
          keyTakeaways: ['Problem framing is strong', 'Traction evidence is still light'],
          riskFlags: ['Metrics slide lacks dated benchmarks'],
          nextQuestions: ['What month-over-month retention evidence exists?'],
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
    filename: 'deck.pdf',
    mimeType: 'application/pdf',
    fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
    fileSize: 2048,
    mode: 'pitch-deck',
    focus: 'Focus on traction clarity',
  },
};
const successRes = createResponse();
await handler(successReq, successRes);

if (typeof originalApiKey === 'undefined') {
  delete process.env.OPENAI_API_KEY;
} else {
  process.env.OPENAI_API_KEY = originalApiKey;
}
globalThis.fetch = originalFetch;

assert.equal(successRes.statusCode, 200);

const successPayload = parseJsonBody(successRes);
assert.equal(successPayload.ok, true);
assert.equal(successPayload.mode, 'pitch-deck');
assert.equal(successPayload.documentType, 'Pitch deck');
assert.equal(successPayload.title, 'Acme seed deck');
assert.equal(successPayload.extractionQuality.label, 'high');
assert.deepEqual(successPayload.keyTakeaways, ['Problem framing is strong', 'Traction evidence is still light']);

assert.equal(capturedRequest.url, 'https://api.openai.com/v1/responses');
assert.equal(capturedRequest.options.method, 'POST');

const parsedBody = JSON.parse(capturedRequest.options.body);
assert.equal(parsedBody.model, 'gpt-4o-mini');
assert.equal(parsedBody.input[1].content[0].type, 'input_file');
assert.equal(parsedBody.input[1].content[0].filename, 'deck.pdf');
assert.equal(parsedBody.input[1].content[0].file_data, 'data:application/pdf;base64,JVBERi0xLjQK');

console.log('founder-pdf-summarize API tests passed');
