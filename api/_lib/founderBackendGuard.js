import process from 'node:process';

function cleanText(value) {
  return String(value ?? '').trim();
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function resolveApiBaseUrl() {
  return (
    cleanText(process.env.FOUNDER_SYSTEMS_API_URL) ||
    cleanText(process.env.FOUNDER_API_URL) ||
    cleanText(process.env.VITE_FOUNDER_SYSTEMS_API_URL) ||
    'https://api.foundersystems.in'
  ).replace(/\/+$/, '');
}

function resolveInternalApiKey() {
  return cleanText(process.env.FS_API_KEY_INTERNAL) || cleanText(process.env.FOUNDER_SYSTEMS_INTERNAL_API_KEY);
}

function buildForwardHeaders(req) {
  return {
    cookie: cleanText(req?.headers?.cookie),
    authorization: cleanText(req?.headers?.authorization),
    origin: cleanText(req?.headers?.origin),
  };
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function postInternalAction({ path, req, payload }) {
  const apiBaseUrl = resolveApiBaseUrl();
  const apiKey = resolveInternalApiKey();

  if (!apiKey) {
    throw createHttpError(503, 'FS_API_KEY_INTERNAL is not configured.');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw createHttpError(response.status, cleanText(body?.detail || body?.reason) || 'Internal usage guard request failed.');
  }

  return body;
}

export async function resolveBackendSession({ req }) {
  const apiBaseUrl = resolveApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/auth/session`, {
    method: 'GET',
    headers: buildForwardHeaders(req),
  });

  const body = await safeJson(response);

  if (!response.ok || !body?.authenticated || !body?.user?.id) {
    throw createHttpError(401, 'Authentication required.');
  }

  return body;
}

export async function reserveAiUsage({ req, payload }) {
  const session = await resolveBackendSession({ req });
  const body = await postInternalAction({
    path: '/v1/internal/runtime/actions/reserve',
    req,
    payload: {
      ...payload,
      user_id: session.user.id,
      userId: session.user.id,
    },
  });

  if (!body?.ok) {
    throw createHttpError(403, cleanText(body?.reason) || 'Usage reserve denied.');
  }

  return { session, body };
}

export async function finalizeAiUsage({ referenceId, metadata = {}, actualInputTokens = 0, actualOutputTokens = 0 }) {
  return postInternalAction({
    path: '/v1/internal/runtime/actions/finalize',
    payload: {
      reference_id: referenceId,
      actual_input_tokens: actualInputTokens,
      actual_output_tokens: actualOutputTokens,
      metadata,
    },
  });
}

export async function releaseAiUsage({ referenceId, reason = 'released', metadata = {} }) {
  return postInternalAction({
    path: '/v1/internal/runtime/actions/release',
    payload: {
      reference_id: referenceId,
      reason,
      metadata,
    },
  });
}
