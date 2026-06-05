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

// Fast-scroll the page to trigger LinkedIn's lazy loading, then return full text
function loadFullProfile() {
  return new Promise((resolve) => {
    const originalPosition = window.scrollY;
    const totalHeight = document.body.scrollHeight;
    let currentPos = 0;
    const step = 600;
    
    function scrollStep() {
      if (currentPos >= totalHeight) {
        // Done scrolling — wait for DOM to settle, then grab text and scroll back
        setTimeout(() => {
          window.scrollTo(0, originalPosition);
          // Grab text from ALL sections now that they're loaded
          const main = document.querySelector('main');
          const text = main?.innerText || document.body.innerText || '';
          resolve(text);
        }, 600);
        return;
      }
      window.scrollTo(0, currentPos);
      currentPos += step;
      setTimeout(scrollStep, 80);
    }
    
    scrollStep();
  });
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

  showOverlay(`
    <div class="fs-row"><div class="fs-brand">FS</div><strong>Reading full profile...</strong><button id="fs-close" class="fs-close">×</button></div>
    <div class="fs-loading"><div class="fs-bar"></div></div>
  `);

  // Step 1: Fast-scroll the page to force LinkedIn to load ALL sections
  // Then grab complete text. User won't notice — it takes <2 seconds.
  const fullText = await loadFullProfile();
  
  let name = '';
  for (const h1 of document.querySelectorAll('h1')) {
    const t = h1.textContent.trim();
    if (t.length > 1 && t.length < 60) { name = t; break; }
  }

  const rawText = fullText.slice(0, 8000);

  try {
    const data = await chrome.runtime.sendMessage({
      type: 'summarize-profile',
      name: name,
      text: rawText,
    });

    if (data?.ok) {
      // Handle various response shapes the model might return
      const d = data.candidate || data.profile || data;
      const domain = d.domain || data.domain || '';
      const seniority = d.seniority || data.seniority || '';
      const tagline = d.tagline || data.tagline || d.headline || '';
      const background = d.background || data.background || d.candidateSummary || data.candidateSummary || d.summary || '';
      const career = d.career || data.career || d.experience || data.experience || [];
      const goodFor = d.goodFor || data.goodFor || d.fitFor || '';
      const credentials = d.credentials || data.credentials || d.education || data.education || '';
      const skills = d.topSkills || data.topSkills || d.skills || data.skills || [];

      showOverlay(`
        <div class="fs-row"><div class="fs-brand">FS</div><strong>${name}</strong><button id="fs-close" class="fs-close">×</button></div>
        ${domain ? `<div class="fs-tags"><span class="fs-tag">${domain}</span>${seniority ? `<span class="fs-tag-light">${seniority}</span>` : ''}</div>` : ''}
        ${tagline ? `<p class="fs-tagline">${tagline}</p>` : ''}
        ${background ? `<p class="fs-text">${typeof background === 'string' ? background : ''}</p>` : ''}
        ${Array.isArray(career) && career.length ? `<div class="fs-sec"><label>Career</label><div class="fs-career">${career.map(c => typeof c === 'string' ? `<div class="fs-career-item">${c}</div>` : `<div class="fs-career-item"><strong>${c.role||c.title||''}</strong> at ${c.company||''} <span class="fs-period">${c.period||c.dates||''}</span>${c.note?`<br><span class="fs-note">${c.note}</span>`:''}</div>`).join('')}</div></div>` : ''}
        ${goodFor ? `<div class="fs-sec"><label>Good fit for</label><p class="fs-goodfor">${typeof goodFor === 'string' ? goodFor : Array.isArray(goodFor) ? goodFor.join(', ') : ''}</p></div>` : ''}
        ${credentials ? `<div class="fs-sec"><label>Credentials</label><p class="fs-edu">${typeof credentials === 'string' ? credentials : Array.isArray(credentials) ? credentials.join(', ') : ''}</p></div>` : ''}
        ${Array.isArray(skills) && skills.length ? `<div class="fs-sec"><label>Skills</label><div class="fs-chips">${skills.slice(0,6).map(s=>`<span class="fs-chip">${typeof s === 'string' ? s : s.name || ''}</span>`).join('')}</div></div>` : ''}
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
