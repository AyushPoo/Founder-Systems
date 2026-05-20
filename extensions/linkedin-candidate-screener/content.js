/* global chrome */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'extract-linkedin-profile') {
    return false;
  }

  const extractor = globalThis.LinkedinCandidateScreenerExtractor;
  if (!extractor?.extractLinkedinProfile) {
    sendResponse({
      error: 'Profile extractor is unavailable on this page.',
    });
    return false;
  }

  sendResponse(
    extractor.extractLinkedinProfile(document, {
      includeActivity: Boolean(message.includeActivity),
      includeExternalLinks: Boolean(message.includeExternalLinks),
    })
  );

  return false;
});
