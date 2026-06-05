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
      // Ensure we have SOMETHING to show
      const hasContent = d.domain || d.tagline || d.background || d.candidateSummary || d.career?.length;
      if (!hasContent) {
        // API returned ok but empty — show raw response for debugging
        showOverlay(`
          <div class="fs-row"><div class="fs-brand">FS</div><strong>${name}</strong><button id="fs-close" class="fs-close">×</button></div>
          <p class="fs-text">Summary generated but content was empty. The AI may have hit a token limit.</p>
          <p class="fs-text" style="font-size:10px;color:#888">${JSON.stringify(d).slice(0, 300)}</p>
          <div class="fs-actions"><button id="fs-close" class="fs-close-btn">Close</button></div>
        `);
        return;
      }
      showOverlay(`
        <div class="fs-row"><div class="fs-brand">FS</div><strong>${name}</strong><button id="fs-close" class="fs-close">×</button></div>
        ${d.domain ? `<div class="fs-tags"><span class="fs-tag">${d.domain}</span>${d.seniority ? `<span class="fs-tag-light">${d.seniority}</span>` : ''}</div>` : ''}
        ${d.tagline ? `<p class="fs-tagline">${d.tagline}</p>` : ''}
        ${d.background ? `<p class="fs-text">${d.background}</p>` : (d.candidateSummary ? `<p class="fs-text">${d.candidateSummary}</p>` : '')}
        ${d.career?.length ? `<div class="fs-sec"><label>Career</label><div class="fs-career">${d.career.map(c=>`<div class="fs-career-item"><strong>${c.role}</strong> at ${c.company} <span class="fs-period">${c.period||''}</span>${c.note?`<br><span class="fs-note">${c.note}</span>`:''}</div>`).join('')}</div></div>` : ''}
        ${d.goodFor ? `<div class="fs-sec"><label>Good fit for</label><p class="fs-goodfor">${d.goodFor}</p></div>` : ''}
        ${d.credentials ? `<div class="fs-sec"><label>Credentials</label><p class="fs-edu">${d.credentials}</p></div>` : (d.education ? `<div class="fs-sec"><label>Credentials</label><p class="fs-edu">${typeof d.education === 'string' ? d.education : d.education.join(', ')}</p></div>` : '')}
        ${d.topSkills?.length ? `<div class="fs-sec"><label>Skills</label><div class="fs-chips">${d.topSkills.map(s=>`<span class="fs-chip">${s}</span>`).join('')}</div></div>` : (d.skills?.length ? `<div class="fs-sec"><label>Skills</label><div class="fs-chips">${d.skills.slice(0,6).map(s=>`<span class="fs-chip">${s}</span>`).join('')}</div></div>` : '')}
        <div class="fs-screen-section">
          <label>Screen against a role <span class="fs-paid">1 credit</span></label>
          <div class="fs-file-upload">
            <input type="file" id="fs-jd-file" accept=".pdf,.doc,.docx,.txt,.md" style="display:none" />
            <button id="fs-upload-btn" class="fs-upload-btn">📎 Upload JD</button>
            <span id="fs-file-name" class="fs-file-name"></span>
          </div>
          <textarea id="fs-jd" class="fs-input" rows="2" placeholder="Or paste JD here..."></textarea>
          <textarea id="fs-resume" class="fs-input" rows="2" placeholder="Optional: paste resume for a fit score..."></textarea>
          <button id="fs-run-screen" class="fs-screen-btn">Screen · get fit score</button>
          <div id="fs-screen-result"></div>
        </div>
        <div class="fs-actions"><button id="fs-close" class="fs-close-btn">Close</button></div>
      `);

      // Screen button handler
      document.getElementById('fs-run-screen')?.addEventListener('click', async () => {
        const jd = document.getElementById('fs-jd')?.value?.trim();
        const fileContent = document.getElementById('fs-jd-file')?.dataset?.content || '';
        const effectiveJd = jd || fileContent;
        if (!effectiveJd) return;
        const resume = document.getElementById('fs-resume')?.value?.trim() || '';
        const btn = document.getElementById('fs-run-screen');
        btn.disabled = true; btn.textContent = 'Screening...';
        const screenData = await chrome.runtime.sendMessage({
          type: 'screen-candidate',
          name, jd: effectiveJd, text: rawText + (resume ? '\n\nRESUME:\n' + resume : ''),
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

      // File upload handler
      document.getElementById('fs-upload-btn')?.addEventListener('click', () => {
        document.getElementById('fs-jd-file')?.click();
      });
      document.getElementById('fs-jd-file')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        document.getElementById('fs-file-name').textContent = file.name;
        // Read as text for txt/md, or just store the name for PDF (will be sent as context)
        try {
          const text = await file.text();
          document.getElementById('fs-jd-file').dataset.content = text.slice(0, 4000);
          document.getElementById('fs-jd').value = text.slice(0, 2000);
        } catch {
          document.getElementById('fs-file-name').textContent = file.name + ' (could not read — paste text instead)';
        }
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
