import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(repoRoot, 'public', 'product-data', 'index.json');

const blockedThumbnails = new Set([
  '/images/strategy.png',
  '/images/systems.png',
  '/images/finance.png',
  '/images/products/founder-spec-generator/preview-1.png',
  '/images/products/founder-outreach-kit/preview-1.png',
  '/images/products/promptdeck-ai/preview-1.png',
]);

const targetIds = new Set([
  'founder-spec-generator',
  'founder-outreach-kit',
  'founder-pdf-summarizer',
  'linkedin-candidate-screener',
  'founder-command-center',
  'marketing-agent',
  'finance-agent',
  'ops-agent',
  'promptdeck-ai',
]);

const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const failures = [];

for (const product of catalog) {
  if (!targetIds.has(product.id)) continue;
  if (!product.thumbnail?.endsWith('/thumbnail.svg')) {
    failures.push(`${product.id} thumbnail should point to a generated thumbnail.svg`);
  }
  if (blockedThumbnails.has(product.thumbnail)) {
    failures.push(`${product.id} still points to blocked fallback art: ${product.thumbnail}`);
  }
  const absoluteAssetPath = path.join(repoRoot, 'public', product.thumbnail.replace(/^\//, ''));
  if (!existsSync(absoluteAssetPath)) {
    failures.push(`${product.id} is missing generated file at ${absoluteAssetPath}`);
  }
}

if (failures.length > 0) {
  console.error('Non-financial thumbnail verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Non-financial thumbnail verification passed.');

