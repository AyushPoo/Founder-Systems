/* global chrome */

const API_BASE = 'https://foundersystems.in';
const OVERLAY_ID = 'fs-candidate-overlay';
const FREE_LIMIT = 3;
const STORAGE_KEY = 'fs-profile-views';

function getViewCount() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '0');
  } catch { return 0; }
}

function incrementViewCount() {
  const count = getViewCount() + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(count));
  return count;
}

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

// Scroll down to trigger lazy-loading of experience/education/skills sections
function triggerLazyLoad() {
  return new Promise((resolve) => {
    const scrollPositions = [300, 800, 1400, 2000, 2600];
    let i = 0;
    function scrollNext() {
      if (i >= scrollPositions.length) {
        // Scroll back to top
        window.scrollTo(0, 0);
        setTimeout(resolve, 300);
        return;
      }
      window.scrollTo(0, scrollPositions[i]);
      i++;
      setTimeout(scrollNext, 200);
    }
    scrollNext();
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

  const viewCount = getViewCount();
  const isFree = viewCount < FREE_LIMIT;
  const remaining = Math.max(0, FREE_LIMIT - viewCount);

  // Increment view count
  incrementViewCount();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  const domainChips = profile.domains.map(d =>
    `<span class="fs-chip fs-chip--domain">${d}</span>`
  ).join('');

  const skillChips = profile.skills.slice(0, 8).map(s =>
    `<span class="fs-chip fs-chip--skill">${s}</span>`
  ).join('');

  const expItems = profile.experience.slice(0, 6).map(e =>
    `<li>${e}</li>`
  ).join('');

  const eduItems = profile.education.slice(0, 4).map(e =>
    `<li>${e}</li>`
  ).join('');

  // Build content based on free/paid
  const profileContent = isFree ? `
    <div class="fs-overlay-headline">${profile.headline || ''}</div>
    <div class="fs-overlay-domains">${domainChips}</div>
    ${expItems ? `<div class="fs-overlay-section"><p class="fs-section-label">Work Experience</p><ul>${expItems}</ul></div>` : '<div class="fs-overlay-section"><p class="fs-section-label">Work Experience</p><p class="fs-empty">Scroll down on the profile to load experience data</p></div>'}
    ${eduItems ? `<div class="fs-overlay-section"><p class="fs-section-label">Education</p><ul>${eduItems}</ul></div>` : ''}
    ${skillChips ? `<div class="fs-overlay-section"><p class="fs-section-label">Skills</p><div class="fs-chips-wrap">${skillChips}</div></div>` : ''}
    <div class="fs-overlay-actions">
      <button class="fs-btn fs-btn--save" id="fs-save-profile">Save profile</button>
    </div>
    <div class="fs-overlay-footer">
      <span class="fs-footer-text">${remaining} free views left · <a href="https://foundersystems.in/tools/linkedin-candidate-screener" target="_blank">Get more</a></span>
    </div>
  ` : `
    <div class="fs-overlay-headline">${profile.headline || ''}</div>
    <div class="fs-overlay-domains">${domainChips}</div>
    <div class="fs-overlay-locked">
      <p class="fs-locked-title">Free views used</p>
      <p class="fs-locked-text">You've used your 3 free profile summaries. Get credits to continue screening.</p>
      <a href="https://foundersystems.in/account?tab=billing" target="_blank" class="fs-btn fs-btn--screen">Get credits</a>
    </div>
  `;

  // Paid screening section (only for free users who haven't exhausted views)
  const screenSection = isFree ? `
    <div class="fs-overlay-section fs-screen-section" id="fs-screen-section">
      <p class="fs-section-label">Screen against a role · <span class="fs-paid-badge">1 credit</span></p>
      <textarea class="fs-jd-input" id="fs-jd-input" rows="3" placeholder="Paste JD to rate this candidate against a role..."></textarea>
      <button class="fs-btn fs-btn--screen" id="fs-screen-btn">Screen · 1 credit</button>
      <div class="fs-screen-result hidden" id="fs-screen-result"></div>
    </div>
  ` : '';

  overlay.innerHTML = `
    <div class="fs-overlay-header">
      <div class="fs-overlay-brand">FS</div>
      <div class="fs-overlay-title">
        <strong>${profile.fullName}</strong>
        <span class="fs-overlay-location">${profile.location || ''}</span>
      </div>
      <button class="fs-overlay-close" id="fs-close-overlay">×</button>
    </div>
    ${profileContent}
    ${screenSection}
    <div class="fs-overlay-saved hidden" id="fs-saved-msg">✓ Profile saved</div>
  `;

  document.body.appendChild(overlay);

  // Close button
  document.getElementById('fs-close-overlay').addEventListener('click', () => {
    overlay.classList.add('fs-overlay--collapsed');
  });

  overlay.addEventListener('click', (e) => {
    if (overlay.classList.contains('fs-overlay--collapsed') && e.target.id !== 'fs-close-overlay') {
      overlay.classList.remove('fs-overlay--collapsed');
    }
  });

  // Save button
  const saveBtn = document.getElementById('fs-save-profile');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const saved = JSON.parse(localStorage.getItem('fs-saved-profiles') || '[]');
      const entry = { ...profile, url: window.location.href, savedAt: new Date().toISOString() };
      saved.unshift(entry);
      localStorage.setItem('fs-saved-profiles', JSON.stringify(saved.slice(0, 50)));
      document.getElementById('fs-saved-msg').classList.remove('hidden');
      setTimeout(() => document.getElementById('fs-saved-msg').classList.add('hidden'), 2000);
    });
  }

  // Screen button
  const screenBtn = document.getElementById('fs-screen-btn');
  if (screenBtn) {
    screenBtn.addEventListener('click', async () => {
      const jd = document.getElementById('fs-jd-input').value.trim();
      if (!jd) return;
      screenBtn.disabled = true;
      screenBtn.textContent = 'Screening...';
      try {
        const response = await fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobDescription: jd,
            resumeText: '',
            includeActivity: true,
            includeExternalLinks: false,
            profile: {
              fullName: profile.fullName,
              headline: profile.headline,
              currentCompany: '',
              about: profile.headline,
              experience: profile.experience,
              skills: profile.skills,
            },
          }),
        });
        const payload = await response.json();
        if (payload?.ok) {
          const resultDiv = document.getElementById('fs-screen-result');
          resultDiv.classList.remove('hidden');
          resultDiv.innerHTML = `
            <div class="fs-result-verdict"><span class="fs-chip fs-chip--domain">${payload.verdict || 'Unknown'}</span> <span class="fs-chip fs-chip--skill">${payload.confidence || ''}</span></div>
            <p class="fs-result-summary">${payload.candidateSummary || ''}</p>
            ${payload.fitSignals?.length ? '<p class="fs-section-label">Fit</p><ul>' + payload.fitSignals.map(s => `<li>${s}</li>`).join('') + '</ul>' : ''}
            ${payload.gapsOrRisks?.length ? '<p class="fs-section-label">Gaps</p><ul>' + payload.gapsOrRisks.map(s => `<li>${s}</li>`).join('') + '</ul>' : ''}
          `;
        } else {
          throw new Error(payload?.error || 'Screening failed');
        }
      } catch (err) {
        document.getElementById('fs-screen-result').classList.remove('hidden');
        document.getElementById('fs-screen-result').innerHTML = `<p class="fs-error">${err.message}</p>`;
      } finally {
        screenBtn.disabled = false;
        screenBtn.textContent = 'Screen · 1 credit';
      }
    });
  }
}

// Main: wait for profile to load, trigger lazy-load, then show overlay
async function init() {
  await waitForProfile();
  await triggerLazyLoad(); // Scroll to load experience/skills/education sections
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
