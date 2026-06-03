/* global chrome */

const API_BASE = 'https://foundersystems.in';
const OVERLAY_ID = 'fs-candidate-overlay';
const BUTTON_ID = 'fs-summarize-btn';
const FREE_LIMIT = 100; // Generous for now — connect to real credit system later
const STORAGE_KEY = 'fs-profile-views';

function getViewCount() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '0'); } catch { return 0; }
}

function incrementViewCount() {
  const count = getViewCount() + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(count));
  return count;
}

function getBasicProfile() {
  const title = document.title.replace(' | LinkedIn', '');
  const parts = title.split(' - ');
  const name = parts[0]?.trim() || '';
  const headline = parts.slice(1).join(' - ').trim() || '';
  const main = document.querySelector('main');
  const visibleText = (main?.innerText || '').slice(0, 5000);
  return { name, headline, visibleText };
}

function showButton() {
  if (document.getElementById(BUTTON_ID)) return;

  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.innerHTML = `<span class="fs-btn-icon">FS</span> Summarize`;
  btn.addEventListener('click', handleSummarize);
  document.body.appendChild(btn);
}

function removeButton() {
  const btn = document.getElementById(BUTTON_ID);
  if (btn) btn.remove();
}

async function handleSummarize() {
  const profile = getBasicProfile();
  if (!profile.name) return;

  const viewCount = getViewCount();
  if (viewCount >= FREE_LIMIT) {
    showLockedOverlay(profile);
    removeButton();
    return;
  }

  // Show loading overlay
  showLoadingOverlay(profile);
  removeButton();
  incrementViewCount();

  // Call API
  const summary = await summarizeWithAI(profile);
  showResultOverlay(profile, summary);
}

function showLoadingOverlay(profile) {
  removeOverlay();
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.innerHTML = `
    <div class="fs-header">
      <div class="fs-brand">FS</div>
      <strong>${profile.name}</strong>
      <button class="fs-close" id="fs-close">×</button>
    </div>
    <p class="fs-headline">${profile.headline}</p>
    <div class="fs-loading">
      <div class="fs-loading-bar"></div>
      <span>Summarizing...</span>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('fs-close').addEventListener('click', removeOverlay);
}

function showLockedOverlay(profile) {
  removeOverlay();
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.innerHTML = `
    <div class="fs-header">
      <div class="fs-brand">FS</div>
      <strong>${profile.name}</strong>
      <button class="fs-close" id="fs-close">×</button>
    </div>
    <p class="fs-headline">${profile.headline}</p>
    <div class="fs-locked">
      <p><strong>3 free summaries used</strong></p>
      <p>Get credits to keep summarizing and screening candidates.</p>
      <a href="https://foundersystems.in/account?tab=billing" target="_blank" class="fs-btn-primary">Get credits</a>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('fs-close').addEventListener('click', removeOverlay);
}

function showResultOverlay(profile, summary) {
  removeOverlay();
  const remaining = Math.max(0, FREE_LIMIT - getViewCount());
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  const s = summary || {};
  overlay.innerHTML = `
    <div class="fs-header">
      <div class="fs-brand">FS</div>
      <strong>${profile.name}</strong>
      <button class="fs-close" id="fs-close">×</button>
    </div>
    ${s.domain ? `<div class="fs-tags"><span class="fs-tag-domain">${s.domain}</span>${s.seniority ? `<span class="fs-tag-level">${s.seniority}</span>` : ''}</div>` : ''}
    <p class="fs-summary">${s.candidateSummary || profile.headline}</p>
    ${s.experience?.length ? `<div class="fs-section"><label>Experience</label><ul>${s.experience.map(e => `<li>${e}</li>`).join('')}</ul></div>` : ''}
    ${s.education?.length ? `<div class="fs-section"><label>Education</label><ul>${s.education.map(e => `<li>${e}</li>`).join('')}</ul></div>` : ''}
    ${s.skills?.length ? `<div class="fs-section"><label>Skills</label><div class="fs-skills">${s.skills.map(sk => `<span class="fs-skill">${sk}</span>`).join('')}</div></div>` : ''}
    ${s.fitSignals?.length ? `<div class="fs-section"><label>Key signals</label><ul>${s.fitSignals.map(f => `<li>${f}</li>`).join('')}</ul></div>` : ''}
    <div class="fs-actions">
      <button class="fs-btn-save" id="fs-save">Save</button>
      <button class="fs-btn-primary" id="fs-screen-toggle">Screen against JD</button>
    </div>
    <div class="fs-screen hidden" id="fs-screen-area">
      <textarea id="fs-jd" placeholder="Paste JD here..." rows="3"></textarea>
      <button class="fs-btn-primary" id="fs-run-screen">Screen · 1 credit</button>
      <div id="fs-screen-result"></div>
    </div>
    <div class="fs-footer">${remaining} free left · <a href="https://foundersystems.in/tools/linkedin-candidate-screener" target="_blank">About</a></div>
    <div class="fs-toast hidden" id="fs-toast">✓ Saved</div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('fs-close').addEventListener('click', removeOverlay);
  document.getElementById('fs-save').addEventListener('click', () => {
    const saved = JSON.parse(localStorage.getItem('fs-saved-profiles') || '[]');
    saved.unshift({ ...profile, summary: s, url: location.href, savedAt: new Date().toISOString() });
    localStorage.setItem('fs-saved-profiles', JSON.stringify(saved.slice(0, 50)));
    const toast = document.getElementById('fs-toast');
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 1500);
  });
  document.getElementById('fs-screen-toggle').addEventListener('click', () => {
    document.getElementById('fs-screen-area').classList.toggle('hidden');
  });
  document.getElementById('fs-run-screen').addEventListener('click', async () => {
    const jd = document.getElementById('fs-jd').value.trim();
    if (!jd) return;
    const btn = document.getElementById('fs-run-screen');
    btn.disabled = true; btn.textContent = 'Screening...';
    try {
      const resp = await fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd, profile: { fullName: profile.name, headline: profile.headline, about: profile.visibleText.slice(0, 2000), experience: s.experience || [], skills: s.skills || [] } }),
      });
      const data = await resp.json();
      const el = document.getElementById('fs-screen-result');
      if (data?.ok) {
        el.innerHTML = `<div class="fs-tags"><span class="fs-tag-domain">${data.verdict}</span><span class="fs-tag-level">${data.confidence}</span></div><p class="fs-summary">${data.candidateSummary || ''}</p>`;
      } else {
        el.innerHTML = `<p class="fs-error">${data?.error || 'Failed'}</p>`;
      }
    } catch (e) { document.getElementById('fs-screen-result').innerHTML = `<p class="fs-error">${e.message}</p>`; }
    finally { btn.disabled = false; btn.textContent = 'Screen · 1 credit'; }
  });
}

function removeOverlay() {
  const el = document.getElementById(OVERLAY_ID);
  if (el) el.remove();
  showButton(); // Show button again after closing
}

async function summarizeWithAI(profile) {
  try {
    const resp = await fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: '__summarize_only__', profile: { fullName: profile.name, headline: profile.headline, about: profile.visibleText.slice(0, 3000), experience: [], skills: [] } }),
    });
    const data = await resp.json();
    if (data?.ok) return data;
  } catch {}
  return null;
}

// Show the button when on a profile page
function init() {
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent.trim().length > 1 && location.href.includes('/in/')) {
    showButton();
  } else {
    setTimeout(() => {
      if (location.href.includes('/in/')) showButton();
    }, 2000);
  }
}

init();

// SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    removeOverlay();
    removeButton();
    if (location.href.includes('/in/')) {
      setTimeout(init, 1500);
    }
  }
}).observe(document.body, { childList: true, subtree: true });
