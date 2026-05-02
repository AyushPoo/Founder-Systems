const RecommendationPane = ({
  stage,
  shortlist,
  recommendation,
  evidence,
  inference,
  onSelectShortlist,
}) => {
  const hasShortlist = Array.isArray(shortlist) && shortlist.length > 0;
  const hasRecommendation = recommendation && typeof recommendation === 'object';
  const hasEvidence = Array.isArray(evidence) && evidence.length > 0;
  const hasInference = Array.isArray(inference) && inference.length > 0;

  return (
    <section className="rounded-[28px] border-2 border-brand-black bg-white p-6 md:p-7 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
      <div className="pb-5 border-b-2 border-brand-black">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-2">
          Recommendation
        </p>
        <h2 className="text-2xl font-black tracking-tight-brand mb-2">
          What the copilot thinks you should do
        </h2>
        <p className="text-sm md:text-base font-bold leading-relaxed text-brand-black/65">
          Recommendation first. Evidence and inference underneath. No hand-wavy startup filler.
        </p>
      </div>

      {!hasShortlist && !hasRecommendation ? (
        <div className="pt-6 grid grid-cols-1 gap-4">
          {['Recommendation', 'Evidence', 'Inference boundary'].map((label) => (
            <div
              key={label}
              className="rounded-[22px] border-2 border-brand-black border-dashed bg-brand-cream/20 p-5 min-h-[120px]"
            >
              <p className="text-base font-black tracking-tight-brand mb-2">{label}</p>
              <p className="text-sm font-bold text-brand-black/45 leading-relaxed">
                {stage === 'mode_selection'
                  ? 'Choose a starting mode and start the conversation.'
                  : 'This pane will fill as the guided session narrows the business direction.'}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {hasShortlist ? (
        <div className="pt-6">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-3">
            Shortlist
          </p>
          <div className="grid grid-cols-1 gap-4">
            {shortlist.map((item, index) => (
              <article
                key={item.id || item.title || index}
                className="rounded-[22px] border-2 border-brand-black bg-brand-cream/30 p-5 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                  <div>
                    <p className="text-lg font-black tracking-tight-brand">
                      {item.title || `Option ${index + 1}`}
                    </p>
                    {(item.archetype || item.businessType) ? (
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-black/55 mt-1">
                        {item.archetype || item.businessType}
                      </p>
                    ) : null}
                  </div>
                  {item.score ? (
                    <span className="rounded-full border-2 border-brand-black bg-white px-3 py-2 text-xs font-black">
                      Score {item.score}
                    </span>
                  ) : null}
                </div>

                <p className="text-sm font-bold text-brand-black/70 leading-relaxed mb-4">
                  {item.summary || item.whyNow || item.problem || 'Promising direction surfaced by the copilot.'}
                </p>

                {typeof onSelectShortlist === 'function' ? (
                  <button
                    type="button"
                    onClick={() => onSelectShortlist(item)}
                    className="btn-outline !px-4 !py-3 !text-sm"
                  >
                    Explore this direction
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {hasRecommendation ? (
        <div className="pt-6 space-y-4">
          <article className="rounded-[24px] border-2 border-brand-black bg-brand-orange text-white p-5 shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-2 text-white/80">
              Best next move
            </p>
            <h3 className="text-2xl font-black tracking-tight-brand mb-3">
              {recommendation.title || 'Recommended direction'}
            </h3>
            <p className="text-sm md:text-base font-bold leading-relaxed text-white/92">
              {recommendation.summary || recommendation.thesis || recommendation.reasoning}
            </p>
          </article>

          {hasEvidence ? (
            <article className="rounded-[22px] border-2 border-brand-black bg-brand-cream/30 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-3">
                Evidence used
              </p>
              <div className="space-y-3">
                {evidence.map((item, index) => (
                  <div key={item.id || item.name || index} className="rounded-[18px] bg-white border-2 border-brand-black p-4">
                    <p className="text-sm font-black mb-1">
                      {item.companyName || item.name || item.title || `Reference ${index + 1}`}
                    </p>
                    <p className="text-sm font-bold text-brand-black/70 leading-relaxed">
                      {item.pattern || item.summary || item.signal || item.whyItMatters || 'Reference used in reasoning.'}
                    </p>
                    {item.tractionSignal ? (
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-black/50 mt-2">
                        Traction: {item.tractionSignal}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {hasInference ? (
            <article className="rounded-[22px] border-2 border-brand-black border-dashed bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-3">
                Where inference was used
              </p>
              <ul className="space-y-2">
                {inference.map((item, index) => (
                  <li key={`${item}-${index}`} className="text-sm font-bold text-brand-black/70 leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default RecommendationPane;
