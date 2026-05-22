function ConnectionCard({ item, actionLabel, disabled, onAction }) {
  return (
    <article className="rounded-[24px] border border-brand-black/10 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">{item.groupLabel}</p>
          <h3 className="mt-2 text-xl font-black tracking-tight-brand">{item.name}</h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-brand-black/62">
            {item.description}
          </p>
        </div>
        <span className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">
          {item.status === 'connected' ? 'Connected' : item.status === 'coming-soon' ? 'Coming soon' : 'Not connected'}
        </span>
      </div>
      {item.accountLabel ? (
        <p className="mt-4 text-sm font-semibold text-brand-black/72">{item.accountLabel}</p>
      ) : null}
      <div className="mt-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Used by</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {item.usedBy.map((value) => (
            <span key={value} className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-1 text-xs font-bold text-brand-black/70">
              {value}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={disabled ? undefined : () => onAction?.(item)}
        className={`mt-5 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.14em] ${
          disabled
            ? 'cursor-not-allowed border border-brand-black/10 bg-brand-cream text-brand-black/45'
            : 'btn-cta'
        }`}
      >
        {actionLabel}
      </button>
    </article>
  );
}

export default function ConnectionsPanel({ connected, available, onAction }) {
  return (
    <section className="space-y-8">
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h2 className="text-2xl font-black tracking-tight-brand">Connections</h2>
        <p className="mt-2 text-sm font-medium text-brand-black/58">
          Connect the tools Founder Systems can work with on your behalf.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-black uppercase tracking-[0.14em] text-brand-black/55">Connected</h3>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          {connected.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-black/20 bg-white px-5 py-6 text-sm font-medium text-brand-black/55">
              No live app connections yet.
            </div>
          ) : connected.map((item) => (
            <ConnectionCard
              key={item.key}
              item={item}
              actionLabel="Manage"
              disabled={false}
              onAction={onAction}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-black uppercase tracking-[0.14em] text-brand-black/55">Available</h3>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          {available.map((item) => (
            <ConnectionCard
              key={item.key}
              item={item}
              actionLabel={item.status === 'coming-soon' ? 'Coming soon' : 'Connect'}
              disabled={item.status === 'coming-soon'}
              onAction={onAction}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
