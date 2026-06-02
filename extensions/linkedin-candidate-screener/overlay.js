/* global chrome */

const API_BASE = 'https://foundersystems.in';
const OVERLAY_ID = 'fs-candidate-overlay';

function waitForProfile(maxWait = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    function check() {
      const h1 = document.querySelector('h1');
      if (h1 && h1.textContent.trim().length > 1) {
        resolve();
        return;
      }
      if (Date.now() - start > maxWait) {
        resolve();
        return;
      }
      setTimeout(check, 500);
    }
    check();
  });
}

function extractProfileData() {
  const title = document.title || '';
  const titleClean = title.replace(' | LinkedIn', '');
  const titleParts = titleClean.split(' - ');
  const nameFromTitle = titleParts[0]?.trim() || '';
  const headlineFromTitle = titleParts.slice(1).join(' - ').trim() || '';

  // Name from h1
  let fullName = '';
  for (const h1 of document.querySelectorAll('h1')) {
    const text = h1.textContent.trim();
    if (text && text.length > 1 && text.length < 60) {
      fullName = text;
      break;
    }
  }

  // Get profile section inner text for parsing
  const main = document.querySelector('main');
  const profileSection = main?.querySelector('section');
  const profileText = profileSection?.innerText || '';
  const lines = profileText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Headline: from title or first meaningful line after name
  let headline = headlineFromTitle;
  if (!headline) {
    for (const line of lines) {
      if (line !== fullName && line.length > 10 && line.length < 200 && !line.includes('Message') && !line.includes('connections')) {
        headline = line;
        break;
      }
    }
  }

  // Location: line with comma (City, State pattern)
  let location = '';
  for (const line of lines) {
    if (line.includes(',') && line.length < 50 && !line.includes('|') && !line.includes('http')) {
      location = line;
      break;
    }
  }

  // Experience: look for section with id=experience
  const experience = [];
  const expAnchor = document.getElementById('experience');
  if (expAnchor) {
    const section = expAnchor.closest('section');
    if (section) {
      const allSpans = section.querySelectorAll('span[aria-hidden="true"]');
      for (const span of allSpans) {
        const text = span.textContent.trim();
        if (text && text.length > 3 && text.length < 120 && experience.length < 8 && !experience.includes(text)) {
          experience.push(text);
        }
      }
    }
  }

  // Education
  const education = [];
  const eduAnchor = document.getElementById('education');
  if (eduAnchor) {
    const section = eduAnchor.closest('section');
    if (section) {
      const allSpans = section.querySelectorAll('span[aria-hidden="true"]');
      for (const span of allSpans) {
        const text = span.textContent.trim();
        if (text && text.length > 3 && text.length < 120 && education.length < 6 && !education.includes(text)) {
          education.push(text);
        }
      }
    }
  }

  // Skills
  const skills = [];
  const skillsAnchor = document.getElementById('skills');
  if (skillsAnchor) {
    const section = skillsAnchor.closest('section');
    if (section) {
      const allSpans = section.querySelectorAll('span[aria-hidden="true"]');
      for (const span of allSpans) {
        const text = span.textContent.trim();
        if (text && text.length > 1 && text.length < 50 && skills.length < 12 && !skills.includes(text)) {
          skills.push(text);
        }
      }
    }
  }

  // Infer domain from headline
  const domains = [];
  const headlineLower = (headline || '').toLowerCase();
  const domainMap = {
    'Finance': ['finance', 'accounting', 'ca ', 'cpa', 'cfa', 'audit', 'tax', 'banking'],
    'Engineering': ['engineer', 'developer', 'software', 'backend', 'frontend', 'fullstack', 'devops'],
    'Design': ['design', 'ux', 'ui', 'creative', 'graphic'],
    'Marketing': ['marketing', 'growth', 'seo', 'content', 'brand'],
    'Sales': ['sales', 'business development', 'bd', 'account executive'],
    'Product': ['product manager', 'product lead', 'pm'],
    'Data': ['data', 'analytics', 'machine learning', 'ai', 'ml'],
    'Operations': ['operations', 'ops', 'supply chain', 'logistics'],
    'HR': ['hr', 'human resources', 'talent', 'recruiter', 'people'],
    'Legal': ['legal', 'lawyer', 'advocate', 'compliance'],
  };
  for (const [domain, keywords] of Object.entries(domainMap)) {
    if (keywords.some(k => headlineLower.includes(k))) {
      domains.push(domain);
    }
  }
  if (domains.length === 0) domains.push('General');

  return { fullName: fullName || nameFromTitle, headline, location, experience, education, skills, domains };
}

function createOverlay(profile) {
  // Remove existing overlay
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  const domainChips = profile.domains.map(d =>
    `<span class="fs-chip fs-chip--domain">${d}</span>`
  ).join('');

  const skillChips = profile.skills.slice(0, 8).map(s =>
    `<span class="fs-chip fs-chip--skill">${s}</span>`
  ).join('');

  const expItems = profile.experience.slice(0, 5).map(e =>
    `<li>${e}</li>`
  ).join('');

  const eduItems = profile.education.slice(0, 3).map(e =>
    `<li>${e}</li>`
  ).join('');

  overlay.innerHTML = `
    <div class="fs-overlay-header">
      <div class="fs-overlay-brand">FS</div>
      <div class="fs-overlay-title">
        <strong>${profile.fullName}</strong>
        <span class="fs-overlay-location">${profile.location || ''}</span>
      </div>
      <button class="fs-overlay-close" id="fs-close-overlay">×</button>
    </div>
    <div class="fs-overlay-headline">${profile.headline || ''}</div>
    <div class="fs-overlay-domains">${domainChips}</div>
    ${expItems ? `<div class="fs-overlay-section"><p class="fs-section-label">Experience</p><ul>${expItems}</ul></div>` : ''}
    ${eduItems ? `<div class="fs-overlay-section"><p class="fs-section-label">Education</p><ul>${eduItems}</ul></div>` : ''}
    ${skillChips ? `<div class="fs-overlay-section"><p class="fs-section-label">Skills</p><div class="fs-chips-wrap">${skillChips}</div></div>` : ''}
    <div class="fs-overlay-actions">
      <button class="fs-btn fs-btn--save" id="fs-save-profile">Save profile</button>
      <button class="fs-btn fs-btn--screen" id="fs-screen-profile">Screen against role</button>
    </div>
    <div class="fs-overlay-saved hidden" id="fs-saved-msg">✓ Profile saved</div>
  `;

  document.body.appendChild(overlay);

  // Event listeners
  document.getElementById('fs-close-overlay').addEventListener('click', () => {
    overlay.classList.add('fs-overlay--collapsed');
  });

  overlay.addEventListener('click', (e) => {
    if (overlay.classList.contains('fs-overlay--collapsed') && e.target.id !== 'fs-close-overlay') {
      overlay.classList.remove('fs-overlay--collapsed');
    }
  });

  document.getElementById('fs-save-profile').addEventListener('click', async () => {
    const saved = JSON.parse(localStorage.getItem('fs-saved-profiles') || '[]');
    const entry = { ...profile, url: window.location.href, savedAt: new Date().toISOString() };
    saved.unshift(entry);
    localStorage.setItem('fs-saved-profiles', JSON.stringify(saved.slice(0, 50)));
    document.getElementById('fs-saved-msg').classList.remove('hidden');
    setTimeout(() => document.getElementById('fs-saved-msg').classList.add('hidden'), 2000);
  });

  document.getElementById('fs-screen-profile').addEventListener('click', () => {
    // Open the popup for screening
    const url = chrome.runtime.getURL('popup.html');
    window.open(url, 'fs-screener', 'width=400,height=600');
  });
}

// Main: wait for profile to load, then show overlay
async function init() {
  await waitForProfile();
  const profile = extractProfileData();
  if (profile.fullName && profile.fullName !== 'Unknown') {
    createOverlay(profile);
  }
}

// Run on page load and on URL changes (LinkedIn SPA navigation)
init();

let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (location.href.includes('/in/')) {
      setTimeout(init, 2000); // Wait for new profile to render
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
