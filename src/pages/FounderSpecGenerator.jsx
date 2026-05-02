import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import ModeSelector from '../components/founder-copilot/ModeSelector';
import ConversationPane from '../components/founder-copilot/ConversationPane';
import RecommendationPane from '../components/founder-copilot/RecommendationPane';
import FounderBriefPane from '../components/founder-copilot/FounderBriefPane';
import { copyText, downloadMarkdown, normalizeFounderSpecResponse } from '../utils/founderSpec';
import {
  appendFounderCopilotMessage,
  applyFounderCopilotResponse,
  buildFounderCopilotRequest,
  COPILOT_MODES,
  createFounderCopilotSession,
  selectFounderCopilotMode,
} from '../utils/founderCopilotSession';

const API_URL = 'https://n8n.foundersystems.in/webhook/founder-spec-generate';

function toFilename(mode, recommendationTitle) {
  const base = String(recommendationTitle || mode || 'founder-strategy-brief')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base || 'founder-strategy-brief'}.md`;
}

const FounderSpecGenerator = () => {
  const [session, setSession] = useState(createFounderCopilotSession);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const recommendationTitle = useMemo(
    () => session.recommendation?.title || session.recommendation?.what || '',
    [session.recommendation]
  );

  const hasActiveMode = Boolean(session.selectedMode);
  const responseMode = session.brief ? 'show_founder_brief' : session.stage;

  async function submitPayload({ message = '', selection = null, nextSession = session }) {
    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildFounderCopilotRequest({
          session: nextSession,
          message,
          selection,
        })),
      });

      const payload = await response.json().catch(() => null);
      const normalized = normalizeFounderSpecResponse(payload);

      if (!response.ok || !normalized.ok) {
        throw new Error(normalized.error || 'Founder copilot request failed.');
      }

      setSession((current) =>
        applyFounderCopilotResponse({
          session: current,
          payload: normalized,
          submittedValue: message || (selection ? selection.title : ''),
        })
      );
    } catch (submitError) {
      setError(
        submitError.message ||
          'The founder copilot could not finish this turn. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleModeSelect(modeId) {
    const nextSession = selectFounderCopilotMode(createFounderCopilotSession(), modeId);
    setSession(nextSession);
    setInputValue('');
    submitPayload({ message: '', nextSession });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const message = String(inputValue || '').trim();
    if (!message || !hasActiveMode || loading) return;

    const optimisticSession = appendFounderCopilotMessage(session, 'user', message);
    setSession(optimisticSession);
    setInputValue('');
    await submitPayload({ message, nextSession: optimisticSession });
  }

  async function handleShortlistSelect(item) {
    if (!item || loading) return;
    await submitPayload({
      message: item.title || '',
      selection: item,
      nextSession: session,
    });
  }

  async function handleCopy() {
    if (!session.markdown) return;
    await copyText(session.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function handleDownload() {
    if (!session.markdown) return;
    downloadMarkdown(toFilename(session.selectedMode, recommendationTitle), session.markdown);
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder Strategy Copilot"
        description="A guided founder copilot that helps you discover, sharpen, and scope businesses with recommendation-first output backed by evidence."
        canonical="/tools/founder-spec-generator"
      />
      <Navbar />

      <main className="flex-grow pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-10 md:mb-14">
            <span className="inline-block px-4 py-2 bg-brand-orange border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] text-white text-sm font-black uppercase tracking-widest mb-6">
              Strategy Beta
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight-brand mb-5">
              Founder Strategy Copilot
            </h1>
            <p className="text-lg md:text-xl text-brand-black/70 font-bold max-w-4xl leading-relaxed">
              Recommendation first, evidence underneath. Start from whatever level of clarity you
              actually have, and let the copilot narrow the idea, wedge, and next move with you.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] gap-8 items-start">
            <div className="space-y-8">
              <ModeSelector
                modes={COPILOT_MODES}
                selectedMode={session.selectedMode}
                onSelect={handleModeSelect}
              />

              <ConversationPane
                session={session}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
                disabled={!hasActiveMode}
              />
            </div>

            <div className="space-y-8">
              <RecommendationPane
                stage={responseMode}
                shortlist={session.shortlist}
                recommendation={session.recommendation}
                evidence={session.evidence}
                inference={session.inference}
                onSelectShortlist={handleShortlistSelect}
              />

              <FounderBriefPane
                brief={session.brief}
                markdown={session.markdown}
                copied={copied}
                onCopy={handleCopy}
                onDownload={handleDownload}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FounderSpecGenerator;
