/* global chrome */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'extract-linkedin-profile') {
    return false;
  }

  const extractor = globalThis.LinkedinCandidateScreenerExtractor;
  if (!extractor?.extractLinkedinProfile) {
    sendResponse({
      error: 'Profile extractor is unavailable. Try refreshing the page.',
    });
    return false;
  }

  try {
    const profile = extractor.extractLinkedinProfile(document, {
      includeActivity: Boolean(message.includeActivity),
      includeExternalLinks: Boolean(message.includeExternalLinks),
    });

    // If we couldn't get the name, try a last-resort approach
    if (!profile.fullName) {
      const h1 = document.querySelector('h1');
      if (h1) {
        profile.fullName = h1.textContent.trim();
      }
    }

    // Get headline from meta tag as fallback
    if (!profile.headline) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        const content = metaDesc.getAttribute('content') || '';
        // LinkedIn meta description format: "Name - Headline - Location"
        const parts = content.split(' - ');
        if (parts.length >= 2) {
          profile.headline = parts[1].trim();
        }
      }
    }

    sendResponse(profile);
  } catch (err) {
    sendResponse({
      error: 'Failed to extract profile: ' + (err?.message || 'unknown error'),
    });
  }

  return false;
});
