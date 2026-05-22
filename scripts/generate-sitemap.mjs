import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guidesData } from '../src/data/guidesData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publicDir = path.join(repoRoot, 'public');
const productIndexPath = path.join(publicDir, 'product-data', 'index.json');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

const SITE_ORIGIN = 'https://foundersystems.in';
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0', lastmod: TODAY },
  { loc: '/products', changefreq: 'weekly', priority: '0.9', lastmod: TODAY },
  { loc: '/guides', changefreq: 'weekly', priority: '0.9', lastmod: TODAY },
  { loc: '/about', changefreq: 'monthly', priority: '0.7', lastmod: TODAY },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3', lastmod: TODAY },
  { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.3', lastmod: TODAY },
  { loc: '/refund-policy', changefreq: 'yearly', priority: '0.3', lastmod: TODAY },
];

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function readProducts() {
  const raw = fs.readFileSync(productIndexPath, 'utf8');
  return JSON.parse(raw);
}

function buildEntries() {
  const products = readProducts().map((product) => ({
    loc: `/products/${product.id}`,
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: TODAY,
  }));

  const guides = guidesData.map((guide) => ({
    loc: `/guides/${guide.id}`,
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: guide.lastUpdated || TODAY,
  }));

  return [...STATIC_ROUTES, ...products, ...guides];
}

function buildXml(entries) {
  const body = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(`${SITE_ORIGIN}${entry.loc}`)}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
    <changefreq>${escapeXml(entry.changefreq)}</changefreq>
    <priority>${escapeXml(entry.priority)}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

const entries = buildEntries();
const xml = buildXml(entries);
fs.writeFileSync(sitemapPath, xml, 'utf8');
console.log(`Wrote ${entries.length} sitemap entries to ${sitemapPath}`);
