/* global chrome */

const API_BASE = 'https://foundersystems.in';

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const profileState = document.getElementById('profileState');
const resultNode = document.getElementById('result');
const runButton = document.getElementById('runScreen');
const statusNode = document.getElementById('status');

let extractedProfile = null;

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? '#b42318' : 'rgba(27, 28, 26, 0.58)';
}

function renderList(id, items = []) {
  const node = document.getElementById(id);
  node.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    node.appendChild(li);
  });
}

function formatVerdict(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderProfileSummary(profile) {
  document.getElementById('profileName').textContent = profile.fullName || 'Unknown';
  document.getElementById('profileHeadline').textContent = profile.headline || '';
  document.getElementById('profileLocation').textContent = profile.location || '';

  if (profile.experience?.length) {
    show(document.getElementById('profileExperience'));
    const list = document.getElementById('experienceList');
    list.innerHTML = '';
    profile.experience.slice(0, 4).forEach((exp) => {
      const li = document.createElement('li');
      li.textContent = exp;
      list.appendChild(li);
    });
  }

  if (profile.skills?.length) {
    show(document.getElementById('profileSkills'));
    document.getElementById('skillsText').textContent = profile.skills.slice(0, 8).join(' · ');
  }

  if (profile.about) {
    show(document.getElementById('profileAbout'));
    document.getElementById('aboutText').textContent = 
      profile.about.length > 200 ? profile.about.slice(0, 200) + '...' : profile.about;
  }
}

function renderResult(payload) {
  show(resultNode);
  document.getElementById('verdict').textContent = formatVerdict(payload.verdict);
  document.getElementById('confidence').textContent = `${payload.confidence} confidence`;
  document.getElementById('candidateSummary').textContent = payload.candidateSummary || '';
  renderList('fitSignals', payload.fitSignals);
  renderList('gapsOrRisks', payload.gapsOrRisks);
  renderList('interviewChecks', payload.interviewChecks);
  renderList('recruiterNotes', payload.recruiterNotes);
}

async function extractProfile() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab?.id || !tab.url || !tab.url.includes('linkedin.com/in')) {
    throw new Error('Navigate to a LinkedIn profile page first.');
  }

  // Inject and execute the profile extraction directly — more reliable than content scripts
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      function textFrom(root, selectors) {
        for (const selector of selectors) {
          try {
            const node = root.querySelector(selector);
            const value = node?.textContent?.trim();
            if (value) return value;
          } catch {}
        }
        return '';
      }

      function listFrom(root, selectors, limit = 6) {
        const items = [];
        selectors.forEach((selector) => {
          try {
            root.querySelectorAll(selector).forEach((node) => {
              const value = node.textContent?.trim();
              if (value && !items.includes(value) && items.length < limit) {
                items.push(value);
              }
            });
          } catch {}
        });
        return items;
      }

      const fullName = textFrom(document, ['h1.text-heading-xlarge', 'h1[class*="text-heading"]', '.pv-top-card h1', 'h1']);
      const headline = textFrom(document, ['.text-body-medium.break-words', 'div.text-body-medium', '.pv-text-details__left-panel div.text-body-medium']);
      const location = textFrom(document, ['.text-body-small.inline.t-black--light.break-words', 'span.text-body-small.inline.t-black--light']);
      const about = textFrom(document, ['#about ~ div .display-flex.ph5.pv3', '#about ~ div span[aria-hidden="true"]', 'section[data-section="summary"] span[aria-hidden="true"]']);
      const currentCompany = textFrom(document, ['#experience ~ div li:first-child .t-bold span[aria-hidden="true"]', '.pv-top-card--experience-list-item']);
      const experience = listFrom(document, ['#experience ~ div li span[aria-hidden="true"]']);
      const skills = listFrom(document, ['#skills ~ div li span[aria-hidden="true"]']);

      // Fallback: get headline from meta description
      let finalHeadline = headline;
      if (!finalHeadline) {
        const meta = document.querySelector('meta[name="description"]');
        if (meta) {
          const parts = (meta.getAttribute('content') || '').split(' - ');
          if (parts.length >= 2) finalHeadline = parts[1].trim();
        }
      }

      return {
        fullName: fullName || document.querySelector('h1')?.textContent?.trim() || '',
        headline: finalHeadline,
        location,
        currentCompany,
        about,
        experience,
        skills,
        education: listFrom(document, ['#education ~ div li span[aria-hidden="true"]']),
        recentActivity: listFrom(document, ['section.artdeco-card a[href*="/posts/"] span[aria-hidden="true"]'], 4),
        externalLinks: [],
      };
    },
  });

  const profile = results?.[0]?.result;
  if (!profile || !profile.fullName) {
    throw new Error('Could not read profile data. Make sure the profile page is fully loaded.');
  }

  return profile;
}

async function runScreen() {
  if (!extractedProfile) {
    setStatus('No profile loaded. Reopen on a LinkedIn page.', true);
    return;
  }

  const jobDescription = document.querySelector('[name="jobDescription"]').value.trim();
  const resumeText = document.querySelector('[name="resumeText"]').value.trim();
  const includeActivity = document.querySelector('[name="includeActivity"]').checked;

  if (!jobDescription) {
    setStatus('Paste a role or JD to screen against.', true);
    return;
  }

  hide(resultNode);
  setStatus('Screening...');
  runButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription,
        resumeText,
        includeActivity,
        includeExternalLinks: false,
        profile: extractedProfile,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || 'Screening failed. Try again.');
    }

    renderResult(payload);
    setStatus('');
  } catch (error) {
    setStatus(error?.message || 'Screening failed.', true);
  } finally {
    runButton.disabled = false;
  }
}

// On popup open: immediately extract profile
async function init() {
  try {
    extractedProfile = await extractProfile();
    hide(loadingState);
    show(profileState);
    renderProfileSummary(extractedProfile);
  } catch (error) {
    hide(loadingState);
    show(errorState);
    errorMessage.textContent = error?.message || 'Could not read the profile.';
  }
}

runButton.addEventListener('click', runScreen);
init();
