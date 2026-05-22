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
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[20px] border border-brand-black/10 bg-white p-5">
        <h2 className="text-xl font-black tracking-tight-brand">Workspace wallet</h2>
        <p className="mt-1.5 text-[14px] font-medium leading-6 text-brand-black/58">
          Manage credits, top-ups, and unlocked products.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {['INR', 'USD'].map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => onCurrencyChange(currency)}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-black uppercase tracking-[0.14em] ${
                preferredCurrency === currency
                  ? 'border-brand-black bg-brand-black text-white'
                  : 'border-brand-black/10 bg-white text-brand-black'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-[18px] border border-brand-black/10 bg-brand-black px-5 py-4 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">Available now</p>
          <p className="mt-2 text-[2.2rem] font-black tracking-tight-brand">{wallet?.balance ?? 0}</p>
          <p className="mt-1.5 text-[13px] font-medium leading-5 text-white/70">
            {walletValueLabel ? `Estimated wallet value ${walletValueLabel}.` : 'Switch the wallet currency to preview value.'}
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {creditPacks.map((pack) => (
            <div key={pack.slug} className="rounded-[18px] border border-brand-black/10 bg-brand-cream px-4 py-3.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-[15px] font-black">{pack.name}</h3>
                  <p className="text-[13px] font-medium text-brand-black/58">
                    {pack.credits} credits for {formatMoneyMinor(pack.price_options_minor?.[preferredCurrency] ?? pack.amount_minor, preferredCurrency)}
                  </p>
                </div>
                <button disabled={submitting} onClick={() => onPackCheckout({ packSlug: pack.slug })} className="btn-cta !px-4 !py-2 !text-[12px]">
                  Buy pack
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[20px] border border-brand-black/10 bg-brand-cream px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-black">Custom amount</h3>
              <p className="mt-1 text-[13px] font-medium leading-5 text-brand-black/58">Choose the exact number of credits you want instead of using a preset pack.</p>
            </div>
            <span className="rounded-full border border-brand-black/10 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
              {customCreditCost || 'Select credits'}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="flex-1 min-w-[160px]">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">Credits</span>
              <input
                type="number"
                min="1"
                max="500"
                value={customCredits}
                onChange={(event) => onCustomCreditsChange(event.target.value)}
                className="w-full rounded-[18px] border border-brand-black/10 bg-white px-3.5 py-2.5 text-[14px] font-semibold outline-none focus:border-brand-orange"
              />
            </label>
            <button disabled={submitting} onClick={() => onPackCheckout({ credits: customCredits })} className="btn-cta !px-4 !py-2.5 !text-[12px]">
              Buy {customCredits} credits
            </button>
          </div>
        </div>
      </div>

      <aside className="rounded-[20px] border border-brand-black/10 bg-white p-5">
        <h3 className="text-lg font-black tracking-tight-brand">Unlocked products</h3>
        <div className="mt-3 space-y-2.5">
          {entitlements.length === 0 ? <p className="text-sm font-medium text-brand-black/55">No unlocked products yet.</p> : entitlements.map((item) => (
            <div key={item.id} className="rounded-[18px] border border-brand-black/10 bg-brand-cream px-4 py-3">
              <p className="text-[13px] font-black">{getProductName(item.product_slug)}</p>
              <p className="text-xs font-semibold text-brand-black/50">{formatDate(item.starts_at)}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
