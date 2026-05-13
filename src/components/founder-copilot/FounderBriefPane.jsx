const BRIEF_SECTIONS = [
  ['problem', 'Problem'],
  ['icp', 'ICP'],
  ['mvpScope', 'MVP Scope'],
  ['excludedFeatures', 'What Not to Build'],
  ['pricingHypothesis', 'Pricing Hypothesis'],
  ['gtmPlan', 'GTM Plan'],
  ['next30Days', '30-Day Next Steps'],
];

const FounderBriefPane = ({ brief, markdown, copied, onCopy, onDownload, compact = false }) => {
  const hasBrief = brief && typeof brief === 'object';

  return (
    <section
      className={`rounded-[22px] border border-brand-black/10 bg-white ${
        compact ? 'rounded-[14px] p-3.5 md:p-4.5' : 'p-6 md:p-7 shadow-[0_18px_44px_rgba(27,28,26,0.08)]'
      }`}
    >
      <div className={`flex flex-col gap-3 border-b border-brand-black/10 ${compact ? 'pb-3.5' : 'pb-5'} md:flex-row md:items-start md:justify-between`}>
        <div>
          <p className={`${compact ? 'mb-1 text-[10px] tracking-[0.12em]' : 'mb-2 text-xs tracking-[0.2em]'} font-black uppercase text-brand-black/42`}>
            Founder brief
          </p>
          <h2 className={`${compact ? 'mb-1 text-[15px]' : 'mb-2 text-2xl'} font-black tracking-tight-brand`}>
            Current draft
          </h2>
          <p className={`${compact ? 'text-[12px] leading-6' : 'text-sm md:text-base leading-relaxed'} font-semibold text-brand-black/65`}>
            Scope, exclusions, pricing logic, GTM, and the next steps in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            disabled={!markdown}
            className={`rounded-full border border-brand-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/64 ${!markdown ? 'pointer-events-none opacity-50' : ''}`}
          >
            {copied ? 'Copied Markdown' : 'Copy Markdown'}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!markdown}
            className={`rounded-full bg-brand-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white ${!markdown ? 'pointer-events-none opacity-50' : ''}`}
          >
            Download .md
          </button>
        </div>
      </div>

      {!hasBrief ? (
        <div className={`${compact ? 'rounded-[14px] p-3.5 pt-4' : 'rounded-[18px] p-5 pt-6'} border border-brand-black/10 bg-brand-cream/20`}>
          <p className={`${compact ? 'mb-2 text-[14px]' : 'mb-3 text-base'} font-black tracking-tight-brand`}>Brief draft</p>
          <p className={`${compact ? 'text-[12px]' : 'text-sm'} font-semibold leading-relaxed text-brand-black/45`}>
            The structured brief appears once the conversation reaches a clear direction.
          </p>
        </div>
      ) : (
        <div className={`${compact ? 'space-y-3 pt-4' : 'space-y-6 pt-6'}`}>
          <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
            {BRIEF_SECTIONS.map(([key, label]) => (
              <article
                key={key}
                className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-4'} border border-brand-black/10 bg-brand-cream/20`}
              >
                <h3 className={`${compact ? 'mb-1.5 text-[13px]' : 'mb-2 text-base md:text-lg'} font-black tracking-tight-brand`}>{label}</h3>
                <p className={`${compact ? 'text-[12.5px] leading-6' : 'text-sm md:text-[15px] leading-relaxed'} font-medium text-brand-black/75 whitespace-pre-line`}>
                  {brief[key] || 'Not provided yet.'}
                </p>
              </article>
            ))}
          </div>

          {markdown ? (
            <div className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-5'} border border-brand-black/10`}>
              <p className={`${compact ? 'mb-2 text-[10px] tracking-[0.12em]' : 'mb-3 text-[11px] tracking-[0.18em]'} font-black uppercase text-brand-black/55`}>
                Markdown preview
              </p>
              <pre className={`${compact ? 'text-[11px] leading-5' : 'text-sm leading-relaxed'} whitespace-pre-wrap break-words font-mono text-brand-black/75`}>
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
