import { useState } from 'react';
import { copyText } from '../../utils/clipboard';

function buildObjectionsText(replies) {
  return replies
    .map((entry) => [`Objection: ${entry.objection}`, `Reply: ${entry.reply}`].join('\n'))
    .join('\n\n');
}

const ObjectionsTab = ({ result, actionGuard }) => {
  const [copiedKey, setCopiedKey] = useState('');

  if (!result) {
    return null;
  }

  const replies = result.objectionReplies || [];
  const canUse = actionGuard?.canUse !== false;

  async function handleCopy(key, value) {
    if (!canUse) {
      return;
    }

    try {
      await copyText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? '' : current));
      }, 1800);
    } catch {
      setCopiedKey('');
    }
  }

  return (
    <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
            Objection handling
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/56">
            Keep the replies short enough to sound real, then adapt to the actual conversation.
          </p>
        </div>
        {replies.length > 0 ? (
          <button
            type="button"
            disabled={!canUse}
            onClick={() => handleCopy('objections-all', buildObjectionsText(replies))}
            className="rounded-full border border-brand-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
          >
            {copiedKey === 'objections-all' ? 'Copied' : 'Copy all'}
          </button>
        ) : null}
      </div>

      {replies.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-medium text-brand-black/60">
          No objection replies were generated for this campaign.
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          {replies.map((entry, index) => (
            <article
              key={`${entry.objection}-${index}`}
              className="rounded-2xl bg-brand-cream px-4 py-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                    Objection
                  </p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-brand-black/82">
                    {entry.objection}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canUse}
                  onClick={() => handleCopy(`objection-${index}`, entry.reply)}
                  className="rounded-full border border-brand-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
                >
                  {copiedKey === `objection-${index}` ? 'Copied' : 'Copy reply'}
                </button>
              </div>
              <div className="mt-3 rounded-2xl bg-white px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  Suggested reply
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed text-brand-black/78">
                  {entry.reply}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjectionsTab;
