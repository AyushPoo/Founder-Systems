import AttachmentPicker from './AttachmentPicker';
import { getOutreachApprovalSections } from '../../utils/outreachIntake';

const TONES = ['direct', 'warm', 'founder-led', 'bold', 'consultative'];
const CHANNELS = ['email', 'linkedin'];

function parseCommaSeparatedList(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatFieldName(field) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
}

function ApprovalField({
  label,
  value,
  onChange,
  helper,
  error,
  placeholder,
  textarea = false,
  rows = 3,
}) {
  const Tag = textarea ? 'textarea' : 'input';

  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/48">
        {label}
      </span>
      <Tag
        value={value}
        rows={textarea ? rows : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-[18px] border bg-white px-4 py-3 text-sm font-medium leading-relaxed text-brand-black shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition focus:outline-none focus:ring-2 focus:ring-brand-black/5 ${
          error
            ? 'border-red-400/80 focus:border-red-500'
            : 'border-brand-black/12 focus:border-brand-black/28'
        }`}
      />
      {helper ? (
        <p className="mt-2 text-xs font-medium leading-relaxed text-brand-black/46">{helper}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs font-bold text-red-600">{error}</p> : null}
    </label>
  );
}

function ChipButton({ active, children, onClick, tone = 'light' }) {
  const activeClass =
    tone === 'dark'
      ? 'border-brand-black bg-brand-black text-white'
      : 'border-brand-black bg-brand-orange text-white';

  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition ${
        active ? activeClass : 'border-brand-black/12 bg-white text-brand-black/58 hover:border-brand-black/24'
      }`}
    >
      {children}
    </button>
  );
}

const OutreachApprovalForm = ({
  draft,
  missingFields,
  loading,
  error,
  isApproved,
  onChange,
  onApprove,
  onGenerate,
  onBack,
}) => {
  const sections = getOutreachApprovalSections(draft);

  function updateField(key, value) {
    onChange((current) => {
      const nextValue = typeof value === 'function' ? value(current[key]) : value;
      return {
        ...current,
        [key]: nextValue,
      };
    });
  }

  function toggleChannel(channel) {
    const channels = Array.isArray(draft.channels) ? draft.channels : [];
    updateField(
      'channels',
      channels.includes(channel)
        ? channels.filter((value) => value !== channel)
        : [...channels, channel]
    );
  }

  function fieldError(field) {
    return missingFields.has(field) ? 'Needed before generation.' : '';
  }

  return (
    <section className="rounded-[24px] border border-brand-black/10 bg-white p-5 shadow-[0_20px_44px_rgba(27,28,26,0.08)]">
      <div className="flex flex-col gap-3 border-b border-brand-black/8 pb-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/45">
            Approval draft
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight-brand text-brand-black">
            Edit the structured brief, then approve it before generation.
          </h2>
          <p className="mt-1 max-w-[720px] text-sm font-medium leading-relaxed text-brand-black/56">
            This is the handoff from conversation to campaign. Tighten anything that feels off,
            then lock the draft and generate from that version.
          </p>
        </div>

        <div
          className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] ${
            isApproved
              ? 'bg-[#eaf7ef] text-[#23613a]'
              : 'bg-brand-cream text-brand-black/58'
          }`}
        >
          {isApproved ? 'Approved and current' : 'Awaiting approval'}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[18px] bg-brand-cream px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
            Required status
          </p>
          <p className="mt-1 text-sm font-black text-brand-black">
            {missingFields.size === 0 ? 'Ready for approval' : 'Needs a few details'}
          </p>
        </div>
        <div className="rounded-[18px] bg-brand-cream px-4 py-3 md:col-span-2">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
            Still missing
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/72">
            {missingFields.size > 0
              ? Array.from(missingFields).map(formatFieldName).join(', ')
              : 'Nothing required is missing. This draft can be approved.'}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {sections.map((section) => (
          <section
            key={section.id}
            className="rounded-[20px] border border-brand-black/10 bg-brand-cream/40 px-4 py-4"
          >
            <div className="mb-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                {section.title}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {section.fields.map((field) => {
                const value =
                  field.key === 'objections'
                    ? (draft.objections || []).join(', ')
                    : draft[field.key] || '';

                return (
                  <ApprovalField
                    key={field.key}
                    label={field.label}
                    value={value}
                    onChange={(nextValue) =>
                      updateField(
                        field.key,
                        field.key === 'objections'
                          ? parseCommaSeparatedList(nextValue)
                          : nextValue
                      )
                    }
                    helper={field.helper}
                    error={fieldError(field.key)}
                    textarea={field.textarea}
                    rows={field.rows}
                    placeholder={field.placeholder}
                  />
                );
              })}
            </div>
          </section>
        ))}

        <section className="rounded-[20px] border border-brand-black/10 bg-brand-cream/40 px-4 py-4">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                Tone
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TONES.map((tone) => (
                  <ChipButton
                    key={tone}
                    active={draft.tone === tone}
                    onClick={() => updateField('tone', tone)}
                    tone="dark"
                  >
                    {tone}
                  </ChipButton>
                ))}
              </div>
              {fieldError('tone') ? (
                <p className="mt-2 text-xs font-bold text-red-600">{fieldError('tone')}</p>
              ) : (
                <p className="mt-2 text-xs font-medium leading-relaxed text-brand-black/46">
                  Pick the founder voice that should anchor every asset.
                </p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                Channels
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CHANNELS.map((channel) => (
                  <ChipButton
                    key={channel}
                    active={(draft.channels || []).includes(channel)}
                    onClick={() => toggleChannel(channel)}
                  >
                    {channel}
                  </ChipButton>
                ))}
              </div>
              {fieldError('channels') ? (
                <p className="mt-2 text-xs font-bold text-red-600">{fieldError('channels')}</p>
              ) : (
                <p className="mt-2 text-xs font-medium leading-relaxed text-brand-black/46">
                  These channels feed the generation bundle and export rows.
                </p>
              )}
            </div>
          </div>
        </section>

        <AttachmentPicker
          attachments={draft.attachments || []}
          onChange={(attachments) => updateField('attachments', attachments)}
        />
      </div>

      {error ? (
        <div className="mt-5 rounded-[18px] bg-[#fff1eb] px-4 py-3 text-sm font-bold text-[#9f3c19]">
          {error}
        </div>
      ) : null}

      {!isApproved ? (
        <div className="mt-5 rounded-[18px] border border-brand-black/10 bg-brand-cream/55 px-4 py-3 text-sm font-medium leading-relaxed text-brand-black/68">
          Any edit after approval will require re-approval before generation. That keeps the
          generated campaign tied to a clear draft.
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full border border-brand-black/12 px-4 py-2 text-sm font-black text-brand-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back to chat
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onApprove}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full border border-brand-black bg-white px-5 py-2 text-sm font-black text-brand-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isApproved ? 'Re-approve draft' : 'Approve draft'}
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading || !isApproved}
            className="inline-flex items-center justify-center rounded-full border border-brand-black bg-brand-orange px-5 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Generating...' : 'Generate campaign'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default OutreachApprovalForm;
