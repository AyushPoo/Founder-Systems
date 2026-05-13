import RailSection from './RailSection';

const STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft' },
  { id: 'sending', label: 'Sending' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'completed', label: 'Completed' },
];

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
        {label}
      </span>
      <input
        type={type}
        value={value}
        min={type === 'number' ? '0' : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[16px] border border-brand-black/12 bg-white px-3 py-2.5 text-[13px] font-medium leading-relaxed text-brand-black focus:border-brand-black/24 focus:outline-none focus:ring-2 focus:ring-brand-black/5"
      />
    </label>
  );
}

const ResultsTrackerPanel = ({ campaign, onChange }) => {
  if (!campaign) {
    return (
      <RailSection
        eyebrow="Results tracker"
        title="Outcomes"
        summary="Save a campaign first, then track sent count, replies, calls booked, and what actually worked."
        defaultOpen={false}
      />
    );
  }

  const results = campaign.results || {};

  function updateField(key, value) {
    onChange({
      ...results,
      [key]: value,
    });
  }

  return (
    <RailSection
      eyebrow="Results tracker"
      title="Outcomes"
      summary="Track what happened after the campaign went out."
      badge={campaign.name}
      defaultOpen={false}
    >

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.id}
            type="button"
            onClick={() => updateField('status', status.id)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${
              results.status === status.id
                ? 'border-brand-black bg-brand-black text-white'
                : 'border-brand-black/12 bg-white text-brand-black/58'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field
          label="Sent"
          type="number"
          value={results.sentCount ?? 0}
          onChange={(value) => updateField('sentCount', value)}
        />
        <Field
          label="Replies"
          type="number"
          value={results.replyCount ?? 0}
          onChange={(value) => updateField('replyCount', value)}
        />
        <Field
          label="Positive replies"
          type="number"
          value={results.positiveReplyCount ?? 0}
          onChange={(value) => updateField('positiveReplyCount', value)}
        />
        <Field
          label="Calls booked"
          type="number"
          value={results.callsBooked ?? 0}
          onChange={(value) => updateField('callsBooked', value)}
        />
      </div>

      <div className="mt-3 grid gap-3">
        <Field
          label="Best asset"
          value={results.winningAsset || ''}
          onChange={(value) => updateField('winningAsset', value)}
          placeholder="Email 2, warm CTA, LinkedIn follow-up"
        />
        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
            Notes
          </span>
          <textarea
            value={results.notes || ''}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={3}
            placeholder="What surprised you? Which objections came up?"
            className="w-full rounded-[16px] border border-brand-black/12 bg-white px-3 py-2.5 text-[13px] font-medium leading-relaxed text-brand-black focus:border-brand-black/24 focus:outline-none focus:ring-2 focus:ring-brand-black/5"
          />
        </label>
      </div>
    </RailSection>
  );
};

export default ResultsTrackerPanel;
