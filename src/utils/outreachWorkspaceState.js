import { createOutreachInputSignature } from './outreachCampaign.js';

export function isOutreachResultCurrent({ draft, result }) {
  if (!result?.normalizedInput) {
    return false;
  }

  return (
    createOutreachInputSignature(draft) ===
    createOutreachInputSignature(result.normalizedInput)
  );
}

export function getOutreachActionGuard({ draft, result }) {
  if (!result) {
    return { canUse: false, reason: 'missing_result' };
  }

  if (!isOutreachResultCurrent({ draft, result })) {
    return { canUse: false, reason: 'stale_result' };
  }

  return { canUse: true, reason: 'ready' };
}

export function getOutreachSaveGuard({ draft, result }) {
  if (!result) {
    return { canSave: false, reason: 'missing_result' };
  }

  if (!isOutreachResultCurrent({ draft, result })) {
    return { canSave: false, reason: 'stale_result' };
  }

  return { canSave: true, reason: 'ready' };
}

export function createOutreachGenerationTracker(state = {}) {
  const requestId = Number(state.latestRequestId || 0) + 1;

  return {
    requestId,
    state: {
      latestRequestId: requestId,
    },
  };
}

export function invalidateOutreachGenerationTracker(state = {}) {
  return createOutreachGenerationTracker(state).state;
}

export function canApplyOutreachGenerationResult(state = {}, requestId) {
  return Number(requestId) > 0 && Number(state.latestRequestId || 0) === Number(requestId);
}

export function getSavedCampaignStatus({
  campaign,
  currentSavedCampaignId = '',
  draft,
  result,
}) {
  const isActive = Boolean(campaign?.id) && campaign.id === currentSavedCampaignId;

  if (!isActive) {
    return {
      isActive: false,
      isFresh: false,
      label: '',
    };
  }

  const isDraftMatch =
    createOutreachInputSignature(draft) === createOutreachInputSignature(campaign?.input || {});
  const isFresh = isDraftMatch && isOutreachResultCurrent({ draft, result });

  return {
    isActive: true,
    isFresh,
    label: isFresh ? 'Current' : 'Loaded stale',
  };
}

export function startAttachmentOperation(state = {}, attachmentIds = []) {
  const operationId = Number(state.intentVersion || 0) + 1;
  const latestIntentById = { ...(state.latestIntentById || {}) };

  attachmentIds.forEach((id) => {
    latestIntentById[id] = operationId;
  });

  return {
    operationId,
    state: {
      intentVersion: operationId,
      latestIntentById,
    },
  };
}

export function mergeCompletedAttachmentOperation({
  state = {},
  attachments = [],
  operationId,
  entries = [],
  maxAttachments = 4,
}) {
  const latestIntentById = state.latestIntentById || {};
  const next = [...attachments];

  entries.forEach((entry) => {
    if (latestIntentById[entry.id] !== operationId) {
      return;
    }

    if (!next.some((item) => item.id === entry.id)) {
      next.push(entry);
    }
  });

  return next.slice(0, maxAttachments);
}

export function removeAttachmentWithIntent(state = {}, attachments = [], attachmentId) {
  const nextOperation = startAttachmentOperation(state, [attachmentId]);

  return {
    operationId: nextOperation.operationId,
    state: nextOperation.state,
    attachments: attachments.filter((entry) => entry.id !== attachmentId),
  };
}
