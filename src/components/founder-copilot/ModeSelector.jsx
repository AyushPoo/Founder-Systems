const ModeSelector = ({ modes = [], selectedMode, onSelect }) => {
  return (
    <section className="mx-auto max-w-[1080px]">
      <div className="mb-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/48 sm:text-sm">
        <span className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5">Market brief</span>
        <span className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5">Idea validation</span>
        <span className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5">Plan review</span>
        <span className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5">Strategy audit</span>
        <span className="rounded-full border border-brand-black/10 bg-white px-3 py-1.5">Plan builder</span>
      </div>
      <div className="grid gap-3.5 lg:grid-cols-3 lg:gap-5">
        {modes.map((mode) => {
          const isActive = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className={`flex min-h-[138px] flex-col justify-between rounded-[24px] border border-brand-black/12 bg-white px-4 py-4 text-left transition-all sm:min-h-[150px] sm:px-5 sm:py-5 lg:min-h-[188px] lg:px-6 lg:py-6 ${
                isActive
                  ? 'border-brand-black bg-brand-black text-white shadow-[0_20px_40px_rgba(27,28,26,0.12)]'
                  : 'hover:-translate-y-0.5 hover:border-brand-black/25 hover:shadow-[0_18px_36px_rgba(27,28,26,0.08)]'
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
              <p className={`mb-3 text-[1.45rem] font-black leading-[1.02] tracking-tight-brand sm:text-[1.55rem] lg:mb-4 lg:text-[1.75rem] ${isActive ? 'text-white' : 'text-brand-black'}`}>
                {mode.title}
              </p>
              <p
                className={`max-w-[28ch] text-[13px] font-bold leading-relaxed sm:text-sm lg:text-[15px] ${
                  isActive ? 'text-white/78' : 'text-brand-black/58'
                }`}
              >
                {mode.description}
              </p>
              {Array.isArray(mode.capabilities) && mode.capabilities.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {mode.capabilities.map((item) => (
                    <span
                      key={`${mode.id}-${item}`}
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                        isActive
                          ? 'border-white/24 bg-white/10 text-white'
                          : 'border-brand-black/10 bg-brand-cream/45 text-brand-black/56'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ModeSelector;
