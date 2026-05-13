const EvidencePanel = ({ evidence, inference, benchmarkMatches = [], compact = false }) => {
  const hasEvidence = Array.isArray(evidence) && evidence.length > 0;
  const hasInference = Array.isArray(inference) && inference.length > 0;
  const hasBenchmarks = Array.isArray(benchmarkMatches) && benchmarkMatches.length > 0;

  if (!hasEvidence && !hasInference && !hasBenchmarks) {
    return (
      <div className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[22px] p-7'} border border-brand-black/8 bg-white`}>
        <p className={`${compact ? 'mb-2 text-[14px]' : 'mb-3 text-[1.1rem]'} font-black tracking-tight-brand`}>Evidence trail</p>
        <p className={`max-w-[48ch] ${compact ? 'text-[13px] leading-6' : 'text-[15px] leading-7'} font-medium text-brand-black/52`}>
          Comparable references, proof signals, and inference boundaries will appear here once the
          copilot starts grounding the recommendation.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-5'}>
      {hasBenchmarks ? (
        <article className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[22px] p-6'} border border-brand-black/8 bg-white`}>
          <p className={`${compact ? 'mb-3 text-[10px] tracking-[0.12em]' : 'mb-4 text-[11px] tracking-[0.16em]'} font-black uppercase text-brand-black/48`}>
            Comparable brands
          </p>
          <div className={compact ? 'space-y-3' : 'space-y-4'}>
            {benchmarkMatches.map((item) => (
              <div
                key={item.id}
                className={`${compact ? 'rounded-[12px] p-3' : 'rounded-[18px] p-5'} border border-brand-black/8 bg-brand-cream/14`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`${compact ? 'text-[13px]' : 'text-[15px]'} font-semibold`}>{item.companyName}</p>
                  <span className="rounded-full border border-brand-black/10 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/46">
                    {item.category}
                  </span>
                </div>
                <p className={`mt-2 ${compact ? 'text-[13px] leading-6' : 'text-[15px] leading-7'} font-medium text-brand-black/72`}>
                  {item.pattern}
                </p>
                <p className={`mt-2 ${compact ? 'text-[13px] leading-6' : 'text-[15px] leading-7'} font-medium text-brand-black/54`}>
                  {item.whyItMatters}
                </p>
                {item.tractionSignal ? (
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/55">
                    Signal: {item.tractionSignal}
                  </p>
                ) : null}
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/62 underline underline-offset-4"
                  >
                    {item.sourceLabel || 'Source'}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {hasEvidence ? (
        <article className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[22px] p-6'} border border-brand-black/8 bg-white`}>
          <p className={`${compact ? 'mb-3 text-[10px] tracking-[0.12em]' : 'mb-4 text-[11px] tracking-[0.16em]'} font-black uppercase text-brand-black/48`}>
            Signals used
          </p>
          <div className={compact ? 'space-y-3' : 'space-y-4'}>
            {evidence.map((item, index) => (
              <div
                key={item.id || item.name || item.title || index}
                className={`${compact ? 'rounded-[12px] p-3' : 'rounded-[18px] p-5'} border border-brand-black/8 bg-brand-cream/14`}
              >
                <p className={`mb-2 ${compact ? 'text-[13px]' : 'text-[15px]'} font-semibold`}>
                  {item.companyName || item.name || item.title || `Reference ${index + 1}`}
                </p>
                <p className={`${compact ? 'text-[13px] leading-6' : 'text-[15px] leading-7'} font-medium text-brand-black/68`}>
                  {item.pattern ||
                    item.summary ||
                    item.signal ||
                    item.whyItMatters ||
                    'Reference used in reasoning.'}
                </p>
                {item.tractionSignal ? (
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/55">
                    Traction: {item.tractionSignal}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {hasInference ? (
        <article className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[22px] p-6'} border border-brand-black/8 bg-white`}>
          <p className={`${compact ? 'mb-3 text-[10px] tracking-[0.12em]' : 'mb-4 text-[11px] tracking-[0.16em]'} font-black uppercase text-brand-black/48`}>
            Inference boundary
          </p>
          <ul className="space-y-2">
            {inference.map((item, index) => (
              <li key={`${item}-${index}`} className={`${compact ? 'text-[13px] leading-6' : 'text-[15px] leading-7'} font-medium text-brand-black/68`}>
                {item}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </div>
  );
};

export default EvidencePanel;
