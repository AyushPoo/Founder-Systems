const STEPS = [
  'Reading your last answer',
  'Updating the strategy map',
  'Checking validation, SWOT, and plan gaps',
  'Deciding whether to ask or produce the spec',
];

const ThinkingStatus = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="mb-3 rounded-[18px] border border-brand-black/10 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(27,28,26,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-black/52">
          Working
        </p>
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-orange" />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {STEPS.map((step) => (
          <div key={step} className="flex items-center gap-2 text-xs font-bold text-brand-black/58">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-black/28" />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThinkingStatus;
