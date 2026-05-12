import RailSection from './RailSection';

function formatFieldName(field) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
}

const OutreachCoachPanel = ({
  draft,
  feedback,
  result,
  onSave,
  isResultCurrent,
  saveState,
  savedCount,
}) => {
  const activeChannels = draft.channels?.length ? draft.channels.join(', ') : 'No channels selected yet';

  return (
    <RailSection
      eyebrow="Analysis"
      title="Current read"
      summary="A quiet monitor for the draft, likely gaps, and whether the latest output is still current."
      badge={result ? 'generated' : 'draft'}
      defaultOpen
      action={
        <button
          type="button"
          onClick={onSave}
          disabled={!result || !isResultCurrent}
          className="inline-flex items-center justify-center rounded-full border border-brand-black bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-brand-black disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
        >
          Save
        </button>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-[14px] bg-brand-cream/75 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/45">
            Channels
          </p>
          <p className="mt-1 text-[12px] font-black text-brand-black">{activeChannels}</p>
        </div>
        <div className="rounded-[14px] bg-brand-cream/75 px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/45">
            Saved
          </p>
          <p className="mt-1 text-[12px] font-black text-brand-black">{savedCount}</p>
        </div>
      </div>

      {saveState?.message ? (
        <div
          className={`mt-3 rounded-[14px] px-3 py-2.5 text-[12px] font-bold ${
            saveState.status === 'saved'
              ? 'bg-brand-orange text-white'
              : 'bg-brand-cream text-brand-black/72'
          }`}
        >
          {saveState.message}
        </div>
      ) : null}

      {result && !isResultCurrent ? (
        <div className="mt-3 rounded-[14px] bg-[#fff1eb] px-3 py-2.5 text-[12px] font-bold text-[#9f3c19]">
          The draft changed after the last generation. Regenerate before treating this campaign as current.
        </div>
      ) : null}

      <div className="mt-3 grid gap-2">
        {Object.entries(feedback).map(([field, notes]) => (
          <div key={field} className="rounded-[14px] border border-brand-black/10 bg-brand-cream/55 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              {formatFieldName(field)}
            </p>
            {notes.length > 0 ? (
              notes.map((note) => (
                <p key={note} className="mt-1 text-[12px] font-medium leading-relaxed text-brand-black/72">
                  {note}
                </p>
              ))
            ) : (
              <p className="mt-1 text-[12px] font-medium leading-relaxed text-brand-black/48">
                Specific enough to move forward.
              </p>
            )}
          </div>
        ))}
      </div>

      {result?.diagnosticNotes?.length ? (
        <div className="mt-3 rounded-[14px] border border-brand-black/10 bg-white px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/45">
            Generation notes
          </p>
          <ul className="mt-2 grid gap-2">
            {result.diagnosticNotes.slice(0, 3).map((note) => (
              <li key={note} className="text-[12px] font-medium leading-relaxed text-brand-black/72">
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </RailSection>
  );
};

export default OutreachCoachPanel;
