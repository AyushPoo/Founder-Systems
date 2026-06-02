function textFrom(root, selectors) {
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    const value = node?.textContent?.trim();
    if (value) {
      return value;
    }
  }
  return '';
}

function listFrom(root, selectors, limit = 6) {
  const items = [];
  selectors.forEach((selector) => {
    root.querySelectorAll(selector).forEach((node) => {
      const value = node.textContent?.trim();
      if (value && !items.includes(value) && items.length < limit) {
        items.push(value);
      }
    });
  });
  return items;
}

function extractLinkedinProfile(document, options = {}) {
  return {
    fullName: textFrom(document, ['h1', '.text-heading-xlarge']),
    headline: textFrom(document, [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel div.text-body-medium',
    ]),
    location: textFrom(document, ['.text-body-small.inline.t-black--light.break-words']),
    currentCompany: textFrom(document, [
      '#experience + div li:first-child .t-bold span[aria-hidden="true"]',
    ]),
    about: textFrom(document, [
      '#about + div .display-flex.ph5.pv3',
      '#about + div span[aria-hidden="true"]',
    ]),
    experience: listFrom(document, [
      '#experience + div li .display-flex.align-items-center .t-bold span[aria-hidden="true"]',
    ]),
    education: listFrom(document, ['#education + div li .t-bold span[aria-hidden="true"]']),
    skills: listFrom(document, ['#skills + div li span[aria-hidden="true"]']),
    recentActivity: options.includeActivity
      ? listFrom(document, ['section.artdeco-card a[href*="/posts/"] span[aria-hidden="true"]'], 4)
      : [],
    externalLinks: options.includeExternalLinks
      ? Array.from(document.querySelectorAll('a[href^="http"]'))
          .map((node) => node.href)
          .filter((href) => !href.includes('linkedin.com'))
          .slice(0, 4)
      : [],
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.LinkedinCandidateScreenerExtractor = {
    extractLinkedinProfile,
  };
}
