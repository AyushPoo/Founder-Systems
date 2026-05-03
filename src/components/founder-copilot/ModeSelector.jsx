const ModeSelector = ({ modes = [], selectedMode, onSelect }) => {
  return (
    <section className="mx-auto max-w-[1080px]">
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        {modes.map((mode) => {
          const isActive = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className={`flex min-h-[156px] flex-col justify-between rounded-[24px] border border-brand-black/15 bg-white px-5 py-5 text-left transition-all md:min-h-[188px] md:px-6 md:py-6 ${
                isActive
                  ? 'border-brand-black bg-brand-black text-white shadow-[0_20px_40px_rgba(27,28,26,0.12)]'
                  : 'hover:-translate-y-0.5 hover:border-brand-black/25 hover:shadow-[0_18px_36px_rgba(27,28,26,0.08)]'
              }`}
            >
              <p
                className={`mb-4 text-[1.4rem] font-black leading-[1.08] tracking-tight-brand md:text-[1.75rem] ${
                  isActive ? 'text-white' : 'text-brand-black'
                }`}
              >
                {mode.title}
              </p>
              <p
                className={`max-w-[26ch] text-sm font-bold leading-relaxed md:text-[15px] ${
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
