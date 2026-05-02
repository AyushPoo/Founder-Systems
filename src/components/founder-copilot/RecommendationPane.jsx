import { useEffect, useMemo, useState } from 'react';
import ContextTabs from './ContextTabs';
import RecommendationPanel from './RecommendationPanel';
import EvidencePanel from './EvidencePanel';
import FounderFitPanel from './FounderFitPanel';
import ActionPlanPanel from './ActionPlanPanel';

const TAB_CONFIG = {
  recommendation: { id: 'recommendation', label: 'Recommendation' },
  evidence: { id: 'evidence', label: 'Evidence' },
  founder_fit: { id: 'founder_fit', label: 'Founder fit' },
  action_plan: { id: 'action_plan', label: 'Action plan' },
};

function getVisibleTabs(stage) {
  switch (stage) {
    case 'narrowing':
      return ['recommendation', 'evidence'];
    case 'challenging':
      return ['founder_fit', 'evidence'];
    case 'planning':
    case 'final_verdict':
      return ['action_plan', 'founder_fit', 'recommendation', 'evidence'];
    case 'recommending':
      return ['recommendation', 'evidence', 'founder_fit'];
    case 'exploring':
    case 'mode_selection':
    default:
      return ['evidence'];
  }
}

const DEFAULT_TAB = 'evidence';

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

  const resolvedTab =
    activeTab && tabs.some((tab) => tab.id === activeTab) ? activeTab : internalActiveTab;

  function handleTabChange(tabId) {
    setInternalActiveTab(tabId);
    onActiveTabChange?.(tabId);
  }

  return (
    <section className="rounded-[28px] border-2 border-brand-black bg-white p-6 md:p-7 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
      <div className="pb-5 border-b-2 border-brand-black">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-2">
          Context
        </p>
        <h2 className="text-2xl font-black tracking-tight-brand mb-2">
          Calm context for the current thread
        </h2>
        <p className="text-sm md:text-base font-bold leading-relaxed text-brand-black/65">
          Recommendation first. Evidence, brief, fit, and next moves when you need them.
        </p>
      </div>

      <div className="pt-6 space-y-5">
        <div className="rounded-[22px] border-2 border-brand-black bg-brand-cream/25 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-2">
            Session state
          </p>
          <p className="text-sm font-bold text-brand-black/70 leading-relaxed">
            {stage === 'mode_selection'
              ? 'Choose a starting mode to begin.'
              : 'Use the tabs to inspect the current recommendation, supporting evidence, founder-fit pushback, and action plan at the right moment.'}
          </p>
          {selectedMode ? (
            <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-brand-black/55">
              Mode: {String(selectedMode).replace(/_/g, ' ')}
            </p>
          ) : null}
          {challenge?.summary ? (
            <p className="mt-3 text-sm font-bold leading-relaxed text-brand-black/75">
              Current pushback: {challenge.summary}
            </p>
          ) : null}
        </div>

        <ContextTabs tabs={tabs} activeTab={resolvedTab} onChange={handleTabChange} />

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
    </section>
  );
};

export default RecommendationPane;
