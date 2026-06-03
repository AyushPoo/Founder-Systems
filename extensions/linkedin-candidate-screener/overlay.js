/* global chrome */

const API_BASE = 'https://foundersystems.in';
const OVERLAY_ID = 'fs-candidate-overlay';
const BUTTON_ID = 'fs-summarize-btn';

function showButton() {
  if (document.getElementById(BUTTON_ID)) return;
  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.textContent = '⚡ Summarize Profile';
  btn.addEventListener('click', handleClick);
  document.body.appendChild(btn);
}

function removeButton() {
  const el = document.getElementById(BUTTON_ID);
  if (el) el.remove();
}

function removeOverlay() {
  const el = document.getElementById(OVERLAY_ID);
  if (el) el.remove();
}

function showOverlay(html) {
  removeOverlay();
  const div = document.createElement('div');
  div.id = OVERLAY_ID;
  div.innerHTML = html;
  document.body.appendChild(div);
  div.querySelector('#fs-close')?.addEventListener('click', () => { removeOverlay(); showButton(); });
}

async function handleClick() {
  removeButton();

  // Show loading
  showOverlay(`
    <div class="fs-row"><div class="fs-brand">FS</div><strong>Summarizing...</strong><button id="fs-close" class="fs-close">×</button></div>
    <div class="fs-loading"><div class="fs-bar"></div></div>
  `);

  // Grab ALL text from the page
  const main = document.querySelector('main');
  const rawText = (main?.innerText || document.body.innerText || '').slice(0, 6000);

  // Get name from h1
  let name = '';
  for (const h1 of document.querySelectorAll('h1')) {
    const t = h1.textContent.trim();
    if (t.length > 1 && t.length < 60) { name = t; break; }
  }

  try {
    const resp = await fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: '__summarize_only__',
        profile: {
          fullName: name,
          headline: '',
          about: rawText,
          experience: [],
          skills: [],
        },
      }),
    });

    const data = await resp.json();

    if (data?.ok) {
      const d = data;
      showOverlay(`
        <div class="fs-row"><div class="fs-brand">FS</div><strong>${name}</strong><button id="fs-close" class="fs-close">×</button></div>
        ${d.domain ? `<div class="fs-tags"><span class="fs-tag">${d.domain}</span>${d.seniority ? `<span class="fs-tag-light">${d.seniority}</span>` : ''}</div>` : ''}
        ${d.candidateSummary ? `<p class="fs-text">${d.candidateSummary}</p>` : ''}
        ${d.experience?.length ? `<div class="fs-sec"><label>Experience</label><ul>${d.experience.map(e=>`<li>${e}</li>`).join('')}</ul></div>` : ''}
        ${d.education?.length ? `<div class="fs-sec"><label>Education</label><ul>${d.education.map(e=>`<li>${e}</li>`).join('')}</ul></div>` : ''}
        ${d.skills?.length ? `<div class="fs-sec"><label>Skills</label><div class="fs-chips">${d.skills.map(s=>`<span class="fs-chip">${s}</span>`).join('')}</div></div>` : ''}
        ${d.fitSignals?.length ? `<div class="fs-sec"><label>Signals</label><ul>${d.fitSignals.map(s=>`<li>${s}</li>`).join('')}</ul></div>` : ''}
        <div class="fs-actions"><button id="fs-close" class="fs-close-btn">Close</button></div>
      `);
    } else {
      showOverlay(`
        <div class="fs-row"><div class="fs-brand">FS</div><strong>${name}</strong><button id="fs-close" class="fs-close">×</button></div>
        <p class="fs-error">${data?.error || 'Summarization failed. Try again.'}</p>
      `);
    }
  } catch (err) {
    showOverlay(`
      <div class="fs-row"><div class="fs-brand">FS</div><strong>${name || 'Error'}</strong><button id="fs-close" class="fs-close">×</button></div>
      <p class="fs-error">Could not reach the API: ${err.message}</p>
    `);
  }
}

// Init: show button on LinkedIn profile pages
function init() {
  if (location.href.includes('/in/')) {
    setTimeout(showButton, 1500);
  }
}

init();

// Handle LinkedIn SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    removeOverlay();
    removeButton();
    if (location.href.includes('/in/')) setTimeout(showButton, 1500);
  }
}).observe(document.body, { childList: true, subtree: true });
