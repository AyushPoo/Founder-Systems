import { useState } from 'react';
import RecommendationPanel from './RecommendationPanel';
import EvidencePanel from './EvidencePanel';
import FounderFitPanel from './FounderFitPanel';
import ActionPlanPanel from './ActionPlanPanel';
import StrategyMapPanel from './StrategyMapPanel';

function hasRenderableContent(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

const AccordionSection = ({ id, title, summary, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-[16px] border border-brand-black/7 bg-white">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls={`${id}-content`}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/36">
            {title}
          </p>
          {summary ? (
            <p className="mt-1 text-[12px] font-medium leading-5 text-brand-black/46">{summary}</p>
          ) : null}
        </div>
        <span className="mt-0.5 text-[11px] font-black text-brand-black/42">{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div id={`${id}-content`} className="border-t border-brand-black/6 px-4 py-3">
          {children}
        </div>
      ) : null}
    </section>
  );
};

const RecommendationPane = ({
  shortlist,
  recommendation,
  evidence,
  inference,
  onSelectShortlist,
  brief,
  markdown,
  copied,
  onCopy,
  onDownload,
  founderFit,
  actionPlan,
  verdict,
  challenge,
  selectedMode,
  mobilePresentation = 'sheet',
  mobileOpen = false,
  onMobileClose,
  mobileTitle = 'Analysis',
  session,
  loading,
  benchmarkMatches = [],
}) => {
  const modeLabel = String(selectedMode || 'conversation').replace(/_/g, ' ');
  const answers = Array.isArray(session?.answers) ? session.answers.length : 0;
  const confidence = String(session?.confidence || 'low').toLowerCase();
  const summaryBits = {
    answers,
    confidence:
      confidence === 'high' ? 'High signal' : confidence === 'medium' ? 'Medium signal' : 'Still gathering',
    progress:
      verdict?.standing ||
      recommendation?.summary ||
      challenge?.summary ||
      'The right rail tracks the best read, the main risk, and the next move.',
  };

  const showRecommendation = hasRenderableContent(recommendation) || (Array.isArray(shortlist) && shortlist.length > 0);
  const showEvidence =
    (Array.isArray(evidence) && evidence.length > 0) ||
    (Array.isArray(inference) && inference.length > 0) ||
    (Array.isArray(benchmarkMatches) && benchmarkMatches.length > 0);
  const showPlan = hasRenderableContent(actionPlan) || hasRenderableContent(verdict) || hasRenderableContent(brief);

  function renderPaneFrame({ mobile = false }) {
    return (
      <section
        className={`flex h-full min-h-0 flex-col bg-white ${
          mobile
            ? 'relative z-10 mt-auto max-h-[88vh] rounded-t-[22px] px-4 pb-4 pt-3 shadow-[0_-18px_48px_rgba(27,28,26,0.16)]'
            : 'rounded-[20px] border border-brand-black/7 px-4 py-4 shadow-[0_10px_28px_rgba(27,28,26,0.035)]'
        }`}
      >
        {mobile ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-brand-black/12" />
              <h2 className="text-[1.05rem] font-black tracking-tight-brand">{mobileTitle}</h2>
            </div>
            <button
              type="button"
              onClick={() => onMobileClose?.()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-black/10 text-brand-black/60"
              aria-label="Close analysis"
            >
              x
            </button>
          </div>
        ) : (
          <div className="border-b border-brand-black/6 pb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/34">
              Analysis
            </p>
            <p className="mt-1 text-[12.5px] font-medium leading-5 text-brand-black/48">
              Keep the conversation visible while the right rail tracks progress, evidence, and the current plan.
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pt-3">
          <section className="rounded-[16px] border border-brand-black/7 bg-brand-cream/14 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-black/8 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/46">
                {modeLabel}
              </span>
              <span className="rounded-full border border-brand-black/8 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/46">
                {summaryBits.confidence}
              </span>
              <span className="rounded-full border border-brand-black/8 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/46">
                {loading ? 'Updating' : `${summaryBits.answers} answer${summaryBits.answers === 1 ? '' : 's'}`}
              </span>
            </div>
            <p className="mt-3 text-[13px] font-medium leading-6 text-brand-black/64">{summaryBits.progress}</p>
          </section>

          <AccordionSection
            id="progress"
            title="Progress"
            summary="Current read, confidence, and what the session is converging toward."
            defaultOpen
          >
            <StrategyMapPanel session={session} loading={loading} compact />
          </AccordionSection>

          <AccordionSection
            id="analysis"
            title="Analysis"
            summary="Recommendation quality, strategy pressure-test, and founder fit."
            defaultOpen
          >
            <div className="space-y-3">
              {showRecommendation ? (
                <RecommendationPanel
                  shortlist={shortlist}
                  recommendation={recommendation}
                  onSelectShortlist={onSelectShortlist}
                  compact
                />
              ) : null}

              <FounderFitPanel
                founderFit={founderFit}
                recommendation={recommendation}
                brief={brief}
                selectedMode={selectedMode}
                compact
              />
            </div>
          </AccordionSection>

          <AccordionSection
            id="evidence"
            title="Evidence"
            summary="Comparable brands, signals used, and inference boundaries."
            defaultOpen={showEvidence}
          >
            <EvidencePanel
              evidence={evidence}
              inference={inference}
              benchmarkMatches={benchmarkMatches}
              compact
            />
          </AccordionSection>

          <AccordionSection
            id="plan"
            title="Plan"
            summary="Verdict, next moves, proof points, and the current brief."
            defaultOpen={showPlan}
          >
            <ActionPlanPanel
              actionPlan={actionPlan}
              verdict={verdict}
              brief={brief}
              markdown={markdown}
              copied={copied}
              onCopy={onCopy}
              onDownload={onDownload}
              compact
            />
          </AccordionSection>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="hidden h-full xl:block">{renderPaneFrame({ mobile: false })}</div>

      {mobilePresentation === 'inline' ? (
        <div className="h-full xl:hidden">{renderPaneFrame({ mobile: false })}</div>
      ) : mobileOpen ? (
        <div className="absolute inset-0 flex items-end xl:hidden">
          <button
            type="button"
            onClick={() => onMobileClose?.()}
            className="absolute inset-0 bg-brand-black/38"
            aria-label="Close analysis"
          />
          {renderPaneFrame({ mobile: true })}
        </div>
      ) : null}
    </>
  );
};

export default RecommendationPane;
