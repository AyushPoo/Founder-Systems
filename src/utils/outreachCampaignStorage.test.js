import assert from 'assert';
import {
  createCampaignRecord,
  serializeCampaigns,
  deserializeCampaigns,
  readSavedCampaigns,
  updateSavedCampaign,
  writeSavedCampaigns,
  deleteSavedCampaign,
} from './outreachCampaignStorage.js';
import { buildOutreachMemorySummary } from './outreachMemory.js';

const record = createCampaignRecord({
  input: {
    productName: 'Founder Outreach Kit',
    buyerRole: 'Founder',
    targetCustomer: 'Solo SaaS founders',
    channels: ['Email', 'linkedin', 'EMAIL', 'sms'],
  },
  output: { emails: [] },
});

assert.equal(record.name, 'Founder Outreach Kit');
assert.equal(record.channels[0], 'email');
assert.deepEqual(record.channels, ['email', 'linkedin']);
assert.equal(typeof record.id, 'string');
assert.equal(typeof record.updatedAt, 'string');
assert.equal(record.results.status, 'draft');
assert.equal(record.results.sentCount, 0);

const payload = serializeCampaigns([record]);
const restored = deserializeCampaigns(payload);
assert.equal(restored.length, 1);
assert.equal(restored[0].buyerRole, 'Founder');
assert.equal(restored[0].results.status, 'draft');
assert.deepEqual(deserializeCampaigns('{'), []);

const memoryStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  },
  setItem(key, value) {
    this.store.set(key, String(value));
  },
  removeItem(key) {
    this.store.delete(key);
  },
};

writeSavedCampaigns([record], memoryStorage);
assert.equal(readSavedCampaigns(memoryStorage).length, 1);

const updatedRecords = updateSavedCampaign(
  record.id,
  {
    results: {
      status: 'sending',
      sentCount: '120',
      replyCount: '19',
      positiveReplyCount: '5',
      callsBooked: '2',
      winningAsset: 'Email 2',
      notes: 'Warm tone got more replies.',
    },
  },
  memoryStorage
);

assert.equal(updatedRecords[0].results.status, 'sending');
assert.equal(updatedRecords[0].results.sentCount, 120);
assert.equal(updatedRecords[0].results.replyCount, 19);
assert.equal(updatedRecords[0].results.positiveReplyCount, 5);
assert.equal(updatedRecords[0].results.callsBooked, 2);
assert.equal(updatedRecords[0].results.winningAsset, 'Email 2');
assert.equal(updatedRecords[0].results.notes, 'Warm tone got more replies.');

const afterDelete = deleteSavedCampaign(record.id, memoryStorage);
assert.equal(afterDelete.length, 0);
assert.equal(readSavedCampaigns(memoryStorage).length, 0);
assert.deepEqual(readSavedCampaigns(), []);

const noRemoveStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  },
  setItem(key, value) {
    this.store.set(key, String(value));
  },
};

const secondRecord = createCampaignRecord({
  input: {
    productName: 'Outbound Engine',
    buyerRole: 'Founder',
    targetCustomer: 'Agencies',
    channels: ['LINKEDIN', 'linkedin', 'Email'],
  },
  output: {},
});

assert.deepEqual(secondRecord.channels, ['linkedin', 'email']);
assert.equal(writeSavedCampaigns([secondRecord], noRemoveStorage).length, 1);
assert.equal(readSavedCampaigns(noRemoveStorage).length, 1);
assert.deepEqual(deleteSavedCampaign(secondRecord.id, noRemoveStorage), []);
assert.equal(readSavedCampaigns(noRemoveStorage).length, 0);

const memorySummary = buildOutreachMemorySummary([
  updatedRecords[0],
  createCampaignRecord({
    input: {
      productName: 'Founder Outreach Kit',
      buyerRole: 'Founder',
      targetCustomer: 'AI agency owners',
      channels: ['email'],
    },
    output: {},
    results: {
      status: 'completed',
      sentCount: 80,
      replyCount: 14,
      positiveReplyCount: 4,
      callsBooked: 3,
      winningAsset: 'Pain-led angle',
      notes: '',
    },
  }),
]);

assert.equal(memorySummary.totalCampaigns, 2);
assert.equal(memorySummary.totalSentCount, 200);
assert.equal(memorySummary.totalReplyCount, 33);
assert.equal(memorySummary.totalPositiveReplyCount, 9);
assert.equal(memorySummary.totalCallsBooked, 5);
assert.equal(memorySummary.topOffers[0].label, 'Founder Outreach Kit');
assert.equal(memorySummary.topOffers[0].campaignCount, 2);
assert.equal(memorySummary.topAudiences.length, 2);
assert.equal(
  memorySummary.topAudiences.some((entry) => entry.label === 'Solo SaaS founders'),
  true
);
assert.equal(memorySummary.topWinningAssets[0].label, 'Email 2');

console.log('outreachCampaignStorage tests passed');
