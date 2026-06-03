/* global chrome */

const API_BASE = 'https://foundersystems.in';
const OVERLAY_ID = 'fs-candidate-overlay';
const FREE_LIMIT = 3;
const STORAGE_KEY = 'fs-profile-views';

function getViewCount() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '0'); } catch { return 0; }
}

function incrementViewCount() {
  const count = getViewCount() + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(count));
  return count;
}

function waitForName(maxWait = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    function check() {
      const h1 = document.querySelector('h1');
      if (h1 && h1.textContent.trim().length > 1) { resolve(); return; }
      if (Date.now() - start > maxWait) { resolve(); return; }
      setTimeout(check, 400);
    }
    check();
  });
}

function getBasicProfile() {
  const title = document.title.replace(' | LinkedIn', '');
  const parts = title.split(' - ');
  const name = parts[0]?.trim() || '';
  const headline = parts.slice(1).join(' - ').trim() || '';
  
  // Grab all visible text from page for AI to summarize
  const main = document.querySelector('main');
  const visibleText = (main?.innerText || document.body.innerText || '').slice(0, 5000);
  
  return { name, headline, visibleText };
}

function createOverlay(profile, summary) {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) existing.remove();

  const viewCount = getViewCount();
  const isFree = viewCount < FREE_LIMIT;
  const remaining = Math.max(0, FREE_LIMIT - viewCount);
  incrementViewCount();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  if (!isFree && !summary) {
    // Locked state
    overlay.innerHTML = `
      <div class="fs-overlay-header">
        <div class="fs-overlay-brand">FS</div>
        <div class="fs-overlay-title"><strong>${profile.name}</strong></div>
        <button class="fs-overlay-close" id="fs-close-overlay">×</button>
      </div>
      <div class="fs-overlay-headline">${profile.headline}</div>
      <div class="fs-overlay-locked">
        <p class="fs-locked-title">3 free summaries used</p>
        <p class="fs-locked-text">Get credits to keep summarizing profiles and screening candidates.</p>
        <a href="https://foundersystems.in/account?tab=billing" target="_blank" class="fs-btn fs-btn--screen">Get credits</a>
      </div>
    `;
  } else if (summary) {
    // AI summary loaded
    overlay.innerHTML = `
      <div class="fs-overlay-header">
        <div class="fs-overlay-brand">FS</div>
        <div class="fs-overlay-title"><strong>${profile.name}</strong></div>
        <button class="fs-overlay-close" id="fs-close-overlay">×</button>
      </div>
      <div class="fs-overlay-domains">${summary.domain ? `<span class="fs-chip fs-chip--domain">${summary.domain}</span>` : ''}${summary.seniority ? `<span class="fs-chip fs-chip--skill">${summary.seniority}</span>` : ''}</div>
      <div class="fs-overlay-section"><p class="fs-section-label">Summary</p><p class="fs-summary-text">${summary.oneLiner || profile.headline}</p></div>
      ${summary.experience?.length ? `<div class="fs-overlay-section"><p class="fs-section-label">Work Experience</p><ul>${summary.experience.map(e => `<li>${e}</li>`).join('')}</ul></div>` : ''}
      ${summary.education?.length ? `<div class="fs-overlay-section"><p class="fs-section-label">Education</p><ul>${summary.education.map(e => `<li>${e}</li>`).join('')}</ul></div>` : ''}
      ${summary.skills?.length ? `<div class="fs-overlay-section"><p class="fs-section-label">Skills</p><div class="fs-chips-wrap">${summary.skills.map(s => `<span class="fs-chip fs-chip--skill">${s}</span>`).join('')}</div></div>` : ''}
      ${summary.signals?.length ? `<div class="fs-overlay-section"><p class="fs-section-label">Key Signals</p><ul>${summary.signals.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
      <div class="fs-overlay-actions">
        <button class="fs-btn fs-btn--save" id="fs-save-profile">Save</button>
        <button class="fs-btn fs-btn--screen" id="fs-screen-btn">Screen against JD · 1 credit</button>
      </div>
      <div class="fs-overlay-saved hidden" id="fs-saved-msg">✓ Saved</div>
      <div class="fs-screen-area hidden" id="fs-screen-area">
        <textarea class="fs-jd-input" id="fs-jd-input" rows="3" placeholder="Paste JD here..."></textarea>
        <button class="fs-btn fs-btn--screen" id="fs-run-screen">Run screen</button>
        <div class="fs-screen-result hidden" id="fs-screen-result"></div>
      </div>
      <div class="fs-overlay-footer"><span class="fs-footer-text">${remaining > 0 ? remaining + ' free left' : 'Paid mode'} · <a href="https://foundersystems.in/tools/linkedin-candidate-screener" target="_blank">About</a></span></div>
    `;
  } else {
    // Loading state
    overlay.innerHTML = `
      <div class="fs-overlay-header">
        <div class="fs-overlay-brand">FS</div>
        <div class="fs-overlay-title"><strong>${profile.name}</strong></div>
        <button class="fs-overlay-close" id="fs-close-overlay">×</button>
      </div>
      <div class="fs-overlay-headline">${profile.headline}</div>
      <div class="fs-overlay-loading">Summarizing profile...</div>
    `;
  }

  document.body.appendChild(overlay);

  // Close/collapse
  document.getElementById('fs-close-overlay')?.addEventListener('click', () => {
    overlay.classList.add('fs-overlay--collapsed');
  });
  overlay.addEventListener('click', (e) => {
    if (overlay.classList.contains('fs-overlay--collapsed') && !e.target.closest('.fs-overlay-close')) {
      overlay.classList.remove('fs-overlay--collapsed');
    }
  });

  // Save
  document.getElementById('fs-save-profile')?.addEventListener('click', () => {
    const saved = JSON.parse(localStorage.getItem('fs-saved-profiles') || '[]');
    saved.unshift({ ...profile, summary, url: location.href, savedAt: new Date().toISOString() });
    localStorage.setItem('fs-saved-profiles', JSON.stringify(saved.slice(0, 50)));
    const msg = document.getElementById('fs-saved-msg');
    if (msg) { msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 2000); }
  });

  // Screen toggle
  document.getElementById('fs-screen-btn')?.addEventListener('click', () => {
    document.getElementById('fs-screen-area')?.classList.toggle('hidden');
  });

  // Run screen
  document.getElementById('fs-run-screen')?.addEventListener('click', async () => {
    const jd = document.getElementById('fs-jd-input')?.value?.trim();
    if (!jd) return;
    const btn = document.getElementById('fs-run-screen');
    btn.disabled = true; btn.textContent = 'Screening...';
    try {
      const resp = await fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd, profile: { fullName: profile.name, headline: profile.headline, about: profile.visibleText.slice(0, 2000), experience: summary?.experience || [], skills: summary?.skills || [] } }),
      });
      const data = await resp.json();
      const result = document.getElementById('fs-screen-result');
      result.classList.remove('hidden');
      if (data?.ok) {
        result.innerHTML = `<span class="fs-chip fs-chip--domain">${data.verdict}</span> <span class="fs-chip fs-chip--skill">${data.confidence}</span><p class="fs-result-summary">${data.candidateSummary || ''}</p>`;
      } else {
        result.innerHTML = `<p class="fs-error">${data?.error || 'Failed'}</p>`;
      }
    } catch (e) { document.getElementById('fs-screen-result').innerHTML = `<p class="fs-error">${e.message}</p>`; }
    finally { btn.disabled = false; btn.textContent = 'Run screen'; }
  });
}

async function summarizeWithAI(profile) {
  try {
    const resp = await fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: '__summarize_only__',
        profile: {
          fullName: profile.name,
          headline: profile.headline,
          about: profile.visibleText.slice(0, 3000),
          experience: [],
          skills: [],
        },
      }),
    });
    const data = await resp.json();
    if (data?.ok) {
      return {
        domain: data.domain || '',
        seniority: data.seniority || '',
        oneLiner: data.candidateSummary || '',
        experience: data.experience || [],
        education: data.education || [],
        skills: data.skills || [],
        signals: data.fitSignals || [],
      };
    }
  } catch {}
  return null;
}

async function init() {
  await waitForName();
  const profile = getBasicProfile();
  if (!profile.name || profile.name === 'Unknown') return;

  const viewCount = getViewCount();
  if (viewCount >= FREE_LIMIT) {
    createOverlay(profile, null);
    return;
  }

  // Show loading state immediately
  createOverlay(profile, null);
  document.querySelector(`#${OVERLAY_ID} .fs-overlay-loading`)?.classList.remove('hidden');

  // Call AI to summarize
  const summary = await summarizeWithAI(profile);
  if (summary) {
    createOverlay(profile, summary);
  }
}

// Run
init();

// Watch for LinkedIn SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (location.href.includes('/in/')) {
      setTimeout(init, 2000);
    } else {
      const el = document.getElementById(OVERLAY_ID);
      if (el) el.remove();
    }
  }
}).observe(document.body, { childList: true, subtree: true });
