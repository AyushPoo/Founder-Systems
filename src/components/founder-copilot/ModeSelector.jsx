const ModeSelector = ({ modes = [], selectedMode, onSelect }) => {
  return (
    <section className="mx-auto max-w-[1080px]">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/42">
        <span className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5">Idea validation</span>
        <span className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5">Strategy audit</span>
        <span className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5">Business plan</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        {modes.map((mode) => {
          const isActive = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className={`flex min-h-[120px] flex-col gap-4 rounded-[20px] border border-brand-black/10 bg-white px-4 py-4 text-left transition-all sm:min-h-[128px] sm:px-5 sm:py-5 lg:min-h-[156px] ${
                isActive
                  ? 'border-brand-black bg-brand-black text-white shadow-[0_18px_36px_rgba(27,28,26,0.14)]'
                  : 'hover:-translate-y-0.5 hover:border-brand-black/20 hover:shadow-[0_16px_30px_rgba(27,28,26,0.08)]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`text-[11px] font-black uppercase tracking-[0.14em] ${isActive ? 'text-white/62' : 'text-brand-black/38'}`}>
                  {mode.id === 'no_idea' ? '01' : mode.id === 'messy_idea' ? '02' : '03'}
                </span>
                <span className={`text-[11px] font-black ${isActive ? 'text-white/62' : 'text-brand-black/38'}`}>
                  {mode.id === 'no_idea' ? 'Start from zero' : mode.id === 'messy_idea' ? 'Pressure-test' : 'Package the plan'}
                </span>
              </div>
              <p className={`text-[1.2rem] font-black leading-[1.02] tracking-tight-brand sm:text-[1.32rem] lg:text-[1.5rem] ${isActive ? 'text-white' : 'text-brand-black'}`}>
                {mode.title}
              </p>
              <p
                className={`max-w-[30ch] text-[13px] font-bold leading-relaxed sm:text-sm ${
                  isActive ? 'text-white/78' : 'text-brand-black/58'
                }`}
              >
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ModeSelector;
