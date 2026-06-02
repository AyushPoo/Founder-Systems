/**
 * Run this script to generate placeholder extension icons.
 * Replace these with your actual brand icons before publishing.
 * 
 * Usage: node generate-icons.js
 * 
 * For production, create proper 16x16, 48x48, and 128x128 PNG icons
 * using your brand assets (the FS logo or a candidate screening icon).
 */

import { writeFileSync } from 'node:fs';

// Minimal 1x1 orange PNG as placeholder (Chrome requires real PNGs)
// You MUST replace these with actual icons before Chrome Web Store submission
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

writeFileSync('icons/icon-16.png', PLACEHOLDER_PNG);
writeFileSync('icons/icon-48.png', PLACEHOLDER_PNG);
writeFileSync('icons/icon-128.png', PLACEHOLDER_PNG);

console.log('Placeholder icons created. Replace with real 16x16, 48x48, 128x128 PNG brand icons before publishing.');
