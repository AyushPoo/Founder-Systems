const ModeSelector = ({ modes = [], selectedMode, onSelect, compact = false }) => {
  return (
    <section
      className={`rounded-[24px] border-2 border-brand-black bg-brand-cream/35 ${
        compact ? 'p-4 md:p-5' : 'p-6 md:p-7'
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-3">
        Start here
      </p>
      <h2 className={`${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-[2rem]'} font-black tracking-tight-brand mb-2`}>
        What do you need help with right now?
      </h2>
      <p className="text-sm md:text-base font-bold leading-relaxed text-brand-black/65 mb-4">
        Pick the closest starting point. The copilot should narrow with the founder instead of
        asking for fake certainty up front.
      </p>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
        {modes.map((mode) => {
          const isActive = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className={`text-left rounded-[20px] border-2 border-brand-black p-4 md:p-5 transition-all min-h-[148px] ${
                isActive
                  ? 'bg-brand-orange text-white shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
                  : 'bg-white hover:shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
              }`}
            >
              <p className="text-base md:text-lg font-black tracking-tight-brand mb-2">{mode.title}</p>
              <p
                className={`text-sm font-bold leading-relaxed ${
                  isActive ? 'text-white/90' : 'text-brand-black/65'
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
