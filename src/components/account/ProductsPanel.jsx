function PreferenceToggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-brand-black/10 bg-[#faf8f5]/40 hover:bg-[#faf8f5] transition-colors px-4 py-2.5 cursor-pointer">
      <span className="text-[13px] font-semibold text-brand-black/75">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-brand-orange w-4 h-4 cursor-pointer" />
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
    <section className="grid gap-6 xl:grid-cols-2">
      {productConnections.map((product) => {
        const preference = getDefaultPreference(product.slug, preferences);
        const isConnected = preference.allow_product_read || preference.allow_product_write;
        return (
          <article key={product.slug} className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-brand-black/45">// {product.slug}</p>
                  <h2 className="text-lg font-black tracking-tight-brand text-brand-black">{product.name}</h2>
                </div>
                <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                  isConnected
                    ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]'
                    : 'bg-brand-cream/80 text-brand-black/55 border-brand-black/10'
                }`}>
                  {isConnected ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-[13px] font-semibold leading-relaxed text-brand-black/60">{product.description}</p>
              
              <div className="rounded-lg border border-brand-black/10 bg-brand-cream/15 p-4 space-y-1">
                <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45">// Current context import rule</p>
                <p className="text-[13px] font-black text-brand-black/80">
                  {preference.import_mode === 'always_allow'
                    ? 'Always use shared workspace context.'
                    : preference.import_mode === 'start_fresh'
                      ? 'Start fresh by default.'
                      : 'Ask every time.'}
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <label className="block">
                  <span className="mb-1.5 block text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45">// Workspace context mode</span>
                  <select
                    value={preference.import_mode}
                    onChange={(event) => onPreferenceSave(product.slug, { ...preference, import_mode: event.target.value })}
                    className="w-full rounded-lg border border-brand-black/10 bg-white px-3 py-2 text-[13px] font-semibold outline-none focus:border-brand-orange"
                  >
                    <option value="ask">Ask every time</option>
                    <option value="always_allow">Always use shared context</option>
                    <option value="start_fresh">Start fresh by default</option>
                  </select>
                </label>
                
                <div className="space-y-2">
                  <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45 mb-1.5">// Permission Flags</p>
                  <div className="grid gap-2">
                    <PreferenceToggle
                      label="Allow read access to workspace context"
                      checked={preference.allow_product_read}
                      onChange={(event) => onPreferenceSave(product.slug, { ...preference, allow_product_read: event.target.checked })}
                    />
                    <PreferenceToggle
                      label="Allow write access to workspace context"
                      checked={preference.allow_product_write}
                      onChange={(event) => onPreferenceSave(product.slug, { ...preference, allow_product_write: event.target.checked })}
                    />
                    <PreferenceToggle
                      label="Allow background inferred suggestions"
                      checked={preference.allow_inferred_suggestions}
                      onChange={(event) => onPreferenceSave(product.slug, { ...preference, allow_inferred_suggestions: event.target.checked })}
                    />
                    <PreferenceToggle
                      label="Allow saving new context to workspace"
                      checked={preference.allow_save_to_workspace}
                      onChange={(event) => onPreferenceSave(product.slug, { ...preference, allow_save_to_workspace: event.target.checked })}
                    />
                    <PreferenceToggle
                      label="Enforce starting fresh by default"
                      checked={preference.start_fresh_by_default}
                      onChange={(event) => onPreferenceSave(product.slug, { ...preference, start_fresh_by_default: event.target.checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
