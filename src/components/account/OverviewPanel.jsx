function ActionButton({ action }) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className="rounded-[18px] border border-brand-black/10 bg-white px-4 py-4 text-left transition hover:border-brand-black/25 hover:bg-brand-cream"
    >
      <p className="text-[12px] font-black uppercase tracking-[0.14em] text-brand-black">{action.label}</p>
      <p className="mt-1.5 text-[13px] font-medium leading-6 text-brand-black/58">{action.description}</p>
    </button>
  );
}

export default function OverviewPanel({
  overviewCards,
  workspaceName,
  quickActions,
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-[20px] border border-brand-black/10 bg-white p-5 md:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">
          Overview
        </p>
        <h2 className="mt-2 text-xl font-black tracking-tight-brand md:text-2xl">
          {workspaceName || 'Founder Workspace'}
        </h2>
        <p className="mt-2 max-w-3xl text-[14px] font-medium leading-6 text-brand-black/60">
          Keep your shared context, connected tools, operator access, and credits organized in one place.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {overviewCards.map((card) => (
          <article key={card.label} className="rounded-[18px] border border-brand-black/10 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">{card.label}</p>
            <p className="mt-2 text-[1.75rem] font-black tracking-tight-brand">{card.value}</p>
            <p className="mt-1.5 text-[13px] font-medium leading-5 text-brand-black/58">{card.meta}</p>
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
