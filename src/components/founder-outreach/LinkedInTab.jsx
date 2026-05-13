import { useState } from 'react';
import { copyText } from '../../utils/clipboard';

function buildLinkedinSequenceText(messages) {
  return messages
    .map((message, index) => [`Step ${index + 1} (${message.step})`, '', message.body].join('\n'))
    .join('\n\n---\n\n');
}

const LinkedInTab = ({ result, actionGuard }) => {
  const [copiedKey, setCopiedKey] = useState('');

  if (!result) {
    return null;
  }

  const messages = result.linkedinMessages || [];
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
    <div className="grid gap-4">
      <div className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              LinkedIn flow
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/56">
              Use this when you want lighter, conversational touches around the email sequence.
            </p>
          </div>
          {messages.length > 0 ? (
            <button
              type="button"
              disabled={!canUse}
              onClick={() => handleCopy('linkedin-sequence', buildLinkedinSequenceText(messages))}
              className="rounded-full border border-brand-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
            >
              {copiedKey === 'linkedin-sequence' ? 'Copied' : 'Copy sequence'}
            </button>
          ) : null}
        </div>

        {messages.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-medium text-brand-black/60">
            No LinkedIn messages were generated for this campaign.
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            {messages.map((message, index) => (
              <article
                key={`${message.step}-${index}`}
                className="rounded-2xl bg-brand-cream px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-brand-black">Step {index + 1}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-brand-black/45">
                      {message.step}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canUse}
                    onClick={() => handleCopy(`linkedin-${index}`, message.body)}
                    className="rounded-full border border-brand-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
                  >
                    {copiedKey === `linkedin-${index}` ? 'Copied' : 'Copy message'}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-brand-black/78">
                  {message.body}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInTab;
