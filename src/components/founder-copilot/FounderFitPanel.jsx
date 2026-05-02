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

const FounderFitPanel = ({ founderFit, recommendation, brief, selectedMode }) => {
  const items = buildFounderFitItems({ founderFit, recommendation, brief, selectedMode });

  if (!items.length) {
    return (
      <div className="rounded-[22px] border-2 border-dashed border-brand-black bg-brand-cream/25 p-5">
        <p className="text-base font-black tracking-tight-brand mb-2">Founder fit</p>
        <p className="text-sm font-bold text-brand-black/50 leading-relaxed">
          Once the copilot has enough signal, this tab can explain why the direction fits the
          founder instead of only describing the market.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <article
          key={item.label || index}
          className="rounded-[22px] border-2 border-brand-black bg-white p-4"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-2">
            {item.label || `Fit signal ${index + 1}`}
          </p>
          <p className="text-sm font-bold text-brand-black/75 leading-relaxed">
            {item.value || 'Founder fit signal not available yet.'}
          </p>
        </article>
      ))}
    </div>
  );
};

export default FounderFitPanel;
