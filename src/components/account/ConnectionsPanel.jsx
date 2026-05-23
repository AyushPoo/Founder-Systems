function ConnectionCard({ item, actionLabel, disabled, onAction }) {
  const isConnected = item.status === 'connected';
  const isComingSoon = item.status === 'coming-soon';

  const statusBadgeClasses = isConnected
    ? 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
    : isComingSoon
    ? 'bg-neutral-100 text-neutral-500 border-neutral-200'
    : 'bg-brand-cream/80 text-brand-black/55 border-brand-black/10';

  return (
    <article className="rounded-xl border border-brand-black/10 bg-white p-5 shadow-sm flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-brand-black/45">{item.groupLabel || '// Integration'}</p>
            <h3 className="text-[17px] font-black tracking-tight-brand text-brand-black">{item.name}</h3>
          </div>
          <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${statusBadgeClasses}`}>
            {item.status === 'connected' ? 'Connected' : item.status === 'coming-soon' ? 'Coming soon' : 'Available'}
          </span>
        </div>
        
        <p className="text-[13px] font-semibold leading-relaxed text-brand-black/60">
          {item.description}
        </p>

        {item.accountLabel ? (
          <p className="text-[13px] font-mono font-bold text-[#10b981]">{item.accountLabel}</p>
        ) : null}

        {item.usedBy && item.usedBy.length > 0 ? (
          <div className="pt-2">
            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45 mb-1.5">// Used by</p>
            <div className="flex flex-wrap gap-1.5">
              {item.usedBy.map((value) => (
                <span key={value} className="rounded-lg border border-brand-black/10 bg-brand-cream/40 px-2 py-0.5 text-[10px] font-mono font-bold text-brand-black/60">
                  {value}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={disabled ? undefined : () => onAction?.(item)}
        className={`mt-5 rounded-lg px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${
          disabled
            ? 'cursor-not-allowed border border-brand-black/5 bg-neutral-50 text-neutral-400'
            : 'btn-cta !py-2 justify-center'
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
      <div className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black tracking-tight-brand text-brand-black">Connections</h2>
        <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-brand-black/55">
          Connect the tools Founder Systems can work with on your behalf.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-brand-black/45">// Connected</h3>
        <div className="grid gap-4 xl:grid-cols-2">
          {connected.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-black/20 bg-white px-5 py-8 text-center text-[13px] font-semibold text-brand-black/50">
              No active app connections yet.
            </div>
          ) : connected.map((item) => (
            <ConnectionCard
              key={item.key}
              item={item}
              actionLabel="Manage Connection"
              disabled={false}
              onAction={onAction}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-brand-black/45">// Available integrations</h3>
        <div className="grid gap-4 xl:grid-cols-2">
          {available.map((item) => (
            <ConnectionCard
              key={item.key}
              item={item}
              actionLabel={item.status === 'coming-soon' ? 'Coming Soon' : 'Connect'}
              disabled={item.status === 'coming-soon'}
              onAction={onAction}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
