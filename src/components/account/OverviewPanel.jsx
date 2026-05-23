function ActionButton({ action }) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className="group rounded-xl border border-brand-black/10 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-black/25 hover:bg-brand-cream shadow-sm"
    >
      <p className="text-[11px] font-mono font-black uppercase tracking-[0.15em] text-brand-orange flex items-center justify-between">
        <span>// {action.label}</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
      </p>
      <p className="mt-2.5 text-[13px] font-semibold leading-normal text-brand-black/60">{action.description}</p>
    </button>
  );
}

export default function OverviewPanel({
  overviewCards,
  workspaceName,
  quickActions,
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm">
        <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-brand-black/45">
          // Workspace Summary
        </p>
        <h2 className="mt-2.5 text-xl md:text-2xl font-black tracking-tight-brand text-brand-black">
          {workspaceName || 'Founder Workspace'}
        </h2>
        <p className="mt-2 text-[13px] font-medium leading-relaxed text-brand-black/60 max-w-3xl">
          Keep your shared context, connected tools, operator access, and credits organized in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <article key={card.label} className="rounded-xl border border-brand-black/10 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-brand-black/45">{card.label}</p>
              <p className="mt-3 text-[1.85rem] font-mono font-black tracking-tight-brand text-brand-black leading-none">{card.value}</p>
            </div>
            <p className="mt-3 text-[12px] font-semibold leading-relaxed text-brand-black/50">{card.meta}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </div>
    </section>
  );
}
