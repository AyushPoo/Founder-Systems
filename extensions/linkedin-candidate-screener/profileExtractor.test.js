import assert from 'assert';
import { JSDOM } from 'jsdom';
import fs from 'node:fs/promises';
import { extractLinkedinProfile } from './profileExtractor.js';

const html = await fs.readFile(
  new URL('./fixtures/linkedin-profile-sample.html', import.meta.url),
  'utf8'
);
const dom = new JSDOM(html);
const profile = extractLinkedinProfile(dom.window.document, {
  includeActivity: true,
  includeExternalLinks: true,
});

assert.equal(profile.fullName, 'Avery Shah');
assert.equal(profile.headline.includes('Product Marketing Lead'), true);
assert.equal(profile.experience.length >= 1, true);
assert.equal(profile.recentActivity.length >= 1, true);
assert.equal(profile.externalLinks.includes('https://averyshah.com/'), true);

console.log('linkedin candidate screener extractor tests passed');
