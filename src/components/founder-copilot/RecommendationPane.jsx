import { useEffect, useMemo, useState } from 'react';
import ContextTabs from './ContextTabs';
import RecommendationPanel from './RecommendationPanel';
import EvidencePanel from './EvidencePanel';
import FounderFitPanel from './FounderFitPanel';
import ActionPlanPanel from './ActionPlanPanel';
import StrategyMapPanel from './StrategyMapPanel';

const TAB_CONFIG = {
  map: { id: 'map', label: 'Map' },
  recommendation: { id: 'recommendation', label: 'Recommendation' },
  evidence: { id: 'evidence', label: 'Evidence' },
  founder_fit: { id: 'founder_fit', label: 'SWOT' },
  action_plan: { id: 'action_plan', label: 'Plan' },
};

function getVisibleTabs(stage) {
  switch (stage) {
    case 'narrowing':
      return ['map', 'recommendation', 'evidence'];
    case 'challenging':
      return ['map', 'founder_fit', 'evidence'];
    case 'planning':
    case 'final_verdict':
      return ['map', 'action_plan', 'founder_fit', 'recommendation', 'evidence'];
    case 'recommending':
      return ['map', 'recommendation', 'founder_fit', 'evidence'];
    case 'exploring':
    case 'mode_selection':
    default:
      return ['map', 'founder_fit', 'action_plan', 'evidence'];
  }
}

const DEFAULT_TAB = 'map';

const RecommendationPane = ({
  stage,
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
  activeTab,
  onActiveTabChange,
  selectedMode,
  mobilePresentation = 'sheet',
  mobileOpen = false,
  onMobileClose,
  mobileTitle = 'Context',
  session,
  loading,
}) => {
  const tabs = useMemo(
    () => getVisibleTabs(stage).map((id) => TAB_CONFIG[id]).filter(Boolean),
    [stage]
  );
  const defaultTab = tabs[0]?.id || DEFAULT_TAB;

  const [internalActiveTab, setInternalActiveTab] = useState(
    activeTab && tabs.some((tab) => tab.id === activeTab) ? activeTab : defaultTab
  );

  useEffect(() => {
    if (activeTab && tabs.some((tab) => tab.id === activeTab)) {
      setInternalActiveTab(activeTab);
      return;
    }
    setInternalActiveTab(defaultTab);
  }, [activeTab, defaultTab, tabs]);

  const resolvedTab = internalActiveTab;

  function handleTabChange(tabId) {
    setInternalActiveTab(tabId);
    onActiveTabChange?.(tabId);
  }

  function renderPaneContent() {
    return (
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pt-4 xl:pr-1">
        <div className="rounded-[18px] border border-brand-black/10 bg-brand-cream/45 p-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/42">
            Strategy brain
          </p>
          <p className="text-sm font-bold leading-relaxed text-brand-black/66">
            {stage === 'mode_selection'
              ? 'Choose a stage to begin.'
              : 'This updates as the conversation moves from validation to strategy audit to plan.'}
          </p>
          {selectedMode ? (
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/48">
              Mode: {String(selectedMode).replace(/_/g, ' ')}
            </p>
          ) : null}
          {challenge?.summary ? (
            <p className="mt-3 text-sm font-bold leading-relaxed text-brand-black/72">
              Pushback: {challenge.summary}
            </p>
          ) : null}
        </div>

        <ContextTabs tabs={tabs} activeTab={resolvedTab} onChange={handleTabChange} />

        {resolvedTab === 'map' ? <StrategyMapPanel session={session} loading={loading} /> : null}

        {resolvedTab === 'recommendation' ? (
          <RecommendationPanel
            shortlist={shortlist}
            recommendation={recommendation}
            onSelectShortlist={onSelectShortlist}
          />
        ) : null}

        {resolvedTab === 'evidence' ? (
          <EvidencePanel evidence={evidence} inference={inference} />
        ) : null}

        {resolvedTab === 'founder_fit' ? (
          <FounderFitPanel
            founderFit={founderFit}
            recommendation={recommendation}
            brief={brief}
            selectedMode={selectedMode}
          />
        ) : null}

        {resolvedTab === 'action_plan' ? (
          <ActionPlanPanel
            actionPlan={actionPlan}
            verdict={verdict}
            brief={brief}
            markdown={markdown}
            copied={copied}
            onCopy={onCopy}
            onDownload={onDownload}
          />
        ) : null}
      </div>
    );
  }

  function renderPaneFrame({ mobile = false }) {
    return (
      <section
        className={`flex h-full min-h-0 flex-col bg-white ${
          mobile
            ? 'relative z-10 mt-auto max-h-[88vh] rounded-t-[24px] px-4 pb-5 pt-3 shadow-[0_-20px_60px_rgba(27,28,26,0.18)]'
            : 'rounded-[22px] border border-brand-black/10 p-5 shadow-[0_20px_50px_rgba(27,28,26,0.07)] md:p-6'
        }`}
      >
        {mobile ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-brand-black/12" />
            <h2 className="text-[1.35rem] font-black tracking-tight-brand">{mobileTitle}</h2>
            </div>
            <button
              type="button"
              onClick={() => onMobileClose?.()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-black/12 text-brand-black/60"
              aria-label="Close context"
            >
              x
            </button>
          </div>
        ) : (
          <div className="border-b border-brand-black/10 pb-4">
            <h2 className="text-[1.7rem] font-black tracking-tight-brand">Analysis map</h2>
            <p className="mt-1 text-sm font-bold text-brand-black/48">
              Idea validation, SWOT, business plan, and evidence.
            </p>
          </div>
        )}

        {renderPaneContent()}
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
            aria-label="Close context"
          />
          {renderPaneFrame({ mobile: true })}
        </div>
      ) : null}
    </>
  );
};

export default RecommendationPane;
