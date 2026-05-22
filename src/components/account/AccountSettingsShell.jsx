export default function AccountSettingsShell({
  title,
  subtitle,
  activeSection,
  onSectionChange,
  sections,
  children,
}) {
  return (
    <section className="grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-28 xl:self-start">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
          Workspace settings
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight-brand md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-sm text-base font-medium leading-7 text-brand-black/62">
          {subtitle}
        </p>
        <nav className="mt-8 space-y-2">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => onSectionChange(section.key)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                activeSection === section.key
                  ? 'border-brand-black bg-brand-black text-white'
                  : 'border-brand-black/10 bg-white text-brand-black hover:border-brand-black/25'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
