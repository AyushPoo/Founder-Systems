const WorkspaceImportPrompt = ({
  title = 'Use workspace memory?',
  description,
  memoryItems = [],
  onUseOnce,
  onAlwaysAllow,
  onStartFresh,
  disabled = false,
}) => {
  if (!memoryItems.length) {
    return null;
  }

  return (
    <section className="rounded-[22px] border border-brand-black/10 bg-white px-4 py-4 shadow-[0_12px_24px_rgba(27,28,26,0.06)]">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Workspace memory</p>
      <h2 className="mt-2 text-lg font-black tracking-tight-brand">{title}</h2>
      <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/58">
        {description || 'Pull relevant context from your Founder Workspace so you do not have to restate the same company facts.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {memoryItems.slice(0, 5).map((item) => (
          <span
            key={`${item.id || item.type}-${item.type}`}
            className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/62"
          >
            {String(item.label || item.type || 'Memory').replace(/_/g, ' ')}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button disabled={disabled} onClick={onUseOnce} className="btn-cta !px-4 !py-2 !text-xs">
          Use once
        </button>
        <button disabled={disabled} onClick={onAlwaysAllow} className="rounded-full border-2 border-brand-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0px_0px_rgba(27,28,26,1)]">
          Remember for this product
        </button>
        <button disabled={disabled} onClick={onStartFresh} className="rounded-full border border-brand-black/15 bg-brand-cream px-4 py-2 text-xs font-black uppercase tracking-[0.14em]">
          Start fresh
        </button>
      </div>
    </section>
  );
};

export default WorkspaceImportPrompt;
