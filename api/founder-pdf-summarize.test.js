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
const originalApiKey = process.env.AWS_BEARER_TOKEN_BEDROCK;
const originalInternalApiKey = process.env.FS_API_KEY_INTERNAL;

delete process.env.AWS_BEARER_TOKEN_BEDROCK;
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
assert.match(parseJsonBody(missingKeyRes).error, /aws_bearer_token_bedrock/i);

globalThis.fetch = async (url) => {
  if (String(url).endsWith('/auth/session')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { authenticated: true, user: { id: 'user_document_fallback' } };
      },
    };
  }

  throw new Error(`Unexpected fallback request: ${url}`);
};

const missingRuntimeWorkspaceReq = {
  method: 'POST',
  headers: { cookie: 'session=document-fallback-test' },
  body: {
    files: [
      {
        filename: 'metrics.csv',
        mimeType: 'text/csv',
        fileData: `data:text/csv;base64,${Buffer.from('metric,value\nMRR,47000\nCash Balance,281500').toString('base64')}`,
        fileSize: 44,
      },
    ],
    focus: 'Identify cash pressure and evidence gaps.',
  },
};
const missingRuntimeWorkspaceRes = createResponse();
await handler(missingRuntimeWorkspaceReq, missingRuntimeWorkspaceRes);

assert.equal(missingRuntimeWorkspaceRes.statusCode, 200, missingRuntimeWorkspaceRes.body);
const missingRuntimeWorkspacePayload = parseJsonBody(missingRuntimeWorkspaceRes);
assert.equal(missingRuntimeWorkspacePayload.runtime.fallbackUsed, true);
assert.match(missingRuntimeWorkspacePayload.overallRead, /lower-confidence|runtime/i);
assert.match(missingRuntimeWorkspacePayload.extractionNotes[0], /aws_bearer_token_bedrock/i);
assert.equal(missingRuntimeWorkspacePayload.fileAnalyses[0].filename, 'metrics.csv');
assert.match(missingRuntimeWorkspacePayload.fileAnalyses[0].summary, /MRR|readable/i);

globalThis.fetch = async (url) => {
  if (String(url).endsWith('/auth/session')) {
    return {
      ok: false,
      status: 401,
      async json() {
        return { authenticated: false };
      },
    };
  }

  throw new Error(`Unexpected unauthenticated fallback request: ${url}`);
};

const unauthorizedFallbackWorkspaceRes = createResponse();
await handler(missingRuntimeWorkspaceReq, unauthorizedFallbackWorkspaceRes);
assert.equal(unauthorizedFallbackWorkspaceRes.statusCode, 401);
assert.match(parseJsonBody(unauthorizedFallbackWorkspaceRes).error, /authentication required/i);
globalThis.fetch = originalFetch;

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
  headers: {
    'x-forwarded-for': 'single-summary-test',
  },
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
  headers: {
    'x-forwarded-for': 'single-summary-test',
  },
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

process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';
process.env.FS_API_KEY_INTERNAL = 'internal-test-key';
globalThis.fetch = async (url, options = {}) => {
  if (String(url).endsWith('/auth/session')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          authenticated: true,
          user: { id: 'user_test_123' },
        };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/reserve')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          ok: true,
          reference_id: `reserve-doc-test-${capturedRequests.length + 1}`,
        };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/finalize')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true };
      },
    };
  }

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
  delete process.env.AWS_BEARER_TOKEN_BEDROCK;
} else {
  process.env.AWS_BEARER_TOKEN_BEDROCK = originalApiKey;
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

assert.match(capturedRequests[0].url, /bedrock-runtime\..+\/model\/.+\/converse$/i);
assert.equal(capturedRequests[0].options.method, 'POST');

const parsedBody = JSON.parse(capturedRequests[0].options.body);
assert.equal(parsedBody.inferenceConfig.maxTokens, 950);
assert.equal(parsedBody.messages[0].content[0].text.includes('Analyze this founder document for decision-making.'), true);
assert.equal(parsedBody.messages[0].content[1].document.format, 'xlsx');
assert.equal(parsedBody.messages[0].content[1].document.source.bytes, 'QUJDRA==');

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

let workspaceCapturedRequests = [];

process.env.AWS_BEARER_TOKEN_BEDROCK = 'test-key';
globalThis.fetch = async (url, options = {}) => {
  if (String(url).endsWith('/auth/session')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          authenticated: true,
          user: { id: 'user_test_123' },
        };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/reserve')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          ok: true,
          reference_id: `reserve-workspace-test-${workspaceCapturedRequests.length + 1}`,
        };
      },
    };
  }

  if (String(url).includes('/v1/internal/runtime/actions/finalize')) {
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true };
      },
    };
  }

  workspaceCapturedRequests.push({
    url,
    options,
  });

  const requestNumber = workspaceCapturedRequests.length;

  if (requestNumber === 1) {
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          output_text: JSON.stringify({
            documentType: 'Pitch deck',
            title: 'Seed deck readout',
            mode: 'pitch-deck',
            executiveSummary: 'The deck tells a compelling story, but proof is thinner than the narrative suggests.',
            keyTakeaways: ['The positioning is crisp.', 'The traction proof is still light.'],
            riskFlags: ['Retention evidence is not shown.'],
            focusAreas: ['Add harder proof behind repeat usage claims.'],
            nextQuestions: ['What data supports retention and expansion?'],
            extractionQuality: {
              label: 'high',
              notes: ['The deck text was machine-readable.'],
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
            documentType: 'Financial statement',
            title: 'Board model readout',
            mode: 'financial-statement',
            executiveSummary:
              'The spreadsheet shows margin pressure and weaker cash conversion than the deck implies.',
            keyTakeaways: ['Revenue is still growing.', 'Gross margin assumptions are lower than the deck claims.'],
            riskFlags: ['Cash conversion is lagging reported growth.'],
            focusAreas: ['Reconcile gross margin and cash conversion claims with the deck.'],
            nextQuestions: ['Which gross margin number is the current source of truth?'],
            keyMetrics: [
              {
                label: 'Gross margin',
                value: '64%',
                note: 'Model-implied blended gross margin.',
              },
            ],
            extractionQuality: {
              label: 'mixed',
              notes: ['One sheet tab had minimal labels.'],
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
            workspaceTitle: 'Founder document workspace',
            filesAnalyzed: ['seed-deck.pdf', 'board-model.xlsx'],
            overallRead: 'The fundraising story is promising, but the files conflict on operating quality.',
            whatMattersMost: ['The deck and model disagree on gross margin and cash quality.'],
            contradictions: ['Deck implies about 80% gross margin while the spreadsheet supports about 64%.'],
            missingProof: ['No retention evidence is included in the upload set.'],
            watchouts: ['The narrative is outrunning hard operating proof.'],
            priorityQuestions: ['Which margin figure is the current source of truth?'],
            nextActions: ['Reconcile the deck and model before sharing externally.'],
            extractionNotes: ['One spreadsheet tab had sparse labels.'],
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

const workspaceReq = {
  method: 'POST',
  headers: {
    'x-forwarded-for': 'workspace-summary-test',
  },
  body: {
    files: [
      {
        filename: 'seed-deck.pdf',
        mimeType: 'application/pdf',
        fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
        fileSize: 2048,
      },
      {
        filename: 'board-model.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileData:
          'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,QUJDRA==',
        fileSize: 4,
      },
    ],
    focus: 'Find contradictions and missing proof.',
  },
};
const workspaceRes = createResponse();
await handler(workspaceReq, workspaceRes);

if (typeof originalApiKey === 'undefined') {
  delete process.env.AWS_BEARER_TOKEN_BEDROCK;
} else {
  process.env.AWS_BEARER_TOKEN_BEDROCK = originalApiKey;
}
if (typeof originalInternalApiKey === 'undefined') {
  delete process.env.FS_API_KEY_INTERNAL;
} else {
  process.env.FS_API_KEY_INTERNAL = originalInternalApiKey;
}
globalThis.fetch = originalFetch;

assert.equal(workspaceRes.statusCode, 200);

const workspacePayload = parseJsonBody(workspaceRes);
assert.equal(workspacePayload.ok, true);
assert.equal(workspacePayload.fileAnalyses.length, 2);
assert.equal(workspacePayload.fileAnalyses[0].detectedType, 'pitch-deck');
assert.equal(workspacePayload.fileAnalyses[1].detectedType, 'financial-statement');
assert.equal(workspacePayload.contradictions.length, 1);
assert.equal(workspacePayload.nextActions.length, 1);
assert.match(workspacePayload.nextActions[0], /reconcile/i);
assert.equal(workspaceCapturedRequests.length, 3);

const synthesisBody = JSON.parse(workspaceCapturedRequests[2].options.body);
assert.equal(synthesisBody.messages[0].content[0].text.includes('fileAnalyses'), true);

console.log('founder-pdf-summarize API tests passed');
