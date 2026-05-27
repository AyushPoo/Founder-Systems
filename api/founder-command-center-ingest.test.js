import assert from 'node:assert/strict';
import handler from './founder-command-center-ingest.js';

async function run() {
  const req = {
    method: 'POST',
    body: {
      files: [
        {
          filename: 'qa-metrics.csv',
          mimeType: 'text/csv',
          fileSize: 2048,
          fileData: 'data:text/csv;base64,bWV0cmljLG1heV8yMDI2Ck1SUiQ0N2sKQnVybixAJDM1LjVr',
        },
      ],
      notes: 'QA note: renewal slipped into June.',
    },
  };

  let statusCode = 200;
  let jsonPayload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonPayload = payload;
      return this;
    },
    setHeader() {},
  };

  await handler(req, res);

  assert.equal(statusCode, 200);
  assert.equal(Array.isArray(jsonPayload.findings), true);
  assert.equal(Array.isArray(jsonPayload.memoryCandidates), true);
  assert.equal(typeof jsonPayload.companySummary, 'string');
  assert.match(jsonPayload.companySummary, /qa-metrics\.csv/i);
  assert.match(jsonPayload.companySummary, /MRR|source preview/i);
  assert.equal(jsonPayload.findings[0].confidence, 'inferred');
}

run().then(() => console.log('founder-command-center-ingest API tests passed'));
