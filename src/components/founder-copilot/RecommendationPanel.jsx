const RecommendationPanel = ({ shortlist, recommendation, onSelectShortlist, compact = false }) => {
  const hasShortlist = Array.isArray(shortlist) && shortlist.length > 0;
  const hasRecommendation = recommendation && typeof recommendation === 'object';

  if (!hasShortlist && !hasRecommendation) {
    return (
      <div className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-5'} border border-brand-black/10 bg-brand-cream/25`}>
        <p className={`${compact ? 'text-[14px]' : 'text-base'} mb-2 font-black tracking-tight-brand`}>Recommendation snapshot</p>
        <p className={`${compact ? 'text-[12px]' : 'text-sm'} font-semibold leading-relaxed text-brand-black/50`}>
          The right pane stays quiet until the conversation creates a real direction to inspect.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {hasRecommendation ? (
        <article className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-5'} border border-brand-black/10 bg-brand-black text-white shadow-[0_12px_30px_rgba(27,28,26,0.12)]`}>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/64">
            Best next move
          </p>
          <h3 className={`${compact ? 'text-[15px]' : 'text-2xl'} mb-2 font-black tracking-tight-brand`}>
            {recommendation.title || 'Recommended direction'}
          </h3>
          <p className={`${compact ? 'text-[13px] leading-6' : 'text-sm md:text-base leading-relaxed'} font-semibold text-white/92`}>
            {recommendation.summary || recommendation.thesis || recommendation.reasoning}
          </p>
          {(recommendation.wedge || recommendation.what) && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-white/80">
              {recommendation.wedge || recommendation.what}
            </p>
          )}
        </article>
      ) : null}

      {hasShortlist ? (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/55">
            Alternatives to pressure-test
          </p>
          {shortlist.map((item, index) => (
            <article
              key={item.id || item.title || index}
              className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-4'} border border-brand-black/10 bg-white shadow-[0_8px_20px_rgba(27,28,26,0.04)]`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className={`${compact ? 'text-[13px]' : 'text-lg'} font-black tracking-tight-brand`}>
                    {item.title || `Option ${index + 1}`}
                  </p>
                  <p className={`mt-2 ${compact ? 'text-[12.5px] leading-6' : 'text-sm leading-relaxed'} font-semibold text-brand-black/70`}>
                    {item.summary ||
                      item.whyNow ||
                      item.problem ||
                      'Promising direction surfaced by the copilot.'}
                  </p>
                </div>
                {item.score ? (
                  <span className="rounded-full border border-brand-black/10 bg-brand-cream/45 px-2.5 py-1 text-[10px] font-black">
                    Score {item.score}
                  </span>
                ) : null}
              </div>

              {typeof onSelectShortlist === 'function' ? (
                <button
                  type="button"
                  onClick={() => onSelectShortlist(item)}
                  className="mt-3 rounded-full border border-brand-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/64"
                >
                  Explore this direction
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default RecommendationPanel;
