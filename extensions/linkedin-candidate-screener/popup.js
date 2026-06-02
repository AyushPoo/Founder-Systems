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

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Get name from title (most reliable)
      const title = document.title || '';
      const titleParts = title.split(' | ')[0].split(' - ');
      const nameFromTitle = titleParts[0]?.trim() || '';
      const headlineFromTitle = titleParts.slice(1).join(' - ').trim() || '';

      // Try h1 for name
      let fullName = '';
      for (const h1 of document.querySelectorAll('h1')) {
        const text = h1.textContent.trim();
        if (text && text.length > 1 && text.length < 60) {
          fullName = text;
          break;
        }
      }

      // Get headline - look for the text right below the name
      // LinkedIn puts it in a div with class containing "text-body-medium"
      let headline = '';
      const mainSection = document.querySelector('main');
      if (mainSection) {
        const mediumTexts = mainSection.querySelectorAll('[class*="text-body-medium"]');
        for (const el of mediumTexts) {
          const text = el.textContent.trim();
          if (text && text.length > 5 && text.length < 200) {
            headline = text;
            break;
          }
        }
      }

      // Location - usually small text with a location pattern
      let location = '';
      if (mainSection) {
        const smallTexts = mainSection.querySelectorAll('[class*="text-body-small"]');
        for (const el of smallTexts) {
          const text = el.textContent.trim();
          if (text && text.length > 3 && text.length < 80 && !text.includes('connection')) {
            location = text;
            break;
          }
        }
      }

      // About - find the about section by looking for the anchor #about
      let about = '';
      const aboutAnchor = document.getElementById('about');
      if (aboutAnchor) {
        const section = aboutAnchor.closest('section');
        if (section) {
          const spans = section.querySelectorAll('span[aria-hidden="true"], span.visually-hidden + span');
          for (const span of spans) {
            const text = span.textContent.trim();
            if (text.length > 40) { about = text.slice(0, 300); break; }
          }
        }
      }

      // Experience section
      const experience = [];
      const expAnchor = document.getElementById('experience');
      if (expAnchor) {
        const section = expAnchor.closest('section');
        if (section) {
          const boldSpans = section.querySelectorAll('.t-bold span, [class*="t-bold"] span');
          for (const span of boldSpans) {
            const text = span.textContent.trim();
            if (text && text.length > 2 && text.length < 100 && experience.length < 5 && !experience.includes(text)) {
              experience.push(text);
            }
          }
        }
      }

      // Skills section
      const skills = [];
      const skillsAnchor = document.getElementById('skills');
      if (skillsAnchor) {
        const section = skillsAnchor.closest('section');
        if (section) {
          const spans = section.querySelectorAll('span[aria-hidden="true"]');
          for (const span of spans) {
            const text = span.textContent.trim();
            if (text && text.length > 1 && text.length < 50 && skills.length < 10 && !skills.includes(text)) {
              skills.push(text);
            }
          }
        }
      }

      // Current company from the profile card area
      let currentCompany = '';
      if (mainSection) {
        const companyLinks = mainSection.querySelectorAll('a[href*="/company/"]');
        for (const link of companyLinks) {
          const text = link.textContent.trim();
          if (text && text.length > 1 && text.length < 60) {
            currentCompany = text;
            break;
          }
        }
      }

      return {
        fullName: fullName || nameFromTitle || 'Unknown',
        headline: headline || headlineFromTitle || '',
        location,
        currentCompany,
        about,
        experience,
        skills,
        education: [],
        recentActivity: [],
        externalLinks: [],
      };
    },
  });

  const profile = results?.[0]?.result;
  if (!profile) {
    throw new Error('Script execution failed. Chrome may be blocking access to this page.');
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
    // Also show in console for debugging
    console.error('LinkedIn Screener extraction error:', error);
  }
}

runButton.addEventListener('click', runScreen);
init();
