/* global chrome */

const API_BASE = 'https://foundersystems.in';

const statusNode = document.getElementById('status');
const resultNode = document.getElementById('result');
const runButton = document.getElementById('runScreen');

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

function renderResult(payload) {
  resultNode.classList.remove('hidden');
  document.getElementById('verdict').textContent = formatVerdict(payload.verdict);
  document.getElementById('confidence').textContent = `Confidence: ${payload.confidence}`;
  document.getElementById('candidateSummary').textContent = payload.candidateSummary || '';
  renderList('fitSignals', payload.fitSignals);
  renderList('gapsOrRisks', payload.gapsOrRisks);
  renderList('interviewChecks', payload.interviewChecks);
  renderList('recruiterNotes', payload.recruiterNotes);
}

async function getActiveProfile(includeActivity, includeExternalLinks) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('Open a LinkedIn profile in the current tab first.');
  }

  if (!tab.url || !tab.url.includes('linkedin.com/in/')) {
    throw new Error('Navigate to a LinkedIn profile page (linkedin.com/in/...) first.');
  }

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: 'extract-linkedin-profile',
    includeActivity,
    includeExternalLinks,
  });

  if (response?.error) {
    throw new Error(response.error);
  }

  return response;
}

async function runScreen() {
  const jobDescription = document.querySelector('[name="jobDescription"]').value.trim();
  const resumeText = document.querySelector('[name="resumeText"]').value.trim();
  const includeActivity = document.querySelector('[name="includeActivity"]').checked;
  const includeExternalLinks = document.querySelector('[name="includeExternalLinks"]').checked;

  if (!jobDescription) {
    setStatus('Paste a role or JD before screening.', true);
    return;
  }

  resultNode.classList.add('hidden');
  setStatus('Reading the profile and screening...');
  runButton.disabled = true;

  try {
    const profile = await getActiveProfile(includeActivity, includeExternalLinks);
    const response = await fetch(`${API_BASE}/api/linkedin-candidate-screener`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescription,
        resumeText,
        includeActivity,
        includeExternalLinks,
        profile,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || 'Candidate screening failed. Try again.');
    }

    renderResult(payload);
    setStatus('Screen complete.');
  } catch (error) {
    setStatus(error?.message || 'Candidate screening failed.', true);
  } finally {
    runButton.disabled = false;
  }
}

runButton.addEventListener('click', runScreen);
