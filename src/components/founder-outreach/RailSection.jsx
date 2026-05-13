import { useState } from 'react';

const RailSection = ({
  eyebrow,
  title,
  summary,
  badge,
  action,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-[18px] border border-brand-black/10 bg-white px-4 py-3 shadow-[0_12px_26px_rgba(27,28,26,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-black/40">
            {eyebrow}
          </p>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="mt-1 flex items-center gap-2 text-left"
          >
            <span className="text-[13px] font-black leading-snug text-brand-black">{title}</span>
            <span className="text-[11px] font-black text-brand-black/46">{open ? '-' : '+'}</span>
          </button>
          {summary ? (
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-brand-black/48">
              {summary}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {badge ? (
            <span className="rounded-full bg-brand-cream px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-brand-black/56">
              {badge}
            </span>
          ) : null}
          {action}
        </div>
      </div>

      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  );
};

export default RailSection;
