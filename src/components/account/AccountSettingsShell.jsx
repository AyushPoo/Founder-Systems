export default function AccountSettingsShell({
  title,
  subtitle,
  activeSection,
  onSectionChange,
  sections,
  children,
}) {
  return (
    <section className="grid gap-8 xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-28 xl:self-start">
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-brand-black/45">
          // Workspace Settings
        </p>
        <h1 className="mt-2 max-w-[14.5rem] text-[1.8rem] font-black leading-[1.0] tracking-tight-brand md:max-w-[15rem] md:text-[2.6rem]">
          {title}
        </h1>
        <p className="mt-3.5 max-w-[17rem] text-[13px] font-medium leading-relaxed text-brand-black/60">
          {subtitle}
        </p>
        <nav className="mt-8 space-y-1 border-l-2 border-brand-black/5">
          {sections.map((section) => {
            const isActive = activeSection === section.key;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => onSectionChange(section.key)}
                className={`w-full py-2.5 pr-4 pl-4 text-left text-[12px] font-black uppercase tracking-[0.15em] transition-all -ml-[2px] ${
                  isActive
                    ? 'border-l-2 border-brand-orange bg-brand-black/[0.04] text-brand-black font-black'
                    : 'border-l-2 border-transparent bg-transparent text-brand-black/55 hover:text-brand-black hover:bg-brand-black/[0.02]'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
