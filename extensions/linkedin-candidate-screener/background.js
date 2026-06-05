/* global chrome */

const API_BASE = 'https://foundersystems.in';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'summarize-profile') {
    fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: '__summarize_only__',
        profile: {
          fullName: message.name || '',
          headline: '',
          about: message.text || '',
          experience: [],
          skills: [],
        },
      }),
    })
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ ok: false, error: err.message }));

    return true;
  }

  if (message?.type === 'screen-candidate') {
    fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: message.jd,
        profile: {
          fullName: message.name || '',
          headline: message.headline || '',
          about: message.text || '',
          experience: message.experience || [],
          skills: message.skills || [],
        },
      }),
    })
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ ok: false, error: err.message }));

    return true;
  }
});
