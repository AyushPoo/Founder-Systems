const ModeSelector = ({ modes, selectedMode, onSelect }) => {
  return (
    <section className="rounded-[28px] border-2 border-brand-black bg-white p-6 md:p-7 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-3">
        Start here
      </p>
      <h2 className="text-2xl md:text-[2rem] font-black tracking-tight-brand mb-3">
        What do you need help with right now?
      </h2>
      <p className="text-sm md:text-base font-bold leading-relaxed text-brand-black/65 mb-6">
        Pick the closest starting point. The copilot should do the narrowing for the founder, not
        demand fake certainty up front.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {modes.map((mode) => {
          const isActive = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className={`text-left rounded-[24px] border-2 border-brand-black p-5 transition-all ${
                isActive
                  ? 'bg-brand-orange text-white shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
                  : 'bg-brand-cream/35 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]'
              }`}
            >
              <p className="text-lg md:text-xl font-black tracking-tight-brand mb-2">{mode.title}</p>
              <p
                className={`text-sm md:text-base font-bold leading-relaxed ${
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
