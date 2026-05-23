import assert from 'node:assert/strict';

import productCatalog from '../public/product-data/index.json' with { type: 'json' };
import { guidesData } from '../src/data/guidesData.js';
import { buildRouteSpecs, renderRouteShell } from './route-seo-shells.mjs';

const specs = buildRouteSpecs({ products: productCatalog, guides: guidesData });

assert.ok(specs.find((spec) => spec.path === '/'), 'home route spec should exist');
assert.ok(specs.find((spec) => spec.path === '/products'), 'products route spec should exist');
assert.ok(specs.find((spec) => spec.path === '/guides'), 'guides route spec should exist');
assert.ok(
  specs.find((spec) => spec.path === '/products/founder-spec-generator'),
  'product detail route spec should exist',
);
assert.ok(
  specs.find((spec) => spec.path === '/guides/how-to-pressure-test-a-startup-idea-before-you-build-the-wrong-v1'),
  'guide detail route spec should exist',
);

const baseHtml = `<!doctype html>
<html lang="en">
<head>
  <title>Old Title</title>
  <meta name="title" content="Old Title" />
  <meta name="description" content="Old description" />
  <link rel="canonical" href="https://foundersystems.in/" />
  <meta property="og:url" content="https://foundersystems.in/" />
  <meta property="og:title" content="Old Title" />
  <meta property="og:description" content="Old description" />
  <meta property="og:image" content="https://foundersystems.in/logo.png" />
  <meta property="twitter:url" content="https://foundersystems.in/" />
  <meta property="twitter:title" content="Old Title" />
  <meta property="twitter:description" content="Old description" />
  <meta property="twitter:image" content="https://foundersystems.in/logo.png" />
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

const strategySpec = specs.find((spec) => spec.path === '/products/founder-spec-generator');
const rendered = renderRouteShell(baseHtml, strategySpec);

assert.match(rendered, /<title>Founder Strategy Copilot \| Founder Systems<\/title>/);
assert.match(rendered, /<meta name="description" content="Build a market brief, review a messy plan, and turn the strongest next move into a founder-ready execution plan\." \/>/);
assert.match(rendered, /<link rel="canonical" href="https:\/\/foundersystems\.in\/products\/founder-spec-generator" \/>/);
assert.match(rendered, /<h1[^>]*>Founder Strategy Copilot<\/h1>/);
assert.match(rendered, /Build a market brief, review a messy plan, and turn the strongest next move into a founder-ready execution plan\./);

console.log('route seo shells tests passed');
