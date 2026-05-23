import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import productCatalog from '../public/product-data/index.json' with { type: 'json' };
import { guidesData } from '../src/data/guidesData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const siteOrigin = 'https://foundersystems.in';
const defaultImage = `${siteOrigin}/images/logo.png`;

const STATIC_ROUTE_SPECS = [
  {
    path: '/',
    title: 'Guidance and Systems for Founders | Founder Systems',
    description:
      'Founder Systems helps founders get guidance, reduce operational headaches, and move faster with practical tools for strategy, outreach, decks, and execution.',
    h1: 'Founder Systems',
    intro:
      'Guidance, tools, and operating systems for founders who want cleaner execution, sharper decisions, and less repeated chaos.',
  },
  {
    path: '/products',
    title: 'Products | Founder Systems',
    description:
      'Explore our toolkit of AI-powered systems and financial models designed for founders to turn chaos into clarity.',
    h1: 'Systems Catalog',
    intro:
      'A growing toolkit of founder systems, operator tools, and practical products built to make company-building easier to steer.',
  },
  {
    path: '/guides',
    title: 'Founder Guides & Strategy | Founder Systems',
    description:
      'Practical founder guides on strategy, outreach, systems, decks, and decision-making.',
    h1: 'Founder Guides & Strategy',
    intro:
      'Practical essays on strategy, outreach, systems, fundraising, and the operating decisions that usually get buried under startup noise.',
  },
  {
    path: '/about',
    title: 'About | Founder Systems',
    description:
      'Meet Ayush, the founder of Founder Systems, building professional-grade models and AI co-pilots for startups.',
    h1: 'Meet the Founder',
    intro:
      'Learn who is building Founder Systems and why the company is focused on practical tools instead of startup theatre.',
  },
  {
    path: '/terms',
    title: 'Terms of Service | Founder Systems',
    description:
      'Read our terms of service to understand the rules and guidelines for using Founder Systems.',
    h1: 'Terms of Service',
    intro:
      'The legal terms that govern purchases, usage, and access across Founder Systems products and downloads.',
  },
  {
    path: '/refund-policy',
    title: 'Refund Policy | Founder Systems',
    description:
      'Read the Founder Systems refund policy for digital products, credit purchases, and operator passes.',
    h1: 'Refund Policy',
    intro:
      'The policy that explains how Founder Systems handles refunds across digital purchases, credits, and operator access.',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | Founder Systems',
    description:
      'Our privacy policy details how we collect, use, and protect your information at Founder Systems.',
    h1: 'Privacy Policy',
    intro:
      'A clear summary of how Founder Systems collects, uses, and protects customer information.',
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normaliseImagePath(imagePath) {
  if (!imagePath) {
    return defaultImage;
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  return `${siteOrigin}${imagePath}`;
}

function buildStaticShellMarkup(spec) {
  const introMarkup = spec.intro
    ? `<p class="route-shell-intro">${escapeHtml(spec.intro)}</p>`
    : '';

  return `
    <main class="route-shell" data-route="${escapeHtml(spec.path)}">
      <section class="route-shell-card">
        <span class="route-shell-kicker">Founder Systems</span>
        <h1>${escapeHtml(spec.h1)}</h1>
        ${introMarkup}
      </section>
    </main>
  `.trim();
}

function replaceTag(html, pattern, replacement) {
  if (pattern.test(html)) {
    pattern.lastIndex = 0;
    return html.replace(pattern, replacement);
  }

  return html.replace('</head>', `  ${replacement}\n</head>`);
}

export function buildRouteSpecs({ products, guides }) {
  const productSpecs = products.map((product) => ({
    path: `/products/${product.id}`,
    title: `${product.name} | Founder Systems`,
    description: product.description,
    h1: product.name,
    intro: product.description,
    image: normaliseImagePath(product.thumbnail),
  }));

  const guideSpecs = guides.map((guide) => ({
    path: `/guides/${guide.id}`,
    title: `${guide.title} | Founder Systems`,
    description: guide.description,
    h1: guide.title,
    intro: guide.heroNote || guide.description,
    image: normaliseImagePath(guide.thumbnail),
  }));

  return [...STATIC_ROUTE_SPECS, ...productSpecs, ...guideSpecs];
}

export function renderRouteShell(baseHtml, spec) {
  const canonicalUrl = `${siteOrigin}${spec.path === '/' ? '' : spec.path}`;
  const imageUrl = normaliseImagePath(spec.image);
  let rendered = baseHtml;

  rendered = rendered.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(spec.title)}</title>`);
  rendered = replaceTag(
    rendered,
    /<meta\s+name="title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="title" content="${escapeHtml(spec.title)}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(spec.description)}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    '<meta name="robots" content="index,follow" />',
  );
  rendered = replaceTag(
    rendered,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(spec.title)}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(spec.description)}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${imageUrl}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    '<meta property="og:type" content="website" />',
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+property="twitter:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:url" content="${canonicalUrl}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+property="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:title" content="${escapeHtml(spec.title)}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+property="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:description" content="${escapeHtml(spec.description)}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+property="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:image" content="${imageUrl}" />`,
  );
  rendered = replaceTag(
    rendered,
    /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/i,
    '<meta name="twitter:card" content="summary_large_image" />',
  );

  const shellMarkup = buildStaticShellMarkup(spec);
  const rootPattern = /<div id="root">[\s\S]*?<\/div>/i;

  if (rootPattern.test(rendered)) {
    rendered = rendered.replace(rootPattern, `<div id="root">${shellMarkup}</div>`);
  } else {
    rendered = rendered.replace('<body>', `<body>\n  <div id="root">${shellMarkup}</div>`);
  }

  return rendered;
}

function getOutputFilePath(routePath) {
  if (routePath === '/') {
    return path.join(distRoot, 'index.html');
  }

  const routeSegments = routePath.replace(/^\//, '').split('/');
  return path.join(distRoot, ...routeSegments, 'index.html');
}

async function ensureParentDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function generateRouteShells() {
  const baseHtmlPath = path.join(distRoot, 'index.html');
  const baseHtml = await fs.readFile(baseHtmlPath, 'utf8');
  const specs = buildRouteSpecs({ products: productCatalog, guides: guidesData });

  await Promise.all(
    specs.map(async (spec) => {
      const outputPath = getOutputFilePath(spec.path);
      const renderedHtml = renderRouteShell(baseHtml, spec);
      await ensureParentDirectory(outputPath);
      await fs.writeFile(outputPath, renderedHtml, 'utf8');
    }),
  );
}

async function main() {
  await generateRouteShells();
  console.log('route seo shells generated');
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
