function PreferenceToggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-[18px] border border-brand-black/10 bg-brand-cream px-3.5 py-2.5">
      <span className="text-[13px] leading-5">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}

export default function ProductsPanel({
  productConnections,
  preferences,
  onPreferenceSave,
  getDefaultPreference,
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {productConnections.map((product) => {
        const preference = getDefaultPreference(product.slug, preferences);
        return (
          <article key={product.slug} className="rounded-[20px] border border-brand-black/10 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">{product.slug}</p>
                <h2 className="mt-1.5 text-lg font-black tracking-tight-brand">{product.name}</h2>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                preference.allow_product_read || preference.allow_product_write
                  ? 'bg-brand-black text-white'
                  : 'bg-brand-cream text-brand-black/70'
              }`}>
                {preference.allow_product_read || preference.allow_product_write ? 'Connected' : 'Paused'}
              </span>
            </div>
            <p className="mt-2 text-[14px] font-medium leading-6 text-brand-black/62">{product.description}</p>
            <div className="mt-3 rounded-[18px] border border-brand-black/10 bg-brand-cream px-3.5 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">When this tool needs workspace context</p>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-brand-black/75">
                {preference.import_mode === 'always_allow'
                  ? 'Always use shared context.'
                  : preference.import_mode === 'start_fresh'
                    ? 'Start fresh by default.'
                    : 'Ask every time.'}
              </p>
            </div>
            <div className="mt-4 space-y-2.5 text-sm font-semibold">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">Workspace context mode</span>
                <select
                  value={preference.import_mode}
                  onChange={(event) => onPreferenceSave(product.slug, { ...preference, import_mode: event.target.value })}
                  className="w-full rounded-[18px] border border-brand-black/10 bg-brand-cream px-3.5 py-2.5 text-[14px] outline-none focus:border-brand-orange"
                >
                  <option value="ask">Ask every time</option>
                  <option value="always_allow">Always use shared context</option>
                  <option value="start_fresh">Start fresh by default</option>
                </select>
              </label>
              <PreferenceToggle
                label="Allow this product to read workspace context"
                checked={preference.allow_product_read}
                onChange={(event) => onPreferenceSave(product.slug, { ...preference, allow_product_read: event.target.checked })}
              />
              <PreferenceToggle
                label="Allow this product to save confirmed context"
                checked={preference.allow_product_write}
                onChange={(event) => onPreferenceSave(product.slug, { ...preference, allow_product_write: event.target.checked })}
              />
              <PreferenceToggle
                label="Allow inferred suggestions"
                checked={preference.allow_inferred_suggestions}
                onChange={(event) => onPreferenceSave(product.slug, { ...preference, allow_inferred_suggestions: event.target.checked })}
              />
              <PreferenceToggle
                label="Allow save-back to workspace"
                checked={preference.allow_save_to_workspace}
                onChange={(event) => onPreferenceSave(product.slug, { ...preference, allow_save_to_workspace: event.target.checked })}
              />
              <PreferenceToggle
                label="Start fresh by default"
                checked={preference.start_fresh_by_default}
                onChange={(event) => onPreferenceSave(product.slug, { ...preference, start_fresh_by_default: event.target.checked })}
              />
            </div>
          </article>
        );
      })}
    </section>
  );
}
