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
assert.match(parseJsonBody(invalidPayloadRes).error, /valid|supported|document/i);

const spreadsheetReq = {
  method: 'POST',
  body: {
    filename: 'annual-report.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileData:
      'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,QUJDRA==',
    fileSize: 4,
    mode: 'financial-statement',
    focus: 'Identify what changed in cash flow quality',
  },
};
const annualReportReq = {
  method: 'POST',
  body: {
    filename: 'fy25-annual-report.pdf',
    mimeType: 'application/pdf',
    fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
    fileSize: 2048,
    mode: 'annual-report',
    focus: 'Explain every important pressure point',
  },
};
let capturedRequests = [];

process.env.OPENAI_API_KEY = 'test-key';
globalThis.fetch = async (url, options = {}) => {
  capturedRequests.push({
    url,
    options,
  });

  const requestNumber = capturedRequests.length;

  if (requestNumber === 1) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          output_text: JSON.stringify({
            documentType: 'Financial statement',
            title: 'Acme annual report brief',
            mode: 'financial-statement',
            executiveSummary:
              'Revenue grew, but working-capital pressure and lower cash conversion deserve attention.',
            keyTakeaways: ['Revenue increased year over year', 'Operating margin compressed modestly'],
            riskFlags: ['Receivables grew faster than revenue'],
            focusAreas: ['Check whether cash flow from operations is trailing reported earnings.'],
            nextQuestions: ['What drove the receivables build?'],
            extractionQuality: {
              label: 'high',
              notes: ['All pages were processed cleanly.'],
            },
          }),
        };
      },
    };
  }

  if (requestNumber === 2) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          output_text: JSON.stringify({
            documentType: 'Annual report',
            title: 'FY25 annual report',
            mode: 'annual-report',
            executiveSummary:
              'The report shows solid top-line growth, but leverage, cash conversion, and note disclosures need closer review.',
            keyTakeaways: ['Revenue grew 18% year over year', 'Operating margin improved slightly'],
            riskFlags: ['Debt remains elevated against cash generation'],
            focusAreas: ['Check whether cash flow from operations is keeping pace with reported profit.'],
            nextQuestions: ['What explains the increase in leverage versus last year?'],
            extractionQuality: {
              label: 'high',
              notes: ['Core report pages were machine-readable.'],
            },
          }),
        };
      },
    };
  }

  if (requestNumber === 3) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          output_text: JSON.stringify({
            keyMetrics: [
              {
                label: 'Revenue growth',
                value: '18%',
                note: 'Year over year growth from the reported annual period.',
              },
            ],
            breakdownSections: [
              {
                title: 'Cash flow and balance sheet',
                summary: 'Cash generation improved, but leverage and working-capital usage still deserve scrutiny.',
                focusPoints: ['Compare debt maturities against operating cash flow coverage.'],
              },
            ],
          }),
        };
      },
    };
  }

  return {
    ok: true,
    status: 200,
    async json() {
      return { output_text: '{}' };
    },
  };
};

const successRes = createResponse();
await handler(spreadsheetReq, successRes);
const annualReportRes = createResponse();
await handler(annualReportReq, annualReportRes);

if (typeof originalApiKey === 'undefined') {
  delete process.env.OPENAI_API_KEY;
} else {
  process.env.OPENAI_API_KEY = originalApiKey;
}
globalThis.fetch = originalFetch;

assert.equal(successRes.statusCode, 200);

const successPayload = parseJsonBody(successRes);
assert.equal(successPayload.ok, true);
assert.equal(successPayload.mode, 'financial-statement');
assert.equal(successPayload.documentType, 'Financial statement');
assert.equal(successPayload.title, 'Acme annual report brief');
assert.equal(successPayload.extractionQuality.label, 'high');
assert.deepEqual(successPayload.keyTakeaways, ['Revenue increased year over year', 'Operating margin compressed modestly']);
assert.deepEqual(successPayload.focusAreas, ['Check whether cash flow from operations is trailing reported earnings.']);

assert.equal(capturedRequests[0].url, 'https://api.openai.com/v1/responses');
assert.equal(capturedRequests[0].options.method, 'POST');

const parsedBody = JSON.parse(capturedRequests[0].options.body);
assert.equal(parsedBody.model, 'gpt-4o-mini');
assert.equal(parsedBody.input[1].content[0].type, 'input_file');
assert.equal(parsedBody.input[1].content[0].filename, 'annual-report.xlsx');
assert.equal(
  parsedBody.input[1].content[0].file_data,
  'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,QUJDRA=='
);

assert.equal(annualReportRes.statusCode, 200);
const annualReportPayload = parseJsonBody(annualReportRes);
assert.equal(annualReportPayload.ok, true);
assert.equal(annualReportPayload.mode, 'annual-report');
assert.equal(annualReportPayload.keyMetrics.length, 1);
assert.equal(annualReportPayload.breakdownSections.length, 1);
assert.equal(
  annualReportPayload.breakdownSections[0].title,
  'Cash flow and balance sheet'
);
assert.equal(capturedRequests.length, 3);

console.log('founder-pdf-summarize API tests passed');
