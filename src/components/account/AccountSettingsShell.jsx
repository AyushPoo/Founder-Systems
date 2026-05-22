export default function AccountSettingsShell({
  title,
  subtitle,
  activeSection,
  onSectionChange,
  sections,
  children,
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/45">
          Workspace settings
        </p>
        <h1 className="mt-2 max-w-[14.5rem] text-[1.9rem] font-black leading-[0.95] tracking-tight-brand md:max-w-[15rem] md:text-[2.8rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-[17rem] text-[15px] font-medium leading-7 text-brand-black/62">
          {subtitle}
        </p>
        <nav className="mt-6 space-y-2">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => onSectionChange(section.key)}
              className={`w-full rounded-[18px] border px-4 py-2.5 text-left text-[13px] font-black uppercase tracking-[0.14em] transition ${
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
