export default function ActivityPanel({
  purchases,
  usageEvents,
  ledger,
  preferredCurrency,
  getPurchaseDisplayName,
  getProductName,
  formatDate,
  formatMoneyMinor,
  titleCase,
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h3 className="text-xl font-black tracking-tight-brand">Purchases</h3>
        <div className="mt-4 space-y-3">
          {purchases.length === 0 ? <p className="text-sm font-medium text-brand-black/55">No purchases yet.</p> : purchases.map((purchase) => (
            <div key={purchase.id} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
              <p className="text-sm font-black">{getPurchaseDisplayName(purchase)}</p>
              <p className="text-xs font-semibold text-brand-black/50">
                {titleCase(purchase.status)} • {formatMoneyMinor(purchase.amount_minor || 0, purchase.currency || preferredCurrency)} • {formatDate(purchase.created_at)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h3 className="text-xl font-black tracking-tight-brand">Usage</h3>
        <div className="mt-4 space-y-3">
          {usageEvents.length === 0 ? <p className="text-sm font-medium text-brand-black/55">No usage events yet.</p> : usageEvents.map((event) => (
            <div key={event.id} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
              <p className="text-sm font-black">{getProductName(event.product_slug)}</p>
              <p className="text-xs font-semibold text-brand-black/50">{titleCase(event.action)} • {event.credits_spent} credits • {formatDate(event.created_at)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h3 className="text-xl font-black tracking-tight-brand">Wallet ledger</h3>
        <div className="mt-4 space-y-3">
          {ledger.length === 0 ? <p className="text-sm font-medium text-brand-black/55">No credit activity yet.</p> : ledger.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{titleCase(entry.reason)}</p>
                  <p className="text-xs font-semibold text-brand-black/50">{entry.product_slug ? getProductName(entry.product_slug) : 'Workspace wallet'} • {formatDate(entry.created_at)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${entry.delta >= 0 ? 'bg-green-100 text-green-700' : 'bg-brand-black text-white'}`}>
                  {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
