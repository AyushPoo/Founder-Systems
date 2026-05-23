export default function SettingsPanel({
  user,
  workspace,
  signOut,
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45">// Account Settings</p>
            <h2 className="text-xl font-black tracking-tight-brand text-brand-black mt-1">Signed-in Profile</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 p-4">
              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45">// Email Address</p>
              <p className="mt-1 text-[13px] font-mono font-semibold text-brand-black/75">{user?.email || 'Not available'}</p>
            </div>
            <div className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 p-4">
              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45">// Workspace Identifier</p>
              <p className="mt-1 text-[13px] font-semibold text-brand-black/75">{workspace?.name || 'Founder Workspace'}</p>
            </div>
          </div>
        </div>
        <button type="button" onClick={signOut} className="mt-6 rounded-lg border border-brand-black/10 bg-white px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-[#fee2e2] hover:text-[#ef4444] hover:border-[#fca5a5] transition-all self-start">
          Sign Out
        </button>
      </article>

      <article className="rounded-xl border border-brand-black/10 bg-white p-6 shadow-sm space-y-4">
        <div>
          <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-black/45">// App Defaults</p>
          <h2 className="text-xl font-black tracking-tight-brand text-brand-black mt-1">Preferences</h2>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 p-4">
            <p className="text-[13px] font-semibold leading-relaxed text-brand-black/60">
              Notifications and deeper app-level defaults can live here next as Founder Systems grows.
            </p>
          </div>
          <div className="rounded-xl border border-brand-black/10 bg-[#faf8f5]/50 p-4">
            <p className="text-[13px] font-semibold leading-relaxed text-brand-black/60">
              For now, connections and product context controls are handled in their own sections so this page stays clean.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}
