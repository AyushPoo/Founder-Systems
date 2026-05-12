function SnapshotRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-brand-cream px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/72">
        {value || 'Not available in this result.'}
      </p>
    </div>
  );
}

const StrategyTab = ({ result }) => {
  if (!result) {
    return null;
  }

  const fixBeforeSending = result.fixBeforeSending?.filter(Boolean) || [];
  const angles = result.positioningAngles || [];
  const icpSnapshot = result.icpSnapshot || {};

  return (
    <div className="grid gap-4">
      <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              Fix before sending
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/56">
              Review these first so the campaign ships with the right proof and framing.
            </p>
          </div>
          <p className="rounded-full bg-brand-cream px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/60">
            {fixBeforeSending.length}
          </p>
        </div>

        {fixBeforeSending.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {fixBeforeSending.map((note) => (
              <li
                key={note}
                className="rounded-2xl bg-[#fff1eb] px-4 py-3 text-sm font-bold leading-relaxed text-[#9f3c19]"
              >
                {note}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-medium text-brand-black/60">
            No explicit fixes were flagged in this output.
          </div>
        )}
      </div>

      <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
          ICP snapshot
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SnapshotRow label="Customer" value={icpSnapshot.customer} />
          <SnapshotRow label="Reply owner" value={icpSnapshot.buyerRole} />
          <SnapshotRow label="Pain intensity" value={icpSnapshot.painIntensity} />
          <SnapshotRow label="Buying trigger" value={icpSnapshot.buyingTrigger} />
        </div>
        <div className="mt-3 rounded-2xl bg-brand-cream px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
            Why they respond
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/72">
            {icpSnapshot.whyTheyRespond || 'Not available in this result.'}
          </p>
        </div>
      </div>

      <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              Positioning angles
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/56">
              Pick the framing that best fits the trigger, proof, and founder voice.
            </p>
          </div>
          <p className="rounded-full bg-brand-cream px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/60">
            {angles.length}
          </p>
        </div>

        <div className="mt-3 grid gap-3">
          {angles.map((angle, index) => (
            <article
              key={`${angle.name}-${index}`}
              className="rounded-2xl bg-brand-cream px-4 py-4"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-brand-black">{angle.name}</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/60">
                    {angle.target || 'General audience framing'}
                  </p>
                </div>
                {angle.openingStyle ? (
                  <p className="rounded-full bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/58">
                    {angle.openingStyle}
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-sm font-bold leading-relaxed text-brand-black/82">
                {angle.angle}
              </p>
              {angle.whyItWorks ? (
                <p className="mt-2 text-sm font-medium leading-relaxed text-brand-black/64">
                  {angle.whyItWorks}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StrategyTab;
