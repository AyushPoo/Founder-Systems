import { Link } from 'react-router-dom';

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

const WorkspaceOutcomePanel = ({
  productSlug,
  canSave = false,
  saveLabel = 'Save to workspace',
  onSave,
  saveBusy = false,
  recommendations = [],
  notice = '',
}) => {
  if (!canSave && !recommendations.length && !notice) {
    return null;
  }

  return (
    <section className="rounded-[22px] border border-brand-black/10 bg-white px-4 py-4 shadow-[0_12px_24px_rgba(27,28,26,0.06)]">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Workspace handoff</p>
      <h2 className="mt-2 text-lg font-black tracking-tight-brand">Save what matters, then choose the next best move.</h2>
      {notice ? (
        <p className="mt-2 text-sm font-medium leading-relaxed text-brand-black/62">{notice}</p>
      ) : null}
      {canSave ? (
        <button disabled={saveBusy} onClick={onSave} className="btn-cta mt-4 !px-4 !py-2 !text-xs">
          {saveBusy ? 'Saving...' : saveLabel}
        </button>
      ) : null}
      {recommendations.length ? (
        <div className="mt-4 space-y-3">
          {recommendations.map((recommendation) => {
            const href = recommendation.product_slug === 'promptdeck-ai'
              ? '/products/promptdeck-ai'
              : `/tools/${recommendation.product_slug}`;
            return (
              <div key={`${productSlug}-${recommendation.product_slug}`} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black">{titleCase(recommendation.product_slug)}</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-brand-black/58">{recommendation.reason}</p>
                    {recommendation.suggested_memory_types?.length ? (
                      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/42">
                        Use memory from: {recommendation.suggested_memory_types.map((item) => titleCase(item)).join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <Link to={href} className="rounded-full border-2 border-brand-black bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0px_0px_rgba(27,28,26,1)]">
                    Open
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export default WorkspaceOutcomePanel;
