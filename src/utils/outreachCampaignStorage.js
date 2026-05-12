const STORAGE_KEY = 'founder-outreach-kit:candidates';
const VALID_CHANNELS = ['email', 'linkedin'];
const VALID_STATUSES = ['draft', 'sending', 'active', 'paused', 'completed'];

function cleanText(value) {
  return String(value || '').trim();
}

function cleanArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeChannels(value) {
  return [
    ...new Set(
      cleanArray(value)
        .map((entry) => cleanText(entry).toLowerCase())
        .filter((entry) => VALID_CHANNELS.includes(entry))
    ),
  ];
}

function normalizeCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

function normalizeResults(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const status = cleanText(source.status).toLowerCase();

  return {
    status: VALID_STATUSES.includes(status) ? status : 'draft',
    sentCount: normalizeCount(source.sentCount),
    replyCount: normalizeCount(source.replyCount),
    positiveReplyCount: normalizeCount(source.positiveReplyCount),
    callsBooked: normalizeCount(source.callsBooked),
    winningAsset: cleanText(source.winningAsset),
    notes: cleanText(source.notes),
  };
}

function getStorage(storage) {
  if (
    storage &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function'
  ) {
    return storage;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
}

function createId() {
  return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCampaignRecord(record = {}) {
  const input = record && typeof record.input === 'object' && record.input ? record.input : {};
  const output = record && typeof record.output === 'object' && record.output ? record.output : {};
  const productName = cleanText(record.productName || input.productName);
  const buyerRole = cleanText(record.buyerRole || input.buyerRole);
  const targetCustomer = cleanText(record.targetCustomer || input.targetCustomer);
  const channels = normalizeChannels(record.channels || input.channels);
  const results = normalizeResults(record.results);

  return {
    ...record,
    name: cleanText(record.name) || productName || 'Untitled campaign',
    productName,
    buyerRole,
    targetCustomer,
    channels,
    results,
    updatedAt: cleanText(record.updatedAt),
    input: {
      ...input,
      productName,
      buyerRole,
      targetCustomer,
      channels,
    },
    output,
  };
}

export function createCampaignRecord({ input = {}, output = {}, results = {} }) {
  return normalizeCampaignRecord({
    id: createId(),
    name: cleanText(input.productName) || 'Untitled campaign',
    productName: cleanText(input.productName),
    buyerRole: cleanText(input.buyerRole),
    targetCustomer: cleanText(input.targetCustomer),
    channels: normalizeChannels(input.channels),
    updatedAt: new Date().toISOString(),
    input,
    output,
    results,
  });
}

export function updateSavedCampaign(storageId, updates = {}, storage) {
  const resolvedStorage = getStorage(storage);
  const next = readSavedCampaigns(resolvedStorage).map((entry) => {
    if (entry.id !== storageId) {
      return entry;
    }

    return normalizeCampaignRecord({
      ...entry,
      ...updates,
      input: updates.input ? { ...entry.input, ...updates.input } : entry.input,
      output: updates.output ? { ...entry.output, ...updates.output } : entry.output,
      results: updates.results ? { ...entry.results, ...updates.results } : entry.results,
      updatedAt: new Date().toISOString(),
    });
  });

  if (resolvedStorage) {
    writeSavedCampaigns(next, resolvedStorage);
  }

  return next;
}

export function serializeCampaigns(records = []) {
  return JSON.stringify(cleanArray(records).map((record) => normalizeCampaignRecord(record)));
}

export function deserializeCampaigns(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.map((record) => normalizeCampaignRecord(record)) : [];
  } catch {
    return [];
  }
}

export function readSavedCampaigns(storage) {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return [];
  }

  return deserializeCampaigns(resolvedStorage.getItem(STORAGE_KEY));
}

export function writeSavedCampaigns(records, storage) {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return cleanArray(records);
  }

  const normalizedRecords = cleanArray(records);
  resolvedStorage.setItem(STORAGE_KEY, serializeCampaigns(normalizedRecords));
  return normalizedRecords;
}

export function deleteSavedCampaign(storageId, storage) {
  const resolvedStorage = getStorage(storage);
  const next = readSavedCampaigns(resolvedStorage).filter((entry) => entry.id !== storageId);

  if (!resolvedStorage) {
    return next;
  }

  if (next.length === 0) {
    if (typeof resolvedStorage.removeItem === 'function') {
      resolvedStorage.removeItem(STORAGE_KEY);
    } else {
      resolvedStorage.setItem(STORAGE_KEY, serializeCampaigns([]));
    }
    return next;
  }

  writeSavedCampaigns(next, resolvedStorage);
  return next;
}
