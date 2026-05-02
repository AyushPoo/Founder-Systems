const ModeSelector = ({ modes = [], selectedMode, onSelect }) => {
  return (
    <section className="mx-auto max-w-[1080px]">
      <h2 className="text-[1.9rem] md:text-[2.25rem] font-black tracking-tight-brand mb-2">
        Where are you right now?
      </h2>
      <p className="text-sm md:text-base font-bold leading-relaxed text-brand-black/55 mb-8 max-w-[560px]">
        Pick the closest starting point.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {modes.map((mode) => {
          const isActive = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className={`text-left rounded-[28px] border-2 border-brand-black bg-white p-6 md:p-7 transition-all min-h-[208px] flex flex-col justify-between ${
                isActive
                  ? 'bg-brand-orange text-white shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
                  : 'hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(27,28,26,1)]'
              }`}
            >
              <p className="text-[1.7rem] md:text-[1.95rem] font-black tracking-tight-brand mb-4 leading-[1.08] max-w-[11ch]">
                {mode.title}
              </p>
              <p
                className={`text-base font-bold leading-relaxed ${
                  isActive ? 'text-white/90' : 'text-brand-black/60'
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
