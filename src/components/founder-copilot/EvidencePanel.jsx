const EvidencePanel = ({ evidence, inference }) => {
  const hasEvidence = Array.isArray(evidence) && evidence.length > 0;
  const hasInference = Array.isArray(inference) && inference.length > 0;

  if (!hasEvidence && !hasInference) {
    return (
      <div className="rounded-[18px] border border-brand-black/10 bg-brand-cream/25 p-5">
        <p className="text-base font-black tracking-tight-brand mb-2">Evidence trail</p>
        <p className="text-sm font-bold text-brand-black/50 leading-relaxed">
          This version uses your supplied context first. External proof can be added later for a
          dedicated startup validator mode.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasEvidence ? (
        <article className="rounded-[18px] border border-brand-black/10 bg-white p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-3">
            Signals used
          </p>
          <div className="space-y-3">
            {evidence.map((item, index) => (
              <div
                key={item.id || item.name || item.title || index}
                className="rounded-[16px] border border-brand-black/10 bg-brand-cream/25 p-4"
              >
                <p className="text-sm font-black mb-1">
                  {item.companyName || item.name || item.title || `Reference ${index + 1}`}
                </p>
                <p className="text-sm font-bold text-brand-black/70 leading-relaxed">
                  {item.pattern ||
                    item.summary ||
                    item.signal ||
                    item.whyItMatters ||
                    'Reference used in reasoning.'}
                </p>
                {item.tractionSignal ? (
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-brand-black/55">
                    Traction: {item.tractionSignal}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {hasInference ? (
        <article className="rounded-[18px] border border-brand-black/10 bg-white p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-3">
            Inference boundary
          </p>
          <ul className="space-y-2">
            {inference.map((item, index) => (
              <li key={`${item}-${index}`} className="text-sm font-bold text-brand-black/70 leading-relaxed">
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
