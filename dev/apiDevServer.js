import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { pathToFileURL } from 'node:url';

function cleanPathname(pathname) {
  return String(pathname || '').split('?')[0].trim();
}

function isSafeRouteSegment(segment) {
  return /^[a-z0-9/_-]+$/i.test(segment) && !segment.includes('..');
}

async function loadApiHandler(modulePath) {
  const stats = await fs.promises.stat(modulePath);
  const moduleUrl = `${pathToFileURL(modulePath).href}?mtime=${stats.mtimeMs}`;
  const imported = await import(moduleUrl);
  return imported?.default;
}

async function readIncomingBody(req) {
  if (typeof req?.body === 'string') {
    return parseIncomingBody(req.body, req?.headers);
  }

  if (req?.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return parseIncomingBody(Buffer.concat(chunks).toString('utf8'), req?.headers);
}

function parseIncomingBody(body, headers = {}) {
  const text = String(body ?? '').trim();
  if (!text) {
    return '';
  }

  const headerMap = headers && typeof headers === 'object' ? headers : {};
  const contentType =
    headerMap['content-type'] ||
    headerMap['Content-Type'] ||
    headerMap['CONTENT-TYPE'] ||
    '';

  const looksJson =
    String(contentType).toLowerCase().includes('application/json') ||
    text.startsWith('{') ||
    text.startsWith('[');

  if (!looksJson) {
    return text;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function writeJson(res, statusCode, body) {
  res.statusCode = statusCode;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
  }
  if (!res.writableEnded) {
    res.end(JSON.stringify(body));
  }
}

export function resolveApiHandlerModule(pathname, rootDir = process.cwd()) {
  const cleanPath = cleanPathname(pathname);
  if (!cleanPath.startsWith('/api/')) {
    return null;
  }

  const routePath = cleanPath.slice('/api/'.length).replace(/^\/+|\/+$/g, '');
  if (!routePath || !isSafeRouteSegment(routePath)) {
    return null;
  }

  const modulePath = path.join(rootDir, 'api', `${routePath}.js`);
  return fs.existsSync(modulePath) ? modulePath : null;
}

export async function executeApiHandler({
  rootDir = process.cwd(),
  pathname,
  method = 'GET',
  body,
  headers = {},
  req = null,
  res,
}) {
  const modulePath = resolveApiHandlerModule(pathname, rootDir);
  if (!modulePath) {
    return false;
  }

  const handler = await loadApiHandler(modulePath);
  if (typeof handler !== 'function') {
    throw new Error(`API module "${modulePath}" does not export a default handler.`);
  }

  const request = req || {
    method,
    headers,
    body,
    on() {},
  };

  if (typeof request.method === 'undefined') {
    request.method = method;
  }
  if (typeof request.headers === 'undefined') {
    request.headers = headers;
  }
  if (typeof body !== 'undefined' && typeof request.body === 'undefined') {
    request.body = body;
  }

  await handler(request, res);
  return true;
}

export function createApiDevMiddlewarePlugin({ rootDir = process.cwd() } = {}) {
  return {
    name: 'founder-systems-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = cleanPathname(req.url);
        if (!pathname.startsWith('/api/')) {
          next();
          return;
        }

        const modulePath = resolveApiHandlerModule(pathname, rootDir);
        if (!modulePath) {
          next();
          return;
        }

        (async () => {
          if (typeof req.body === 'undefined') {
            req.body = await readIncomingBody(req);
          }

          await executeApiHandler({
            rootDir,
            pathname,
            req,
            res,
          });

          if (!res.writableEnded) {
            res.end();
          }
        })().catch((error) => {
          writeJson(res, 500, {
            ok: false,
            error: String(error?.message || 'Local API handler failed.'),
          });
        });
      });
    },
  };
}
