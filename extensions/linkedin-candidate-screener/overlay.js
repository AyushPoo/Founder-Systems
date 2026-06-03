/* global chrome */

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
    const data = await chrome.runtime.sendMessage({
      type: 'summarize-profile',
      name: name,
      text: rawText,
    });

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
        <div class="fs-screen-section">
          <label>Screen against a role <span class="fs-paid">1 credit</span></label>
          <textarea id="fs-jd" class="fs-input" rows="2" placeholder="Paste JD or role requirements..."></textarea>
          <textarea id="fs-resume" class="fs-input" rows="2" placeholder="Optional: paste resume text for higher accuracy..."></textarea>
          <button id="fs-run-screen" class="fs-screen-btn">Screen candidate</button>
          <div id="fs-screen-result"></div>
        </div>
        <div class="fs-actions"><button id="fs-close" class="fs-close-btn">Close</button></div>
      `);

      // Screen button handler
      document.getElementById('fs-run-screen')?.addEventListener('click', async () => {
        const jd = document.getElementById('fs-jd')?.value?.trim();
        if (!jd) return;
        const resume = document.getElementById('fs-resume')?.value?.trim() || '';
        const btn = document.getElementById('fs-run-screen');
        btn.disabled = true; btn.textContent = 'Screening...';
        const screenData = await chrome.runtime.sendMessage({
          type: 'screen-candidate',
          name, jd, text: rawText + (resume ? '\n\nRESUME:\n' + resume : ''),
          headline: d.candidateSummary || '',
          experience: d.experience || [],
          skills: d.skills || [],
        });
        const el = document.getElementById('fs-screen-result');
        if (screenData?.ok) {
          el.innerHTML = `<div class="fs-tags" style="margin-top:8px"><span class="fs-tag">${screenData.verdict}</span><span class="fs-tag-light">${screenData.confidence}</span></div><p class="fs-text">${screenData.candidateSummary||''}</p>${screenData.fitSignals?.length?'<ul>'+screenData.fitSignals.map(s=>`<li>${s}</li>`).join('')+'</ul>':''}${screenData.gapsOrRisks?.length?'<label style="margin-top:6px;display:block">Gaps</label><ul>'+screenData.gapsOrRisks.map(s=>`<li>${s}</li>`).join('')+'</ul>':''}`;
        } else {
          el.innerHTML = `<p class="fs-error">${screenData?.error || 'Screening failed'}</p>`;
        }
        btn.disabled = false; btn.textContent = 'Screen candidate';
      });
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
