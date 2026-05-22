export default function SettingsPanel({
  user,
  workspace,
  signOut,
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Account</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight-brand">Signed-in account</h2>
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Email</p>
            <p className="mt-1 text-sm font-semibold text-brand-black/75">{user?.email || 'Not available'}</p>
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-brand-black/75">{workspace?.name || 'Founder Workspace'}</p>
          </div>
        </div>
        <button type="button" onClick={signOut} className="mt-5 rounded-2xl border border-brand-black/10 bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em]">
          Sign out
        </button>
      </article>

      <article className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Defaults</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight-brand">Workspace defaults</h2>
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-4">
            <p className="text-sm font-semibold text-brand-black/75">Notifications and deeper app-level defaults can live here next as Founder Systems grows.</p>
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-4">
            <p className="text-sm font-semibold text-brand-black/75">For now, connections and product context controls are handled in their own sections so this page stays clean.</p>
          </div>
        </div>
      </article>
    </section>
  );
}
