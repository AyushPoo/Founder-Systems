import assert from 'assert';
import { buildOutreachCsvRows, buildOutreachCsvString } from './outreachCampaignExport.js';

const rows = buildOutreachCsvRows({
  emails: [
    { step: 1, title: 'Email 1', subject: 'Subject 1', body: 'Body 1', delayDays: -3 },
  ],
  linkedinMessages: [
    { step: 'follow_up_dm', body: 'LinkedIn body' },
  ],
});

assert.equal(rows.length, 2);
assert.equal(rows[0].channel, 'email');
assert.equal(rows[1].channel, 'linkedin');
assert.equal(rows[0].step, 'email_1');
assert.equal(rows[0].delay_days, 0);

const csv = buildOutreachCsvString(rows);
assert.match(csv, /step,channel,subject,body,delay_days,goal/);
assert.match(csv, /Email 1/);

const escapedCsv = buildOutreachCsvString([
  {
    step: 'email_2',
    channel: 'email',
    subject: 'Hello, "founder"',
    body: 'Line 1\nLine 2',
    delay_days: 2,
    goal: 'Get reply',
  },
]);

assert.match(escapedCsv, /"Hello, ""founder"""/);
assert.match(escapedCsv, /"Line 1\nLine 2"/);

console.log('outreachCampaignExport tests passed');
