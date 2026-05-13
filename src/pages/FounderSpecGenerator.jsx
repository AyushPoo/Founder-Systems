import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import ConversationPane from '../components/founder-copilot/ConversationPane';
import RecommendationPane from '../components/founder-copilot/RecommendationPane';
import CopilotShell from '../components/founder-copilot/CopilotShell';
import ModeSelector from '../components/founder-copilot/ModeSelector';
import { getFounderBenchmarkMatches } from '../data/founderBenchmarks';
import { copyText, downloadMarkdown, normalizeFounderSpecResponse } from '../utils/founderSpec';
import {
  appendFounderCopilotMessage,
  applyFounderCopilotResponse,
  buildFounderCopilotRequest,
  COPILOT_MODES,
  createFounderCopilotSession,
  shouldAllowRecommendation,
  selectFounderCopilotMode,
} from '../utils/founderCopilotSession';

const API_URL = 'https://n8n.foundersystems.in/webhook/founder-spec-generate';
const TEXT_ATTACHMENT_EXTENSIONS = ['txt', 'md', 'csv', 'tsv', 'json'];
const MAX_ATTACHMENT_CHARS = 1800;
const MAX_ATTACHMENTS = 4;
const LOCAL_STORAGE_KEY = 'founder-spec-generator:v1';

function toFilename(mode, recommendationTitle) {
  const base = String(recommendationTitle || mode || 'founder-strategy-brief')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base || 'founder-strategy-brief'}.md`;
}

function getExtension(filename) {
  const parts = String(filename || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function isTextAttachment(file) {
  const extension = getExtension(file?.name);
  return file?.type?.startsWith('text/') || TEXT_ATTACHMENT_EXTENSIONS.includes(extension);
}

async function fileToAttachment(file) {
  const base = {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    parsed: false,
    excerpt: '',
  };

  if (!isTextAttachment(file)) {
    return base;
  }

  try {
    const text = await file.text();
    return {
      ...base,
      parsed: true,
      excerpt: String(text || '').trim().slice(0, MAX_ATTACHMENT_CHARS),
    };
  } catch {
    return base;
  }
}

function buildAttachmentContext(attachments) {
  if (!attachments.length) return '';

  const lines = ['Attached context:'];

  attachments.forEach((file) => {
    lines.push(`- ${file.name}`);
    if (file.parsed && file.excerpt) {
      lines.push(file.excerpt);
    } else {
      lines.push('[Attachment added. Text extraction not available for this file type yet.]');
    }
  });

  return lines.join('\n');
}

function restoreFounderCopilotState() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      session:
        parsed.session && typeof parsed.session === 'object'
          ? {
              ...createFounderCopilotSession(),
              ...parsed.session,
            }
          : null,
      inputValue: typeof parsed.inputValue === 'string' ? parsed.inputValue : '',
      mobilePane: parsed.mobilePane === 'analysis' ? 'analysis' : 'chat',
      showAnalysis: Boolean(parsed.showAnalysis),
    };
  } catch {
    return null;
  }
}

const FounderSpecGenerator = () => {
  const [session, setSession] = useState(createFounderCopilotSession);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showActiveShell, setShowActiveShell] = useState(false);
  const [mobilePane, setMobilePane] = useState('chat');
  const [storageReady, setStorageReady] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const recommendationTitle = useMemo(
    () => session.recommendation?.title || session.recommendation?.what || '',
    [session.recommendation]
  );

  const hasActiveMode = Boolean(session.selectedMode);
  const canGenerateSpec = hasActiveMode && shouldAllowRecommendation(session);
  const benchmarkMatches = useMemo(() => getFounderBenchmarkMatches(session), [session]);

  useEffect(() => {
    const restored = restoreFounderCopilotState();
    if (restored?.session) {
      setSession(restored.session);
      setInputValue(restored.inputValue || '');
      setMobilePane(restored.mobilePane || 'chat');
      setShowAnalysis(Boolean(restored.showAnalysis));
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady || typeof window === 'undefined') return;

    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        session,
        inputValue,
        mobilePane,
        showAnalysis,
      })
    );
  }, [inputValue, mobilePane, session, showAnalysis, storageReady]);

  useEffect(() => {
    if (!hasActiveMode) {
      setShowActiveShell(false);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => setShowActiveShell(true));
    return () => window.cancelAnimationFrame(frame);
  }, [hasActiveMode]);

  useEffect(() => {
    if (session.recommendation || session.brief || session.verdict) {
      setMobilePane('analysis');
      setShowAnalysis(true);
    }
  }, [session.recommendation, session.brief, session.verdict]);

  async function submitPayload({ message = '', selection = null, nextSession = session, documents = [] }) {
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
          attachments: documents,
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
      return true;
    } catch (submitError) {
      setSession((current) => ({
        ...current,
        runtime: {
          turnType: 'fast',
          fallbackUsed: true,
          fallbackReason:
            'I hit a problem while generating the deeper analysis. I can still keep going from the chat.',
        },
      }));
      setError(
        submitError.message === 'Failed to fetch'
          ? 'I had trouble reaching the deeper analysis. You can still keep going here.'
          : submitError.message ||
            'The founder copilot hit a temporary problem. Please try the next turn again.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  function handleModeSelect(modeId) {
    setShowActiveShell(false);
    setMobilePane('chat');
    setShowAnalysis(false);
    const nextSession = selectFounderCopilotMode(createFounderCopilotSession(), modeId);
    setSession(nextSession);
    setInputValue('');
    setAttachments([]);
    setError('');
  }

  async function handlePickFiles(fileList) {
    const files = Array.from(fileList || []).slice(0, MAX_ATTACHMENTS);
    if (!files.length) return;
    const normalized = await Promise.all(files.map(fileToAttachment));
    setAttachments((current) => {
      const next = [...current];
      normalized.forEach((file) => {
        if (!next.some((entry) => entry.id === file.id)) {
          next.push(file);
        }
      });
      return next.slice(0, MAX_ATTACHMENTS);
    });
  }

  function handleRemoveAttachment(id) {
    setAttachments((current) => current.filter((file) => file.id !== id));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const message = String(inputValue || '').trim();
    const attachmentContext = buildAttachmentContext(attachments);
    if ((!message && !attachmentContext) || !hasActiveMode || loading) return;

    const submissionMessage = [message, attachmentContext].filter(Boolean).join('\n\n');
    const chatLabel =
      message ||
      (attachments.length
        ? `Attached ${attachments.length} file${attachments.length > 1 ? 's' : ''}: ${attachments.map((file) => file.name).join(', ')}`
        : '');

    const optimisticSession = appendFounderCopilotMessage(session, 'user', chatLabel);
    setSession(optimisticSession);
    setMobilePane('chat');
    setInputValue('');
    const submittedAttachments = attachments;
    setAttachments([]);
    const succeeded = await submitPayload({
      message: submissionMessage,
      nextSession: optimisticSession,
      documents: submittedAttachments,
    });
    if (!succeeded) {
      setInputValue(message);
      setAttachments(submittedAttachments);
    }
  }

  async function handleShortlistSelect(item) {
    if (!item || loading) return;
    setMobilePane('analysis');
    setShowAnalysis(true);
    await submitPayload({
      message: item.title || '',
      selection: item,
      nextSession: session,
    });
  }

  async function handleGenerateSpec() {
    if (!canGenerateSpec || loading) return;
    await submitPayload({
      message: 'Generate the founder verdict and spec now.',
      selection: { id: 'generate_founder_spec', title: 'Generate founder spec' },
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

  function handleStartNewPlan() {
    setSession(createFounderCopilotSession());
    setInputValue('');
    setAttachments([]);
    setError('');
    setCopied(false);
    setShowActiveShell(false);
    setMobilePane('chat');
    setShowAnalysis(false);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-black flex flex-col font-sans">
      <SEO
        title="Founder Strategy Copilot"
        description="A guided founder copilot that helps you discover, sharpen, and scope businesses with recommendation-first output backed by evidence."
        canonical="/tools/founder-spec-generator"
      />
      <Navbar />

      <main className="flex-grow pb-4 pt-14 sm:pt-16 lg:pt-[74px] lg:h-[calc(100vh-74px)] lg:overflow-hidden">
        <div className="mx-auto h-full max-w-[1480px] px-4 sm:px-5 lg:px-8">
          {!hasActiveMode ? (
            <section className="flex h-full items-start lg:items-center">
              <div className="w-full max-w-[1120px] pt-2 sm:pt-4 lg:pt-0">
                <div className="mb-5 max-w-[660px] sm:mb-7 lg:mb-8">
                  <h1 className="text-[1.8rem] leading-[0.98] sm:text-[2.15rem] lg:text-[2.8rem] font-black tracking-tight-brand">
                    Founder Strategy Copilot
                  </h1>
                  <p className="mt-2 max-w-[520px] text-[14px] font-medium leading-6 text-brand-black/52 sm:text-[14px] lg:mt-3 lg:max-w-[560px] lg:text-[15px]">
                    Validate the direction, pressure-test the strategy, and turn the best next
                    move into a founder-ready plan.
                  </p>
                </div>

                <ModeSelector
                  modes={COPILOT_MODES}
                  selectedMode={session.selectedMode}
                  onSelect={handleModeSelect}
                />
              </div>
            </section>
          ) : (
            <section className="flex h-full min-h-0 flex-col overflow-hidden">
                <div className="mb-3 hidden items-center justify-between gap-6 lg:flex">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/28">
                      Founder strategy copilot
                    </p>
                    <p className="mt-1 text-[12.5px] font-medium text-brand-black/42">
                      Your draft stays on this device if the page refreshes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartNewPlan}
                    className="rounded-full border border-brand-black/10 bg-white px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-brand-black/62 transition hover:border-brand-black/18"
                  >
                    New plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAnalysis((current) => !current)}
                    className={`rounded-full border px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] transition ${
                      showAnalysis
                        ? 'border-brand-black bg-brand-black text-white'
                        : 'border-brand-black/10 bg-white text-brand-black/62'
                    }`}
                  >
                    {showAnalysis ? 'Hide analysis' : 'View analysis'}
                  </button>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3 rounded-[16px] border border-brand-black/8 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(27,28,26,0.045)] lg:hidden">
                <div className="min-w-0">
                  <h1 className="text-[1rem] font-black tracking-tight-brand">Founder Strategy Copilot</h1>
                  <p className="mt-1 text-[10.5px] font-medium text-brand-black/48">
                    {String(session.selectedMode || '').replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex items-center rounded-full border border-brand-black/10 bg-brand-cream/55 p-1">
                  <button
                    type="button"
                    onClick={() => setMobilePane('chat')}
                    className={`rounded-full px-3 py-2 text-[11px] font-black transition ${
                      mobilePane === 'chat'
                        ? 'bg-brand-black text-white shadow-[0_8px_18px_rgba(27,28,26,0.16)]'
                        : 'text-brand-black/56'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartNewPlan();
                    }}
                    className="rounded-full px-3 py-2 text-[11px] font-black text-brand-black/56 transition"
                  >
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobilePane('analysis');
                      setShowAnalysis(true);
                    }}
                    className={`rounded-full px-3 py-2 text-[11px] font-black transition ${
                      mobilePane === 'analysis'
                        ? 'bg-brand-black text-white shadow-[0_8px_18px_rgba(27,28,26,0.16)]'
                        : 'text-brand-black/56'
                    }`}
                  >
                    Analysis
                  </button>
                </div>
              </div>

              <div
                className={`min-h-0 flex-1 transition-all duration-300 ease-out ${
                  showActiveShell ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                <CopilotShell
                  mobileActivePane={mobilePane === 'analysis' ? 'right' : 'left'}
                  showRightPane={showAnalysis || mobilePane === 'analysis'}
                  leftPane={
                    <ConversationPane
                      session={session}
                      inputValue={inputValue}
                      onInputChange={setInputValue}
                      onSubmit={handleSubmit}
                      loading={loading}
                      error={error}
                      canGenerateSpec={canGenerateSpec}
                      onGenerateSpec={handleGenerateSpec}
                      attachments={attachments}
                      onPickFiles={handlePickFiles}
                      onRemoveAttachment={handleRemoveAttachment}
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
                      session={session}
                      loading={loading}
                      benchmarkMatches={benchmarkMatches}
                      mobilePresentation="inline"
                      mobileTitle="Analysis"
                    />
                  }
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default FounderSpecGenerator;
