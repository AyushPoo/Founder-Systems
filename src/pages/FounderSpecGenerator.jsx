import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import ConversationPane from '../components/founder-copilot/ConversationPane';
import RecommendationPane from '../components/founder-copilot/RecommendationPane';
import CopilotShell from '../components/founder-copilot/CopilotShell';
import ModeSelector from '../components/founder-copilot/ModeSelector';
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
const TEXT_ATTACHMENT_EXTENSIONS = ['txt', 'md', 'csv', 'tsv', 'json'];
const MAX_ATTACHMENT_CHARS = 1800;
const MAX_ATTACHMENTS = 4;

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

const FounderSpecGenerator = () => {
  const [session, setSession] = useState(createFounderCopilotSession);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showActiveShell, setShowActiveShell] = useState(false);
  const [mobileAnalysisOpen, setMobileAnalysisOpen] = useState(false);

  const recommendationTitle = useMemo(
    () => session.recommendation?.title || session.recommendation?.what || '',
    [session.recommendation]
  );

  const hasActiveMode = Boolean(session.selectedMode);

  useEffect(() => {
    if (!hasActiveMode) {
      setShowActiveShell(false);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => setShowActiveShell(true));
    return () => window.cancelAnimationFrame(frame);
  }, [hasActiveMode]);

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
    setMobileAnalysisOpen(false);
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
    setMobileAnalysisOpen(false);
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
        title="Founder Spec Generator"
        description="A guided founder copilot that helps you discover, sharpen, and scope businesses with recommendation-first output backed by evidence."
        canonical="/tools/founder-spec-generator"
      />
      <Navbar />

      <main className="flex-grow pb-6 pt-16 sm:pt-18 lg:pt-22 lg:h-[calc(100vh-88px)] lg:overflow-hidden">
        <div className="mx-auto h-full max-w-[1480px] px-4 sm:px-5 lg:px-8">
          {!hasActiveMode ? (
            <section className="flex h-full items-start lg:items-center">
              <div className="w-full max-w-[1120px] pt-2 sm:pt-4 lg:pt-0">
                <div className="mb-6 max-w-[760px] sm:mb-8 lg:mb-10">
                  <h1 className="text-[2rem] leading-[0.94] sm:text-[2.5rem] lg:text-[4rem] font-black tracking-tight-brand">
                    Founder Spec Generator
                  </h1>
                  <p className="mt-2 max-w-[420px] text-[13px] font-bold leading-relaxed text-brand-black/50 sm:mt-3 sm:text-sm lg:mt-4 lg:max-w-[520px] lg:text-lg">
                    Validate the idea, audit the strategy, and turn the best next move into a
                    founder-ready spec.
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
              <div className="mb-4 hidden items-end justify-between gap-6 lg:flex">
                <div className="min-w-0">
                  <h1 className="text-[2.1rem] leading-none lg:text-[2.9rem] font-black tracking-tight-brand">
                    Founder Spec Generator
                  </h1>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3 rounded-[20px] border border-brand-black/10 bg-white px-4 py-3 shadow-[0_14px_32px_rgba(27,28,26,0.06)] lg:hidden">
                <div className="min-w-0">
                  <h1 className="text-lg font-black tracking-tight-brand">Founder copilot</h1>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-brand-black/48">
                    {String(session.selectedMode || '').replace(/_/g, ' ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileAnalysisOpen(true)}
                  className="shrink-0 rounded-full border border-brand-black/12 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-black shadow-[0_10px_24px_rgba(27,28,26,0.06)]"
                >
                  View analysis
                </button>
              </div>

              <div
                className={`min-h-0 flex-1 transition-all duration-300 ease-out ${
                  showActiveShell ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                <CopilotShell
                  showRightPaneOnMobile={mobileAnalysisOpen}
                  leftPane={
                    <ConversationPane
                      session={session}
                      inputValue={inputValue}
                      onInputChange={setInputValue}
                      onSubmit={handleSubmit}
                      loading={loading}
                      error={error}
                      disabled={!hasActiveMode}
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
                      mobileOpen={mobileAnalysisOpen}
                      onMobileClose={() => setMobileAnalysisOpen(false)}
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
