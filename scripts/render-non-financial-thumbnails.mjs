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

function renderTopLabel(spec) {
  return `
    <rect x="126" y="110" width="352" height="66" rx="33" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="2" />
    <text x="302" y="152" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="5" fill="${COLORS.black}">
      ${esc(spec.label.toUpperCase())}
    </text>
    <text x="126" y="252" font-family="Arial, sans-serif" font-size="38" font-weight="700" letter-spacing="6" fill="${COLORS.black}">
      ${esc(spec.badge.toUpperCase())}
    </text>
  `;
}

function renderSupportBand(spec) {
  const chips = spec.chips.map((text, index) => chip(text, 170 + index * 214, 1032, 184)).join('');
  return `
    <rect x="132" y="986" width="1336" height="118" rx="42" fill="${COLORS.panel}" stroke="${COLORS.outline}" stroke-width="2" />
    ${chips}
    <rect x="1118" y="1022" width="278" height="52" rx="26" fill="${COLORS.orange}" />
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
    ${roundedPanel(176, 328, 1248, 564, 58, COLORS.creamSoft, COLORS.black, 4)}
    ${roundedPanel(248, 404, 364, 264, 34)}
    ${roundedPanel(652, 404, 520, 172, 34)}
    ${roundedPanel(652, 606, 520, 184, 34)}
    ${motifGlyph(spec)}
    ${strokeLine(300, 476, 560, 476)}
    ${strokeLine(300, 534, 522, 534, COLORS.inkSoft)}
    ${strokeLine(300, 592, 548, 592, COLORS.inkSoft)}
    ${strokeLine(704, 478, 1118, 478)}
    ${strokeLine(704, 536, 1046, 536, COLORS.inkSoft)}
    ${strokeLine(704, 676, 1118, 676)}
    ${strokeLine(704, 734, 990, 734, COLORS.inkSoft)}
  `;
}

function renderFlowComposition(spec) {
  return `
    ${roundedPanel(212, 428, 264, 264, 40, COLORS.panel, COLORS.black, 4)}
    ${roundedPanel(588, 328, 312, 184, 40)}
    ${roundedPanel(588, 608, 312, 184, 40)}
    ${roundedPanel(1018, 428, 338, 264, 40, COLORS.panel, COLORS.black, 4)}
    ${motifGlyph(spec)}
    <path d="M 476 560 H 564" stroke="${COLORS.black}" stroke-width="6" stroke-linecap="round" />
    <path d="M 476 560 C 528 560 532 420 588 420" stroke="${COLORS.orange}" stroke-width="6" stroke-linecap="round" fill="none" />
    <path d="M 476 560 C 528 560 532 700 588 700" stroke="${COLORS.orange}" stroke-width="6" stroke-linecap="round" fill="none" />
    <path d="M 900 420 H 980" stroke="${COLORS.black}" stroke-width="6" stroke-linecap="round" />
    <path d="M 900 700 H 980" stroke="${COLORS.black}" stroke-width="6" stroke-linecap="round" />
    ${strokeLine(252, 500, 424, 500, COLORS.black, 4)}
    ${strokeLine(252, 556, 390, 556, COLORS.inkSoft, 4)}
    ${strokeLine(1048, 504, 1278, 504, COLORS.black, 4)}
    ${strokeLine(1048, 560, 1224, 560, COLORS.inkSoft, 4)}
  `;
}

function renderSignalComposition(spec) {
  return `
    ${roundedPanel(212, 350, 420, 520, 48, COLORS.panel, COLORS.black, 4)}
    ${roundedPanel(710, 350, 648, 520, 48, COLORS.creamSoft, COLORS.black, 4)}
    ${roundedPanel(760, 418, 250, 112, 30)}
    ${roundedPanel(1040, 418, 250, 112, 30)}
    ${roundedPanel(760, 580, 530, 92, 28)}
    ${roundedPanel(760, 710, 530, 92, 28)}
    ${motifGlyph(spec)}
    ${strokeLine(322, 728, 520, 728)}
    ${strokeLine(322, 778, 494, 778, COLORS.inkSoft)}
    ${strokeLine(812, 472, 930, 472)}
    ${strokeLine(812, 628, 1210, 628)}
    ${strokeLine(812, 760, 1184, 760, COLORS.inkSoft)}
    <rect x="1040" y="418" width="250" height="112" rx="30" fill="${COLORS.orange}" opacity="${spec.motif === 'finance-grid' ? '0.12' : '0.9'}" />
  `;
}

function renderCover(spec) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="1200" viewBox="0 0 1600 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1200" fill="${COLORS.cream}" />
  ${renderTopLabel(spec)}
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

