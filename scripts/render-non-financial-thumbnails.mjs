import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NON_FINANCIAL_THUMBNAIL_SPECS } from './thumbnail-product-specs.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const COLORS = {
  cream: '#f7f1e7',
  creamSoft: '#fffdf8',
  black: '#1b1c1a',
  orange: '#ff6a1a',
  outline: '#d9d0c2',
  inkSoft: '#8d877f',
  panel: '#ffffff',
};

function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function chip(text, x, y, width) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="48" rx="24" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="2" />
    <text x="${x + width / 2}" y="${y + 31}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${COLORS.black}">
      ${esc(text)}
    </text>
  `;
}

function strokeLine(x1, y1, x2, y2, color = COLORS.black, width = 4) {
  return `<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" />`;
}

function roundedPanel(x, y, width, height, radius = 32, fill = COLORS.panel, stroke = COLORS.outline, strokeWidth = 3) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

function heroHeading(spec) {
  const lines = spec.headline || [spec.badge];
  return lines
    .map((line, index) => `
      <text x="148" y="${300 + (index * 100)}" font-family="Arial, sans-serif" font-size="86" font-weight="800" letter-spacing="-2" fill="${COLORS.black}">
        ${esc(line)}
      </text>
    `)
    .join('');
}

function renderTopLabel(spec) {
  return `
    <rect x="126" y="110" width="324" height="62" rx="31" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="2" />
    <text x="288" y="149" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="5" fill="${COLORS.black}">
      ${esc(spec.label.toUpperCase())}
    </text>
    <rect x="1210" y="110" width="248" height="62" rx="31" fill="${COLORS.black}" />
    <text x="1334" y="149" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="4" fill="#ffffff">
      ${esc(spec.badge.toUpperCase())}
    </text>
  `;
}

function renderSupportBand(spec) {
  const chips = spec.chips.map((text, index) => chip(text, 170 + index * 214, 1032, 184)).join('');
  return `
    <rect x="132" y="986" width="1336" height="118" rx="42" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="2" />
    ${chips}
    <rect x="1048" y="1018" width="348" height="58" rx="29" fill="${spec.accent}" />
    <text x="1257" y="1055" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">
      ${esc(spec.titleMarker)}
    </text>
  `;
}

function motifGlyph(spec) {
  switch (spec.motif) {
    case 'branch-map':
      return `
        <circle cx="396" cy="566" r="20" fill="${COLORS.orange}" stroke="${COLORS.black}" stroke-width="4" />
        <circle cx="986" cy="420" r="18" fill="${COLORS.panel}" stroke="${COLORS.black}" stroke-width="4" />
        <circle cx="986" cy="712" r="18" fill="${COLORS.panel}" stroke="${COLORS.black}" stroke-width="4" />
      `;
    case 'message-lanes':
      return `
        <rect x="238" y="472" width="204" height="126" rx="26" fill="${COLORS.creamSoft}" stroke="${COLORS.outline}" stroke-width="3" />
        <rect x="1042" y="472" width="228" height="126" rx="26" fill="${COLORS.orange}" opacity="0.92" />
      `;
    case 'workflow-chain':
      return `
        <rect x="228" y="470" width="224" height="130" rx="30" fill="${COLORS.creamSoft}" stroke="${COLORS.outline}" stroke-width="3" />
        <path d="M 1068 474 L 1262 474" stroke="${COLORS.black}" stroke-width="6" stroke-dasharray="14 18" stroke-linecap="round" />
      `;
    case 'layered-docs':
      return `
        <rect x="334" y="442" width="180" height="212" rx="28" fill="${COLORS.creamSoft}" stroke="${COLORS.outline}" stroke-width="3" />
        <rect x="370" y="474" width="180" height="212" rx="28" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="3" />
      `;
    case 'profile-grid':
      return `
        <circle cx="420" cy="546" r="88" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="3" />
        <circle cx="420" cy="518" r="28" fill="${COLORS.cream}" stroke="${COLORS.outline}" stroke-width="3" />
        <path d="M 334 622 C 360 584 480 584 506 622" stroke="${COLORS.outline}" stroke-width="3" stroke-linecap="round" />
      `;
    case 'campaign-grid':
      return `
        <rect x="760" y="418" width="250" height="110" rx="30" fill="${COLORS.orange}" opacity="0.16" />
        <rect x="1040" y="418" width="250" height="110" rx="30" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="3" />
      `;
    case 'finance-grid':
      return `
        <rect x="760" y="418" width="250" height="110" rx="30" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="3" />
        <rect x="1040" y="418" width="250" height="110" rx="30" fill="${COLORS.orange}" opacity="0.12" />
        <path d="M 810 465 L 860 465 L 910 434 L 960 434" stroke="${COLORS.black}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      `;
    case 'summary-panels':
      return `
        <rect x="1214" y="406" width="116" height="388" rx="24" fill="${COLORS.orange}" opacity="0.92" />
      `;
    case 'dashboard-modules':
      return `
        <rect x="652" y="406" width="520" height="170" rx="34" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="3" />
        <rect x="652" y="606" width="520" height="182" rx="34" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="3" />
        <rect x="252" y="410" width="360" height="260" rx="34" fill="${COLORS.creamSoft}" stroke="${COLORS.outline}" stroke-width="3" />
      `;
    case 'slide-stack':
      return `
        <rect x="256" y="430" width="334" height="250" rx="34" fill="${COLORS.creamSoft}" stroke="${COLORS.outline}" stroke-width="3" />
        <rect x="286" y="462" width="334" height="250" rx="34" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="3" />
        <rect x="1210" y="412" width="120" height="380" rx="24" fill="${COLORS.orange}" opacity="0.72" />
      `;
    default:
      return '';
  }
}

function renderPanelComposition(spec) {
  return `
    <rect x="92" y="202" width="1416" height="680" rx="56" fill="${spec.tint}" />
    ${roundedPanel(846, 210, 558, 530, 46, COLORS.creamSoft, COLORS.black, 4)}
    ${roundedPanel(900, 286, 176, 150, 30)}
    ${roundedPanel(1098, 286, 244, 116, 30)}
    ${roundedPanel(1098, 424, 244, 146, 30)}
    ${roundedPanel(900, 468, 442, 212, 32)}
    ${motifGlyph(spec)}
    ${strokeLine(934, 330, 1032, 330, COLORS.black, 4)}
    ${strokeLine(934, 372, 1008, 372, COLORS.inkSoft, 4)}
    ${strokeLine(1132, 330, 1284, 330, COLORS.black, 4)}
    ${strokeLine(1132, 476, 1286, 476, COLORS.black, 4)}
    ${strokeLine(934, 538, 1262, 538, COLORS.black, 4)}
    ${strokeLine(934, 596, 1228, 596, COLORS.inkSoft, 4)}
    ${strokeLine(934, 650, 1186, 650, COLORS.inkSoft, 4)}
  `;
}

function renderFlowComposition(spec) {
  return `
    <rect x="92" y="202" width="1416" height="680" rx="56" fill="${spec.tint}" />
    ${roundedPanel(850, 250, 520, 496, 44, COLORS.creamSoft, COLORS.black, 4)}
    ${roundedPanel(906, 356, 128, 128, 26)}
    ${roundedPanel(1112, 302, 192, 96, 26)}
    ${roundedPanel(1112, 496, 192, 96, 26)}
    ${roundedPanel(1040, 648, 250, 70, 35, spec.accent, spec.accent, 0)}
    ${motifGlyph(spec)}
    <path d="M 1034 420 H 1104" stroke="${COLORS.black}" stroke-width="5" stroke-linecap="round" />
    <path d="M 1034 420 C 1088 420 1088 350 1112 350" stroke="${spec.accent}" stroke-width="5" stroke-linecap="round" fill="none" />
    <path d="M 1034 420 C 1088 420 1088 544 1112 544" stroke="${spec.accent}" stroke-width="5" stroke-linecap="round" fill="none" />
    ${strokeLine(936, 428, 1002, 428, COLORS.inkSoft, 4)}
    ${strokeLine(936, 474, 988, 474, COLORS.inkSoft, 4)}
    ${strokeLine(1142, 350, 1270, 350, COLORS.black, 4)}
    ${strokeLine(1142, 544, 1260, 544, COLORS.black, 4)}
    <circle cx="1034" cy="420" r="14" fill="${spec.accent}" stroke="${COLORS.black}" stroke-width="3" />
  `;
}

function renderSignalComposition(spec) {
  return `
    <rect x="92" y="202" width="1416" height="680" rx="56" fill="${spec.tint}" />
    ${roundedPanel(850, 250, 520, 496, 44, COLORS.creamSoft, COLORS.black, 4)}
    ${roundedPanel(906, 320, 148, 238, 28)}
    ${roundedPanel(1084, 320, 224, 128, 28)}
    ${roundedPanel(1084, 478, 224, 82, 26)}
    ${roundedPanel(1084, 584, 224, 94, 26)}
    ${motifGlyph(spec)}
    <rect x="1174" y="320" width="134" height="52" rx="18" fill="${spec.accent}" />
    ${strokeLine(1118, 386, 1248, 386, COLORS.black, 4)}
    ${strokeLine(1118, 518, 1266, 518, COLORS.black, 4)}
    ${strokeLine(1118, 630, 1252, 630, COLORS.inkSoft, 4)}
    ${strokeLine(936, 620, 1022, 620, COLORS.black, 4)}
    ${strokeLine(936, 664, 1008, 664, COLORS.inkSoft, 4)}
  `;
}

function renderCover(spec) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="1200" viewBox="0 0 1600 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1200" fill="${COLORS.cream}" />
  <rect x="92" y="92" width="1416" height="1016" rx="56" fill="${COLORS.cream}" stroke="${COLORS.black}" stroke-width="4" />
  <rect x="112" y="112" width="1416" height="1016" rx="56" fill="rgba(27,28,26,0.12)" />
  ${renderTopLabel(spec)}
  ${heroHeading(spec)}
  <text x="148" y="632" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="4" fill="${spec.accentDark}">
    FOUNDER SYSTEMS • PREMIUM TOOL
  </text>
  <text x="148" y="676" font-family="Arial, sans-serif" font-size="28" font-weight="500" fill="${COLORS.black}">
    Designed to look priced, not placeholder.
  </text>
  ${spec.composition === 'panel' ? renderPanelComposition(spec) : spec.composition === 'flow' ? renderFlowComposition(spec) : renderSignalComposition(spec)}
  ${renderSupportBand(spec)}
</svg>`;
}

for (const spec of NON_FINANCIAL_THUMBNAIL_SPECS) {
  const productDir = path.join(repoRoot, 'public', 'images', 'products', spec.id);
  mkdirSync(productDir, { recursive: true });
  const outputPath = path.join(productDir, 'thumbnail.svg');
  writeFileSync(outputPath, renderCover(spec), 'utf8');
  console.log(`Generated ${outputPath}`);
}

