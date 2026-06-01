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

  // Deduplicate chips by type — show each type once with a count if > 1
  const typeCounts = new Map();
  memoryItems.slice(0, 8).forEach((item) => {
    const label = String(item.label || item.type || 'Memory').replace(/_/g, ' ');
    typeCounts.set(label, (typeCounts.get(label) || 0) + 1);
  });
  const uniqueChips = [...typeCounts.entries()].slice(0, 5);

  return (
    <section className="relative rounded-[16px] border border-brand-black/8 bg-white px-4 py-3 shadow-[0_4px_12px_rgba(27,28,26,0.03)]">
      {/* Dismiss button */}
      <button
        type="button"
        onClick={onStartFresh}
        disabled={disabled}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-brand-black/10 bg-brand-cream/50 text-[11px] font-black text-brand-black/40 transition hover:bg-brand-black/5 hover:text-brand-black/70"
        aria-label="Dismiss workspace memory"
      >
        ✕
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-cream px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-brand-black/45">
          Workspace memory
        </span>
        {uniqueChips.map(([label, count]) => (
          <span
            key={label}
            className="text-[10px] font-medium text-brand-black/40"
          >
            {label}{count > 1 ? ` ×${count}` : ''}
          </span>
        ))}
      </div>

      <p className="mt-1.5 text-[13px] font-semibold text-brand-black/70">
        {title}
      </p>
      <p className="mt-0.5 text-[11.5px] font-medium leading-relaxed text-brand-black/45">
        {description || 'Your saved company context can pre-fill this tool so you don\'t repeat yourself.'}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          disabled={disabled}
          onClick={onUseOnce}
          className="rounded-full border border-brand-black bg-brand-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-brand-black/85 disabled:opacity-60"
        >
          Use context
        </button>
        <button
          disabled={disabled}
          onClick={onStartFresh}
          className="rounded-full border border-brand-black/12 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/55 transition hover:border-brand-black/20 disabled:opacity-60"
        >
          Skip
        </button>
        <button
          disabled={disabled}
          onClick={onAlwaysAllow}
          className="text-[10px] font-medium text-brand-black/35 underline decoration-brand-black/15 transition hover:text-brand-black/55 disabled:opacity-60"
        >
          Always use for this tool
        </button>
      </div>
    </section>
  );
};

export default WorkspaceImportPrompt;
