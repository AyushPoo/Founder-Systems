import FounderBriefPane from './FounderBriefPane';

function normalizeSteps(actionPlan, brief) {
  if (Array.isArray(actionPlan) && actionPlan.length > 0) {
    return actionPlan;
  }

  if (actionPlan && typeof actionPlan === 'object') {
    const sections = [
      ...(Array.isArray(actionPlan.firstWeek) ? actionPlan.firstWeek : []),
      ...(Array.isArray(actionPlan.next30Days) ? actionPlan.next30Days : []),
    ]
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);

    if (sections.length) {
      return sections;
    }
  }

  if (typeof brief?.next30Days === 'string' && brief.next30Days.trim()) {
    return brief.next30Days
      .split(/\n+/)
      .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
      .filter(Boolean);
  }

  return [];
}

const ActionPlanPanel = ({
  actionPlan,
  brief,
  verdict,
  markdown,
  copied,
  onCopy,
  onDownload,
}) => {
  const steps = normalizeSteps(actionPlan, brief);
  const proofPoints =
    actionPlan && typeof actionPlan === 'object' && Array.isArray(actionPlan.proofPoints)
      ? actionPlan.proofPoints
      : [];
  const killCriteria =
    actionPlan && typeof actionPlan === 'object' && Array.isArray(actionPlan.killCriteria)
      ? actionPlan.killCriteria
      : [];
  const hasVerdict = verdict && typeof verdict === 'object';
  const hasBrief = brief && typeof brief === 'object';

  if (!steps.length && !hasVerdict && !hasBrief) {
    return (
      <div className="rounded-[22px] border-2 border-dashed border-brand-black bg-brand-cream/25 p-5">
        <p className="text-base font-black tracking-tight-brand mb-2">Action plan</p>
        <p className="text-sm font-bold text-brand-black/50 leading-relaxed">
          The next move list can live here once the brief or backend exposes structured execution
          steps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasVerdict ? (
        <article className="rounded-[22px] border-2 border-brand-black bg-brand-orange p-5 text-white shadow-[5px_5px_0px_0px_rgba(27,28,26,1)]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80 mb-2">
            Final verdict
          </p>
          <p className="text-lg font-black tracking-tight-brand">
            {verdict.summary || verdict.standing || 'Founder verdict'}
          </p>
          {verdict.nextGate ? (
            <p className="mt-3 text-sm font-bold text-white/90 leading-relaxed">
              Next gate: {verdict.nextGate}
            </p>
          ) : null}
        </article>
      ) : null}

      {steps.map((step, index) => (
        <article
          key={`${step}-${index}`}
          className="rounded-[22px] border-2 border-brand-black bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-black bg-brand-orange text-xs font-black text-white">
              {index + 1}
            </span>
            <p className="text-sm font-bold text-brand-black/75 leading-relaxed">{step}</p>
          </div>
        </article>
      ))}

      {proofPoints.length ? (
        <article className="rounded-[22px] border-2 border-brand-black bg-white p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-2">
            Proof points
          </p>
          <ul className="space-y-2">
            {proofPoints.map((item, index) => (
              <li key={`${item}-${index}`} className="text-sm font-bold text-brand-black/75 leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {killCriteria.length ? (
        <article className="rounded-[22px] border-2 border-dashed border-brand-black bg-white p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-2">
            Kill criteria
          </p>
          <ul className="space-y-2">
            {killCriteria.map((item, index) => (
              <li key={`${item}-${index}`} className="text-sm font-bold text-brand-black/75 leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {hasBrief ? (
        <FounderBriefPane
          brief={brief}
          markdown={markdown}
          copied={copied}
          onCopy={onCopy}
          onDownload={onDownload}
          compact
        />
      ) : null}
    </div>
  );
};

export default ActionPlanPanel;
