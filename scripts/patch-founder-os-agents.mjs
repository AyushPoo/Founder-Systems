import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRoot, '..', 'env');
const backupDir = path.resolve(projectRoot, '..', 'tmp', 'agent-workflow-backups');
const cmoTemplatePath = path.join(__dirname, 'agent-templates', 'cmo-build-draft.js');
const seoTemplatePath = path.join(__dirname, 'agent-templates', 'seo-build-digest.js');

const WORKFLOW_IDS = {
  cmo: 'FsCmoScheduled01',
  seo: 'FsSeoDigest01',
};

function parseEnvFile(raw) {
  const values = {};
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return;
    }

    const [key, ...rest] = trimmed.split('=');
    values[key] = rest.join('=');
  });
  return values;
}

async function loadEnv() {
  const raw = await fs.readFile(envPath, 'utf8');
  return parseEnvFile(raw);
}

async function loadTemplateCode() {
  const [cmoCode, seoCode] = await Promise.all([
    fs.readFile(cmoTemplatePath, 'utf8'),
    fs.readFile(seoTemplatePath, 'utf8'),
  ]);

  return { cmoCode, seoCode };
}

async function apiGet(url, apiKey) {
  const response = await fetch(url, {
    headers: { 'X-N8N-API-KEY': apiKey },
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }

  return response.json();
}

async function apiPut(url, apiKey, payload) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`PUT ${url} failed with ${response.status}`);
  }

  return response.json();
}

async function backupWorkflow(workflow) {
  await fs.mkdir(backupDir, { recursive: true });
  const safeName = workflow.name.replaceAll('/', '-').replaceAll(' ', '_');
  const filePath = path.join(backupDir, `${workflow.id}-${safeName}.json`);
  await fs.writeFile(filePath, JSON.stringify(workflow, null, 2), 'utf8');
  return filePath;
}

function findNode(workflow, name) {
  const node = workflow.nodes.find((item) => item.name === name);
  if (!node) {
    throw new Error(`Node not found: ${name}`);
  }
  return node;
}

function workflowPayload(workflow) {
  return {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {},
    staticData: workflow.staticData || {},
    pinData: workflow.pinData || {},
  };
}

function patchCmo(workflow, cmoCode) {
  const patched = structuredClone(workflow);
  patched.settings = patched.settings || {};
  patched.settings.timezone = 'Asia/Kolkata';

  const buildDraft = findNode(patched, 'Build Draft');
  buildDraft.parameters.jsCode = cmoCode;

  const respond = findNode(patched, 'Respond to Webhook');
  respond.parameters.respondWith = 'json';
  respond.parameters.responseBody = "={{ { status: 'ok', post: $json.post, angle: $json.angle || null } }}";

  return patched;
}

function patchSeo(workflow, seoCode) {
  const patched = structuredClone(workflow);
  patched.settings = patched.settings || {};
  patched.settings.timezone = 'Asia/Kolkata';

  const buildDigest = findNode(patched, 'Build SEO Digest');
  buildDigest.parameters.jsCode = seoCode;

  const respond = findNode(patched, 'Respond to Webhook');
  respond.parameters.respondWith = 'json';
  respond.parameters.responseBody = "={{ { status: 'ok', summary: $json.summary, automation: 'digest-only' } }}";

  return patched;
}

async function main() {
  const env = await loadEnv();
  const { cmoCode, seoCode } = await loadTemplateCode();
  const n8nUrl = env.N8N_URL?.replace(/\/$/, '');
  const apiKey = env.N8N_API_KEY;

  if (!n8nUrl || !apiKey) {
    throw new Error('N8N_URL or N8N_API_KEY is missing in E:\\Work\\env');
  }

  const workflowMap = {
    [WORKFLOW_IDS.cmo]: (workflow) => patchCmo(workflow, cmoCode),
    [WORKFLOW_IDS.seo]: (workflow) => patchSeo(workflow, seoCode),
  };

  const results = {};
  for (const [workflowId, patcher] of Object.entries(workflowMap)) {
    const workflow = await apiGet(`${n8nUrl}/api/v1/workflows/${workflowId}`, apiKey);
    const backupPath = await backupWorkflow(workflow);
    const updated = await apiPut(
      `${n8nUrl}/api/v1/workflows/${workflowId}`,
      apiKey,
      workflowPayload(patcher(workflow)),
    );

    results[workflowId] = {
      name: updated.name,
      backup: backupPath,
      updatedAt: updated.updatedAt,
    };
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
