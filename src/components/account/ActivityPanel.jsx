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
  const getDayKey = (dateStr) => {
    if (!dateStr) return 'unknown';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'unknown';
    return d.toDateString();
  };

  const formatGroupDate = (dateStr, isGrouped) => {
    if (!isGrouped) return formatDate(dateStr);
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return 'Just now';
    return parsed.toLocaleDateString();
  };

  const groupedLedger = [];
  const ledgerGroups = {};

  ledger.forEach((entry) => {
    const dayKey = getDayKey(entry.created_at);
    const key = `${entry.reason}-${entry.product_slug || ''}-${dayKey}`;

    if (!ledgerGroups[key]) {
      ledgerGroups[key] = {
        id: entry.id,
        reason: entry.reason,
        product_slug: entry.product_slug,
        delta: 0,
        count: 0,
        created_at: entry.created_at,
      };
      groupedLedger.push(ledgerGroups[key]);
    }

    ledgerGroups[key].delta += entry.delta;
    ledgerGroups[key].count += 1;
  });

  const groupedUsage = [];
  const usageGroups = {};

  usageEvents.forEach((event) => {
    const dayKey = getDayKey(event.created_at);
    const key = `${event.product_slug}-${event.action}-${dayKey}`;

    if (!usageGroups[key]) {
      usageGroups[key] = {
        id: event.id,
        product_slug: event.product_slug,
        action: event.action,
        credits_spent: 0,
        count: 0,
        created_at: event.created_at,
      };
      groupedUsage.push(usageGroups[key]);
    }

    usageGroups[key].credits_spent += event.credits_spent;
    usageGroups[key].count += 1;
  });

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black tracking-tight-brand text-brand-black border-b border-brand-black/5 pb-3 mb-4">Purchases</h3>
        <div className="space-y-3">
          {purchases.length === 0 ? (
            <p className="text-xs font-semibold text-brand-black/40 italic py-2">No purchases yet.</p>
          ) : (
            purchases.map((purchase) => (
              <div key={purchase.id} className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 p-4 hover:bg-[#faf8f5] transition-colors">
                <p className="text-[13px] font-black text-brand-black leading-snug">{getPurchaseDisplayName(purchase)}</p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/45 mt-2">
                  status: {titleCase(purchase.status)}
                </p>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/40 mt-1">
                  {formatMoneyMinor(purchase.amount_minor || 0, purchase.currency || preferredCurrency)} • {formatDate(purchase.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black tracking-tight-brand text-brand-black border-b border-brand-black/5 pb-3 mb-4">Usage</h3>
        <div className="space-y-3">
          {groupedUsage.length === 0 ? (
            <p className="text-xs font-semibold text-brand-black/40 italic py-2">No usage events yet.</p>
          ) : (
            groupedUsage.map((event) => {
              const isGrouped = event.count > 1;
              return (
                <div key={event.id} className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 p-4 hover:bg-[#faf8f5] transition-colors">
                  <p className="text-[13px] font-black text-brand-black leading-snug">
                    {getProductName(event.product_slug)}
                    {isGrouped && (
                      <span className="ml-1.5 text-[10px] font-mono font-bold text-brand-black/40">
                        ({event.count} actions)
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ea580c] mt-2">
                    action: {titleCase(event.action)}
                  </p>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/40 mt-1">
                    {event.credits_spent} credits • {formatGroupDate(event.created_at, isGrouped)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black tracking-tight-brand text-brand-black border-b border-brand-black/5 pb-3 mb-4">Wallet Ledger</h3>
        <div className="space-y-3">
          {groupedLedger.length === 0 ? (
            <p className="text-xs font-semibold text-brand-black/40 italic py-2">No credit activity yet.</p>
          ) : (
            groupedLedger.map((entry) => {
              const isPositive = entry.delta >= 0;
              const isGrouped = entry.count > 1;
              return (
                <div key={entry.id} className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 p-4 hover:bg-[#faf8f5] transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-black text-brand-black leading-none">
                        {titleCase(entry.reason)}
                        {isGrouped && (
                          <span className="ml-1.5 text-[10px] font-mono font-bold text-brand-black/40">
                            ({entry.count} transactions)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] font-mono font-medium text-brand-black/40">
                        {entry.product_slug ? getProductName(entry.product_slug) : 'Workspace Wallet'} • {formatGroupDate(entry.created_at, isGrouped)}
                      </p>
                    </div>
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono font-bold ${
                      isPositive
                        ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                        : 'bg-neutral-100 text-neutral-600 border-[#dadce0]'
                    }`}>
                      {isPositive ? `+${entry.delta}` : entry.delta}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
