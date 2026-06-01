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
    <section className="rounded-[18px] border border-brand-black/10 bg-white px-4 py-3.5 shadow-[0_8px_18px_rgba(27,28,26,0.04)]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-black/42">Workspace handoff</p>
      <h2 className="mt-1.5 text-[14px] font-black tracking-tight-brand">Save what matters, then choose the next best move.</h2>
      {notice ? (
        <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-brand-black/58">{notice}</p>
      ) : null}
      {canSave ? (
        <button disabled={saveBusy} onClick={onSave} className="mt-3 rounded-full border border-brand-black bg-brand-orange px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-white disabled:opacity-60">
          {saveBusy ? 'Saving...' : saveLabel}
        </button>
      ) : null}
      {recommendations.length ? (
        <div className="mt-3 space-y-2">
          {recommendations.map((recommendation) => {
            const href = recommendation.product_slug === 'promptdeck-ai'
              ? '/products/promptdeck-ai'
              : `/tools/${recommendation.product_slug}`;
            return (
              <div key={`${productSlug}-${recommendation.product_slug}`} className="rounded-[14px] border border-brand-black/8 bg-brand-cream px-3.5 py-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-black">{titleCase(recommendation.product_slug)}</p>
                    <p className="mt-0.5 text-[11.5px] font-medium leading-relaxed text-brand-black/55">{recommendation.reason}</p>
                    {recommendation.suggested_memory_types?.length ? (
                      <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/38">
                        Use memory from: {recommendation.suggested_memory_types.map((item) => titleCase(item)).join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <Link to={href} className="rounded-full border border-brand-black bg-white px-2.5 py-1.5 text-[9.5px] font-black uppercase tracking-[0.12em] shadow-[2px_2px_0px_0px_rgba(27,28,26,1)]">
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
