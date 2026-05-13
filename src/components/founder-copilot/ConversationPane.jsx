import ThreadMessage from './ThreadMessage';
import Composer from './Composer';
import ThinkingStatus from './ThinkingStatus';

const ConversationPane = ({
  session,
  inputValue,
  onInputChange,
  onSubmit,
  loading,
  error,
  canGenerateSpec,
  onGenerateSpec,
  attachments = [],
  onPickFiles,
  onRemoveAttachment,
}) => {
  const messages = Array.isArray(session.messages) ? session.messages : [];
  const hasMessages = messages.length > 0;
  const selectedModeLabel = String(session?.selectedMode || 'conversation').replace(/_/g, ' ');
  const showRecoveryNote = Boolean(session?.runtime?.fallbackUsed && error);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent xl:rounded-[20px] xl:border xl:border-brand-black/7 xl:bg-white xl:shadow-[0_10px_28px_rgba(27,28,26,0.035)]">
      <div className="hidden border-b border-brand-black/6 bg-white px-5 py-3 xl:block xl:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/34">
              Conversation
            </p>
            <p className="mt-1 text-[13px] font-medium text-brand-black/52">
              Answer naturally. The copilot will structure the signal.
            </p>
          </div>
          <span className="rounded-full border border-brand-black/8 bg-brand-cream/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-brand-black/48">
            {selectedModeLabel}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-0 py-0 sm:px-4 sm:py-4 md:px-5 xl:px-6 xl:py-5">
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
        </div>

        <div className="border-t border-brand-black/6 bg-brand-cream/10 px-0 py-3 sm:px-4 sm:py-4 md:px-5 xl:px-6">
          {error ? (
            <div className="mb-3 rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {showRecoveryNote ? (
            <div className="mb-3 rounded-[14px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-semibold text-brand-black/75">
              The deeper analysis returned an incomplete response. I kept your answers and you can continue or ask for the spec now.
            </div>
          ) : null}

          <ThinkingStatus loading={loading} />

          {canGenerateSpec ? (
            <div className="mb-3 flex flex-col gap-2 rounded-[14px] border border-brand-black/7 bg-white px-3.5 py-3 shadow-[0_6px_16px_rgba(27,28,26,0.03)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-semibold text-brand-black">Enough signal for a provisional spec.</p>
                <p className="mt-1 text-[12px] font-medium text-brand-black/44">
                  Keep refining, or generate the current verdict and plan now.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGenerateSpec?.()}
                disabled={loading}
                className="rounded-full bg-brand-black px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-white disabled:opacity-60"
              >
                Generate spec
              </button>
            </div>
          ) : null}

          <Composer
            value={inputValue}
            onChange={onInputChange}
            onSubmit={onSubmit}
            loading={loading}
            disabled={loading}
            placeholder="Answer in plain language. One or two sentences is enough."
            helperText="Context beats polish."
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
