import { useState } from 'react';
import { copyText } from '../../utils/clipboard';

function buildEmailSequenceText(result) {
  return (result.emails || [])
    .map((email) =>
      [
        `${email.title} (Day ${email.delayDays})`,
        `Subject: ${email.subject}`,
        '',
        email.body,
      ].join('\n')
    )
    .join('\n\n---\n\n');
}

const EmailsTab = ({ result, actionGuard }) => {
  const [copiedKey, setCopiedKey] = useState('');

  if (!result) {
    return null;
  }

  const emails = result.emails || [];
  const subjectLines = result.subjectLines || [];
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
              Subject lines
            </p>
            <p className="mt-1 text-sm font-medium leading-relaxed text-brand-black/56">
              Quick options to test before you send the first touch.
            </p>
          </div>
          <button
            type="button"
            disabled={!canUse}
            onClick={() => handleCopy('email-sequence', buildEmailSequenceText(result))}
            className="rounded-full border border-brand-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
          >
            {copiedKey === 'email-sequence' ? 'Copied' : 'Copy sequence'}
          </button>
        </div>

        {subjectLines.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {subjectLines.map((subject, index) => (
              <button
                key={`${subject}-${index}`}
                type="button"
                disabled={!canUse}
                onClick={() => handleCopy(`subject-${index}`, subject)}
                className="rounded-2xl bg-brand-cream px-4 py-3 text-left text-sm font-bold leading-relaxed text-brand-black transition hover:bg-[#f7efe6] disabled:cursor-not-allowed disabled:text-brand-black/45"
              >
                <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  Subject {index + 1}
                </span>
                <span className="mt-1 block">{subject}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl bg-brand-cream px-4 py-3 text-sm font-medium text-brand-black/60">
            No subject lines are available in this result.
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {emails.length === 0 ? (
          <div className="rounded-[20px] bg-brand-cream px-4 py-4 text-sm font-medium text-brand-black/60">
            No email sequence is available in this result.
          </div>
        ) : null}
        {emails.map((email) => {
          const fullEmail = [`Subject: ${email.subject}`, '', email.body].join('\n');

          return (
            <article
              key={`${email.step}-${email.subject}`}
              className="rounded-[20px] border border-brand-black/10 bg-white px-4 py-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-brand-black">{email.title}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-brand-black/45">
                    Day {email.delayDays} | Email {email.step}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canUse}
                    onClick={() => handleCopy(`email-body-${email.step}`, email.body)}
                    className="rounded-full border border-brand-black/12 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/65 disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
                  >
                    {copiedKey === `email-body-${email.step}` ? 'Copied' : 'Copy body'}
                  </button>
                  <button
                    type="button"
                    disabled={!canUse}
                    onClick={() => handleCopy(`email-full-${email.step}`, fullEmail)}
                    className="rounded-full border border-brand-black bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black disabled:cursor-not-allowed disabled:border-brand-black/10 disabled:text-brand-black/35"
                  >
                    {copiedKey === `email-full-${email.step}` ? 'Copied' : 'Copy full'}
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-brand-cream px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
                  Subject
                </p>
                <p className="mt-1 text-sm font-bold leading-relaxed text-brand-black/82">
                  {email.subject}
                </p>
              </div>

              <div className="mt-3 rounded-2xl bg-brand-cream px-4 py-4">
                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-brand-black/78">
                  {email.body}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default EmailsTab;
