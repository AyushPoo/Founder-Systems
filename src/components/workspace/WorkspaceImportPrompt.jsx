const WorkspaceImportPrompt = ({
  title = 'Use workspace memory?',
  description,
  memoryItems = [],
  onUseOnce,
  onAlwaysAllow,
  onStartFresh,
  disabled = false,
  dismissable = true,
}) => {
  if (!memoryItems.length) {
    return null;
  }

  // Deduplicate chips by type — show each type once with a count if > 1
  const typeCounts = new Map();
  memoryItems.slice(0, 8).forEach((item) => {
    const label = String(item.label || item.type || 'Memory').replace(/_/g, ' ');
    typeCounts.set(label, (typeCounts.get(label) || 0) + 1);
  });
  const uniqueChips = [...typeCounts.entries()].slice(0, 5);

  return (
    <section className="rounded-[18px] border border-brand-black/10 bg-white px-4 py-3.5 shadow-[0_8px_18px_rgba(27,28,26,0.045)]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-black/42">Workspace memory</p>
      <h2 className="mt-1.5 text-[15px] font-black tracking-tight-brand">{title}</h2>
      <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/55">
        {description || 'Pull relevant context from your Founder Workspace so you do not have to restate the same company facts.'}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {uniqueChips.map(([label, count]) => (
          <span
            key={label}
            className="rounded-full border border-brand-black/10 bg-brand-cream px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-[0.12em] text-brand-black/58"
          >
            {label}{count > 1 ? ` (${count})` : ''}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={disabled} onClick={onUseOnce} className="rounded-full border border-brand-black bg-brand-orange px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-white disabled:opacity-60">
          Use once
        </button>
        <button disabled={disabled} onClick={onAlwaysAllow} className="rounded-full border border-brand-black bg-white px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-brand-black shadow-[2px_2px_0px_0px_rgba(27,28,26,1)] disabled:opacity-60">
          Remember for this product
        </button>
        <button disabled={disabled} onClick={onStartFresh} className="rounded-full border border-brand-black/12 bg-brand-cream px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-brand-black/65 disabled:opacity-60">
          Start fresh
        </button>
      </div>
    </section>
  );
};

export default WorkspaceImportPrompt;
