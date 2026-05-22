function ActionButton({ action }) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className="rounded-[22px] border border-brand-black/10 bg-white px-5 py-5 text-left transition hover:border-brand-black/25 hover:bg-brand-cream"
    >
      <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-black">{action.label}</p>
      <p className="mt-2 text-sm font-medium leading-relaxed text-brand-black/58">{action.description}</p>
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
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6 md:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
          Overview
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight-brand md:text-3xl">
          {workspaceName || 'Founder Workspace'}
        </h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-brand-black/60 md:text-base">
          Keep your shared context, connected tools, operator access, and credits organized in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {overviewCards.map((card) => (
          <article key={card.label} className="rounded-[22px] border border-brand-black/10 bg-white p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">{card.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight-brand">{card.value}</p>
            <p className="mt-2 text-sm font-medium text-brand-black/58">{card.meta}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </div>
    </section>
  );
}
