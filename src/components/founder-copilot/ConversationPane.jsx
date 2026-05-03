import ThreadMessage from './ThreadMessage';
import Composer from './Composer';

const ConversationPane = ({
  session,
  inputValue,
  onInputChange,
  onSubmit,
  loading,
  error,
  disabled,
  attachments = [],
  onPickFiles,
  onRemoveAttachment,
}) => {
  const messages = Array.isArray(session.messages) ? session.messages : [];
  const hasMessages = messages.length > 0;
  const selectedModeLabel = String(session?.selectedMode || 'conversation').replace(/_/g, ' ');

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent xl:rounded-[28px] xl:border xl:border-brand-black/12 xl:bg-white xl:shadow-[0_24px_60px_rgba(27,28,26,0.08)]">
      <div className="hidden border-b border-brand-black/10 bg-white/80 px-4 py-3 backdrop-blur xl:block xl:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/40">
              Conversation
            </p>
            <p className="mt-1 text-sm font-bold text-brand-black/62">
              Keep it loose. The copilot will structure the signal.
            </p>
          </div>
          <span className="rounded-full border border-brand-black/12 bg-brand-cream/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-brand-black/58">
            {selectedModeLabel}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-5 xl:px-6">
          {!hasMessages ? (
            <ThreadMessage
              message={{
                role: 'assistant',
                content:
                  'Start wherever the signal is strongest. A rough instinct, a customer pain, an advantage, or a half-formed wedge is enough.',
              }}
            />
          ) : null}

          {messages.map((message) => (
            <ThreadMessage key={message.id} message={message} />
          ))}

          {session.question ? (
            <div className="rounded-[22px] border border-brand-black/12 bg-brand-cream/45 px-4 py-3.5 shadow-[0_12px_28px_rgba(27,28,26,0.05)]">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-brand-black/42">
                Current prompt
              </p>
              <p className="mb-1 text-sm font-black leading-relaxed">{session.question.prompt}</p>
              {session.question.helperText ? (
                <p className="text-xs font-bold text-brand-black/52">{session.question.helperText}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="border-t border-brand-black/10 bg-brand-cream/35 px-4 py-4 md:px-5 xl:px-6">
          {error ? (
            <div className="mb-3 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {session?.runtime?.fallbackUsed && session?.runtime?.fallbackReason ? (
            <div className="mb-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-brand-black/75">
              {session.runtime.fallbackReason}
            </div>
          ) : null}

          <Composer
            value={inputValue}
            onChange={onInputChange}
            onSubmit={onSubmit}
            loading={loading}
            disabled={loading}
            placeholder="Reply naturally. The copilot will do the structuring."
            helperText="Use plain language."
            attachments={attachments}
            onPickFiles={onPickFiles}
            onRemoveAttachment={onRemoveAttachment}
          />
        </div>
      </div>
    </section>
  );
};

export default ConversationPane;
