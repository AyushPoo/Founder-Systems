export default function BillingPanel({
  wallet,
  walletValueLabel,
  creditPacks,
  preferredCurrency,
  customCredits,
  customCreditCost,
  entitlements,
  submitting,
  onCurrencyChange,
  onCustomCreditsChange,
  onPackCheckout,
  formatMoneyMinor,
  getProductName,
  formatDate,
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black tracking-tight-brand">Workspace Wallet</h2>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/55">
            Manage credits, top-ups, and unlocked products.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-brand-black/5 pb-4">
          {['INR', 'USD'].map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => onCurrencyChange(currency)}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                preferredCurrency === currency
                  ? 'border-brand-black bg-brand-black text-white'
                  : 'border-brand-black/10 bg-white text-brand-black hover:bg-brand-cream/50'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-brand-black bg-black p-6 text-white shadow-md relative overflow-hidden">
          <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#10b981]">// WALLET BALANCE</p>
          <p className="mt-3.5 text-[2.6rem] font-mono font-black tracking-tight-brand text-white leading-none">{wallet?.balance ?? 0}</p>
          <p className="mt-3 text-[12px] font-mono font-semibold text-white/50">
            {walletValueLabel ? `VALUE: ${walletValueLabel}` : 'ESTIMATED VALUE PENDING...'}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-brand-black/45">// Credit Top-up Packs</p>
          {creditPacks.map((pack) => (
            <div key={pack.slug} className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 px-5 py-4 hover:bg-[#faf8f5] transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-[15px] font-black text-brand-black">{pack.name}</h3>
                  <p className="text-[12px] font-mono font-bold text-brand-black/50">
                    {pack.credits} credits for {formatMoneyMinor(pack.price_options_minor?.[preferredCurrency] ?? pack.amount_minor, preferredCurrency)}
                  </p>
                </div>
                <button disabled={submitting} onClick={() => onPackCheckout({ packSlug: pack.slug })} className="btn-cta !px-4 !py-2 !text-[11px] !font-mono">
                  Buy Pack
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-brand-black/10 bg-brand-cream/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-black text-brand-black">Custom Top-up</h3>
              <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/55">Choose the exact number of credits you need.</p>
            </div>
            <span className="rounded-lg border border-brand-black/10 bg-white px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider">
              {customCreditCost || 'Select Credits'}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex-1 min-w-[160px]">
              <span className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-black/45">// Credits</span>
              <input
                type="number"
                min="1"
                max="500"
                value={customCredits}
                onChange={(event) => onCustomCreditsChange(event.target.value)}
                className="w-full rounded-lg border border-brand-black/10 bg-white px-3 py-2 text-[13px] font-semibold outline-none focus:border-brand-orange"
              />
            </label>
            <button disabled={submitting} onClick={() => onPackCheckout({ credits: customCredits })} className="btn-cta !px-4 !py-2.5 !text-[11px] !font-mono">
              Buy {customCredits} Credits
            </button>
          </div>
        </div>
      </div>

      <aside className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm self-start">
        <h3 className="text-lg font-black tracking-tight-brand text-brand-black border-b border-brand-black/5 pb-3 mb-4">Unlocked Products</h3>
        <div className="space-y-3">
          {entitlements.length === 0 ? (
            <p className="text-xs font-semibold text-brand-black/40 italic py-2">No products unlocked yet.</p>
          ) : (
            entitlements.map((item) => (
              <div key={item.id} className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 p-4 hover:bg-[#faf8f5] transition-colors">
                <p className="text-[14px] font-black text-brand-black leading-snug">{getProductName(item.product_slug)}</p>
                <p className="text-[10px] font-mono font-bold text-brand-black/40 mt-1.5">
                  UNLOCKED: {formatDate(item.starts_at)}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}
