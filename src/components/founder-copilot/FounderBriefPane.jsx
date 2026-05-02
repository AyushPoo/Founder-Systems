const BRIEF_SECTIONS = [
  ['problem', 'Problem'],
  ['icp', 'ICP'],
  ['mvpScope', 'MVP Scope'],
  ['excludedFeatures', 'What Not to Build'],
  ['pricingHypothesis', 'Pricing Hypothesis'],
  ['gtmPlan', 'GTM Plan'],
  ['next30Days', '30-Day Next Steps'],
];

const FounderBriefPane = ({ brief, markdown, copied, onCopy, onDownload }) => {
  const hasBrief = brief && typeof brief === 'object';

  return (
    <section className="rounded-[28px] border-2 border-brand-black bg-white p-6 md:p-7 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b-2 border-brand-black">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-2">
            Founder brief
          </p>
          <h2 className="text-2xl font-black tracking-tight-brand mb-2">
            The output should be usable, not decorative
          </h2>
          <p className="text-sm md:text-base font-bold leading-relaxed text-brand-black/65">
            This is the sharpest current draft: scope, exclusions, pricing logic, GTM, and first
            next steps.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCopy}
            disabled={!markdown}
            className={`btn-outline !px-4 !py-3 !text-sm ${!markdown ? 'pointer-events-none opacity-50' : ''}`}
          >
            {copied ? 'Copied Markdown' : 'Copy Markdown'}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!markdown}
            className={`btn-cta !px-4 !py-3 !text-sm ${!markdown ? 'pointer-events-none opacity-50' : ''}`}
          >
            Download .md
          </button>
        </div>
      </div>

      {!hasBrief ? (
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {BRIEF_SECTIONS.map(([, label]) => (
            <div
              key={label}
              className="rounded-[22px] border-2 border-brand-black border-dashed bg-brand-cream/20 p-5 min-h-[136px]"
            >
              <p className="text-base font-black tracking-tight-brand mb-3">{label}</p>
              <p className="text-sm font-bold text-brand-black/45 leading-relaxed">
                The brief will land here once the conversation converges on a direction.
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BRIEF_SECTIONS.map(([key, label]) => (
              <article
                key={key}
                className="rounded-[22px] border-2 border-brand-black bg-brand-cream/30 p-5 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)]"
              >
                <h3 className="text-lg font-black tracking-tight-brand mb-3">{label}</h3>
                <p className="text-sm md:text-[15px] font-medium leading-relaxed text-brand-black/75 whitespace-pre-line">
                  {brief[key] || 'Not provided yet.'}
                </p>
              </article>
            ))}
          </div>

          {markdown ? (
            <div className="rounded-[22px] border-2 border-brand-black border-dashed p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-3">
                Markdown preview
              </p>
              <pre className="whitespace-pre-wrap break-words text-sm text-brand-black/75 font-mono leading-relaxed">
                {markdown}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default FounderBriefPane;
