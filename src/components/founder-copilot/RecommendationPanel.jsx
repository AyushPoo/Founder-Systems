const RecommendationPanel = ({ shortlist, recommendation, onSelectShortlist }) => {
  const hasShortlist = Array.isArray(shortlist) && shortlist.length > 0;
  const hasRecommendation = recommendation && typeof recommendation === 'object';

  if (!hasShortlist && !hasRecommendation) {
    return (
      <div className="rounded-[18px] border border-brand-black/10 bg-brand-cream/25 p-5">
        <p className="text-base font-black tracking-tight-brand mb-2">Recommendation snapshot</p>
        <p className="text-sm font-bold text-brand-black/50 leading-relaxed">
          The right pane stays quiet until the conversation creates a real direction to inspect.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasRecommendation ? (
        <article className="rounded-[18px] border border-brand-black/10 bg-brand-black p-5 text-white shadow-[0_18px_44px_rgba(27,28,26,0.16)]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-2 text-white/64">
            Best next move
          </p>
          <h3 className="text-2xl font-black tracking-tight-brand mb-3">
            {recommendation.title || 'Recommended direction'}
          </h3>
          <p className="text-sm md:text-base font-bold leading-relaxed text-white/92">
            {recommendation.summary || recommendation.thesis || recommendation.reasoning}
          </p>
          {(recommendation.wedge || recommendation.what) && (
            <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-white/80">
              {recommendation.wedge || recommendation.what}
            </p>
          )}
        </article>
      ) : null}

      {hasShortlist ? (
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55">
            Alternatives to pressure-test
          </p>
          {shortlist.map((item, index) => (
            <article
              key={item.id || item.title || index}
              className="rounded-[18px] border border-brand-black/10 bg-white p-4 shadow-[0_12px_28px_rgba(27,28,26,0.06)]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black tracking-tight-brand">
                    {item.title || `Option ${index + 1}`}
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-black/70 leading-relaxed">
                    {item.summary ||
                      item.whyNow ||
                      item.problem ||
                      'Promising direction surfaced by the copilot.'}
                  </p>
                </div>
                {item.score ? (
                  <span className="rounded-full border border-brand-black/10 bg-brand-cream/45 px-3 py-2 text-xs font-black">
                    Score {item.score}
                  </span>
                ) : null}
              </div>

              {typeof onSelectShortlist === 'function' ? (
                <button
                  type="button"
                  onClick={() => onSelectShortlist(item)}
                  className="btn-outline mt-4 !px-4 !py-3 !text-sm"
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
