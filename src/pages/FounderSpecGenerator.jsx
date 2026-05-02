import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import ConversationPane from '../components/founder-copilot/ConversationPane';
import RecommendationPane from '../components/founder-copilot/RecommendationPane';
import CopilotShell from '../components/founder-copilot/CopilotShell';
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

      <main className="flex-grow pt-20 md:pt-22 pb-4 md:pb-6 xl:h-[calc(100vh-88px)] xl:overflow-hidden">
        <div className="max-w-[1480px] mx-auto px-4 md:px-6 xl:px-8 h-full">
          <div className="mb-4 md:mb-5 flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <span className="inline-block px-3 py-2 bg-brand-orange border-2 border-brand-black shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] text-white text-xs font-black uppercase tracking-[0.22em] mb-3">
                Strategy Beta
              </span>
              <h1 className="text-2xl md:text-[2.35rem] font-black tracking-tight-brand">
                Founder Strategy Copilot
              </h1>
            </div>
            <p className="text-sm md:text-[15px] text-brand-black/65 font-bold max-w-xl leading-relaxed xl:text-right">
              Pick your stage and start talking. The copilot should be usable without a scroll hunt.
            </p>
          </div>

          <CopilotShell
            leftPane={
              <ConversationPane
                session={session}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
                disabled={!hasActiveMode}
                modes={COPILOT_MODES}
                onSelectMode={handleModeSelect}
              />
            }
            rightPane={
              <RecommendationPane
                stage={session.stage}
                shortlist={session.shortlist}
                recommendation={session.recommendation}
                evidence={session.evidence}
                inference={session.inference}
                onSelectShortlist={handleShortlistSelect}
                brief={session.brief}
                markdown={session.markdown}
                copied={copied}
                onCopy={handleCopy}
                onDownload={handleDownload}
                founderFit={session.founderFit}
                actionPlan={session.actionPlan}
                verdict={session.verdict}
                challenge={session.challenge}
                activeTab={session.activePanel}
                selectedMode={session.selectedMode}
              />
            }
          />
        </div>
      </main>
    </div>
  );
};

export default FounderSpecGenerator;
