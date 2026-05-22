function ConnectionCard({ item, actionLabel, disabled, onAction }) {
  return (
    <article className="rounded-[20px] border border-brand-black/10 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">{item.groupLabel}</p>
          <h3 className="mt-1.5 text-lg font-black tracking-tight-brand">{item.name}</h3>
          <p className="mt-1.5 text-[14px] font-medium leading-6 text-brand-black/62">
            {item.description}
          </p>
        </div>
        <span className="rounded-full border border-brand-black/10 bg-brand-cream px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
          {item.status === 'connected' ? 'Connected' : item.status === 'coming-soon' ? 'Coming soon' : 'Not connected'}
        </span>
      </div>
      {item.accountLabel ? (
        <p className="mt-3 text-[14px] font-semibold text-brand-black/72">{item.accountLabel}</p>
      ) : null}
      <div className="mt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">Used by</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.usedBy.map((value) => (
            <span key={value} className="rounded-full border border-brand-black/10 bg-brand-cream px-2.5 py-1 text-[11px] font-bold text-brand-black/70">
              {value}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={disabled ? undefined : () => onAction?.(item)}
        className={`mt-4 rounded-xl px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.14em] ${
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
    <section className="space-y-6">
      <div className="rounded-[20px] border border-brand-black/10 bg-white p-5">
        <h2 className="text-xl font-black tracking-tight-brand">Connections</h2>
        <p className="mt-1.5 text-[14px] font-medium leading-6 text-brand-black/58">
          Connect the tools Founder Systems can work with on your behalf.
        </p>
      </div>

      <div>
        <h3 className="text-[13px] font-black uppercase tracking-[0.16em] text-brand-black/55">Connected</h3>
        <div className="mt-3 grid gap-4 xl:grid-cols-2">
          {connected.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-brand-black/20 bg-white px-4 py-5 text-[14px] font-medium text-brand-black/55">
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
        <h3 className="text-[13px] font-black uppercase tracking-[0.16em] text-brand-black/55">Available</h3>
        <div className="mt-3 grid gap-4 xl:grid-cols-2">
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
