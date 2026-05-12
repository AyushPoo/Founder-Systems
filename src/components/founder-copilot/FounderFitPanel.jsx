function buildFounderFitItems({ founderFit, recommendation, brief, selectedMode }) {
  if (founderFit && typeof founderFit === 'object' && !Array.isArray(founderFit)) {
    const objectItems = [
      founderFit.fitSummary ? { label: 'Fit summary', value: founderFit.fitSummary } : null,
      founderFit.capabilityFit ? { label: 'Capability fit', value: founderFit.capabilityFit } : null,
      founderFit.accessFit ? { label: 'Access fit', value: founderFit.accessFit } : null,
      founderFit.distributionFit ? { label: 'Distribution fit', value: founderFit.distributionFit } : null,
      founderFit.capitalFit ? { label: 'Capital fit', value: founderFit.capitalFit } : null,
      founderFit.timingFit ? { label: 'Timing fit', value: founderFit.timingFit } : null,
      Array.isArray(founderFit.whyThisFitsYou) && founderFit.whyThisFitsYou.length
        ? { label: 'Why this fits you', value: founderFit.whyThisFitsYou.join(' | ') }
        : null,
      Array.isArray(founderFit.whyThisMayNotFitYou) && founderFit.whyThisMayNotFitYou.length
        ? { label: 'Why this may not fit you', value: founderFit.whyThisMayNotFitYou.join(' | ') }
        : null,
      Array.isArray(founderFit.whatYouAreMissing) && founderFit.whatYouAreMissing.length
        ? { label: 'What you are missing', value: founderFit.whatYouAreMissing.join(' | ') }
        : null,
      founderFit.bootstrapVsFunding
        ? { label: 'Bootstrap vs funding', value: founderFit.bootstrapVsFunding }
        : null,
    ].filter(Boolean);

    if (objectItems.length) return objectItems;
  }

  if (Array.isArray(founderFit) && founderFit.length > 0) {
    return founderFit;
  }

  const items = [];

  if (recommendation?.whyYou) {
    items.push({ label: 'Why this fits you', value: recommendation.whyYou });
  }

  if (brief?.icp) {
    items.push({ label: 'Buyer proximity', value: brief.icp });
  }

  if (recommendation?.distributionAdvantage || recommendation?.edge) {
    items.push({
      label: 'Advantage',
      value: recommendation.distributionAdvantage || recommendation.edge,
    });
  }

  if (selectedMode) {
    items.push({
      label: 'Session lens',
      value: String(selectedMode).replace(/_/g, ' '),
    });
  }

  return items.slice(0, 4);
}

const FounderFitPanel = ({ founderFit, recommendation, brief, selectedMode, compact = false }) => {
  const items = buildFounderFitItems({ founderFit, recommendation, brief, selectedMode });

  if (!items.length) {
    return (
      <div className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-5'} border border-brand-black/10 bg-brand-cream/25`}>
        <p className={`${compact ? 'text-[14px]' : 'text-base'} mb-2 font-black tracking-tight-brand`}>Founder fit</p>
        <p className={`${compact ? 'text-[12px]' : 'text-sm'} font-semibold leading-relaxed text-brand-black/50`}>
          Once the copilot has enough signal, this tab can explain why the direction fits the
          founder instead of only describing the market.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <article
          key={item.label || index}
          className={`${compact ? 'rounded-[14px] p-3.5' : 'rounded-[18px] p-4'} border border-brand-black/10 bg-white`}
        >
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/55">
            {item.label || `Fit signal ${index + 1}`}
          </p>
          <p className={`${compact ? 'text-[12.5px] leading-6' : 'text-sm leading-relaxed'} font-semibold text-brand-black/75`}>
            {item.value || 'Founder fit signal not available yet.'}
          </p>
        </article>
      ))}
    </div>
  );
};

export default FounderFitPanel;
