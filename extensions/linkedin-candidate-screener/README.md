# LinkedIn Candidate Screener Extension

## Local install

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click `Load unpacked`
4. Select `extensions/linkedin-candidate-screener`

## Smoke test

1. Load the unpacked extension from `extensions/linkedin-candidate-screener`
2. Save the local API override in the popup as `http://127.0.0.1:4173` when testing against the dev server
3. Open a LinkedIn profile
4. Paste a role or JD
5. Toggle activity or link enrichment if needed
6. Run the screen
7. Verify verdict, fit signals, gaps, interview checks, and recruiter notes are rendered
