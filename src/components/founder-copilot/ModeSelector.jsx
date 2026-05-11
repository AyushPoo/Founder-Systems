const ModeSelector = ({ modes = [], selectedMode, onSelect }) => {
  return (
    <section className="mx-auto max-w-[1080px]">
      <div className="mb-5 grid gap-2 text-sm font-black uppercase tracking-[0.14em] text-brand-black/48 sm:grid-cols-3">
        <span>Idea validation</span>
        <span>Strategy audit</span>
        <span>Business plan</span>
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
              <p
                className={`mb-3 text-[1.45rem] font-black leading-[1.02] tracking-tight-brand sm:text-[1.55rem] lg:mb-4 lg:text-[1.75rem] ${
                  isActive ? 'text-white' : 'text-brand-black'
                }`}
              >
                {mode.title}
              </p>
              <p
                className={`max-w-[28ch] text-[13px] font-bold leading-relaxed sm:text-sm lg:text-[15px] ${
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
