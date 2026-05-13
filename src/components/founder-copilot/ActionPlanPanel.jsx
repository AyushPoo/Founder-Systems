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
  compact = false,
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
      <div className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-5'} border border-brand-black/10 bg-brand-cream/25`}>
        <p className={`${compact ? 'text-[14px]' : 'text-base'} mb-2 font-black tracking-tight-brand`}>Action plan</p>
        <p className={`${compact ? 'text-[12px]' : 'text-sm'} font-semibold leading-relaxed text-brand-black/50`}>
          The next move list can live here once the brief or backend exposes structured execution
          steps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {hasVerdict ? (
        <article className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-5'} border border-brand-black/10 bg-brand-black text-white shadow-[0_12px_30px_rgba(27,28,26,0.12)]`}>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/80">
            Final verdict
          </p>
          <p className={`${compact ? 'text-[14px]' : 'text-lg'} font-black tracking-tight-brand`}>
            {verdict.summary || verdict.standing || 'Founder verdict'}
          </p>
          {verdict.nextGate ? (
            <p className={`mt-2 ${compact ? 'text-[12.5px] leading-6' : 'text-sm leading-relaxed'} font-semibold text-white/90`}>
              Next gate: {verdict.nextGate}
            </p>
          ) : null}
        </article>
      ) : null}

      {steps.map((step, index) => (
        <article
          key={`${step}-${index}`}
          className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-4'} border border-brand-black/10 bg-white`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-black text-[10px] font-black text-white">
              {index + 1}
            </span>
            <p className={`${compact ? 'text-[12.5px] leading-6' : 'text-sm leading-relaxed'} font-semibold text-brand-black/75`}>{step}</p>
          </div>
        </article>
      ))}

      {proofPoints.length ? (
        <article className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-4'} border border-brand-black/10 bg-white`}>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/55">
            Proof points
          </p>
          <ul className="space-y-2">
            {proofPoints.map((item, index) => (
              <li key={`${item}-${index}`} className={`${compact ? 'text-[12.5px] leading-6' : 'text-sm leading-relaxed'} font-semibold text-brand-black/75`}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {killCriteria.length ? (
        <article className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-4'} border border-brand-black/10 bg-white`}>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/55">
            Kill criteria
          </p>
          <ul className="space-y-2">
            {killCriteria.map((item, index) => (
              <li key={`${item}-${index}`} className={`${compact ? 'text-[12.5px] leading-6' : 'text-sm leading-relaxed'} font-semibold text-brand-black/75`}>
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
