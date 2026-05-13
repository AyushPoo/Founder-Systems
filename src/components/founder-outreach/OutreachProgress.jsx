const OutreachProgress = ({ steps, activeStep, missingCount, completedCount, hasResult }) => {
  return (
    <section className="rounded-[24px] border border-brand-black/10 bg-white p-5 shadow-[0_18px_34px_rgba(27,28,26,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[720px]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
            Founder outreach workflow
          </p>
          <h1 className="mt-2 text-[2rem] font-black leading-[0.95] tracking-tight-brand sm:text-[2.6rem]">
            Shape the campaign before you ask for the reply.
          </h1>
          <p className="mt-2 max-w-[640px] text-sm font-medium leading-relaxed text-brand-black/60 sm:text-[15px]">
            Move through the intake in order, pressure-test the positioning, then generate
            outreach assets without losing your draft if the request fails.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[360px]">
          <div className="rounded-2xl bg-brand-cream px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              Current step
            </p>
            <p className="mt-1 text-sm font-black text-brand-black">
              {activeStep + 1} / {steps.length}
            </p>
          </div>
          <div className="rounded-2xl bg-brand-cream px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              Required done
            </p>
            <p className="mt-1 text-sm font-black text-brand-black">{completedCount}</p>
          </div>
          <div className="rounded-2xl bg-brand-cream px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              Campaign status
            </p>
            <p className="mt-1 text-sm font-black text-brand-black">
              {hasResult ? 'Generated' : missingCount === 0 ? 'Ready to generate' : 'In progress'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-5">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isComplete = index < activeStep;

          return (
            <div
              key={step.id}
              className={`rounded-2xl border px-4 py-3 transition-colors ${
                isActive
                  ? 'border-brand-black bg-brand-black text-white'
                  : isComplete
                    ? 'border-brand-black/12 bg-brand-orange text-white'
                    : 'border-brand-black/10 bg-brand-cream text-brand-black/55'
              }`}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">
                Step {index + 1}
              </p>
              <p className="mt-1 text-sm font-black">{step.label}</p>
              <p className="mt-1 text-xs font-medium leading-relaxed opacity-80">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default OutreachProgress;
