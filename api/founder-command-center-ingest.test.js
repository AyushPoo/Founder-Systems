import assert from 'node:assert/strict';
import handler from './founder-command-center-ingest.js';

async function run() {
  const req = {
    method: 'POST',
    body: {
      files: [
        {
          name: 'runway.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 2048,
        },
      ],
      notes: 'Latest finance snapshot and board summary.',
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
}

run().then(() => console.log('founder-command-center-ingest API tests passed'));
