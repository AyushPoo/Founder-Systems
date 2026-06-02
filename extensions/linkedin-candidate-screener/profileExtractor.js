function textFrom(root, selectors) {
  for (const selector of selectors) {
    try {
      const node = root.querySelector(selector);
      const value = node?.textContent?.trim();
      if (value) {
        return value;
      }
    } catch {
      // Skip invalid selectors
    }
  }
  return '';
}

function listFrom(root, selectors, limit = 6) {
  const items = [];
  selectors.forEach((selector) => {
    try {
      root.querySelectorAll(selector).forEach((node) => {
        const value = node.textContent?.trim();
        if (value && !items.includes(value) && items.length < limit) {
          items.push(value);
        }
      });
    } catch {
      // Skip invalid selectors
    }
  });
  return items;
}

function extractLinkedinProfile(document, options = {}) {
  // Try multiple selector strategies for each field since LinkedIn changes DOM frequently
  const fullName = textFrom(document, [
    'h1.text-heading-xlarge',
    'h1[class*="text-heading"]',
    '.pv-top-card h1',
    'h1',
  ]);

  const headline = textFrom(document, [
    '.text-body-medium.break-words',
    'div.text-body-medium',
    '.pv-top-card--list .text-body-medium',
    '.pv-text-details__left-panel div.text-body-medium',
  ]);

  const location = textFrom(document, [
    '.text-body-small.inline.t-black--light.break-words',
    'span.text-body-small.inline.t-black--light',
    '.pv-top-card--list .text-body-small',
  ]);

  const about = textFrom(document, [
    '#about ~ div .display-flex.ph5.pv3',
    '#about ~ div span[aria-hidden="true"]',
    '#about + div + div span[aria-hidden="true"]',
    'section[data-section="summary"] span[aria-hidden="true"]',
    '.pv-about__summary-text span[aria-hidden="true"]',
  ]);

  const currentCompany = textFrom(document, [
    '#experience ~ div li:first-child .t-bold span[aria-hidden="true"]',
    'section[data-section="experience"] li:first-child span[aria-hidden="true"]',
    '.pv-top-card--experience-list-item',
  ]);

  const experience = listFrom(document, [
    '#experience ~ div li .display-flex.align-items-center .t-bold span[aria-hidden="true"]',
    '#experience ~ div li span[aria-hidden="true"]',
    'section[data-section="experience"] li span.t-bold span[aria-hidden="true"]',
  ]);

  const education = listFrom(document, [
    '#education ~ div li .t-bold span[aria-hidden="true"]',
    'section[data-section="education"] li span.t-bold span[aria-hidden="true"]',
  ]);

  const skills = listFrom(document, [
    '#skills ~ div li span[aria-hidden="true"]',
    'section[data-section="skills"] li span[aria-hidden="true"]',
    '.pv-skill-category-entity__name-text',
  ]);

  const recentActivity = options.includeActivity
    ? listFrom(document, [
        'section.artdeco-card a[href*="/posts/"] span[aria-hidden="true"]',
        '[data-section="recent_activity"] span[aria-hidden="true"]',
        '.feed-shared-update-v2 span[aria-hidden="true"]',
      ], 4)
    : [];

  const externalLinks = options.includeExternalLinks
    ? Array.from(document.querySelectorAll('a[href^="http"]'))
        .map((node) => node.href)
        .filter((href) => !href.includes('linkedin.com'))
        .slice(0, 4)
    : [];

  return {
    fullName,
    headline,
    location,
    currentCompany,
    about,
    experience,
    education,
    skills,
    recentActivity,
    externalLinks,
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.LinkedinCandidateScreenerExtractor = {
    extractLinkedinProfile,
  };
}
