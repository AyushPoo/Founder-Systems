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

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border-2 border-brand-black bg-brand-cream/20 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)]">
      <div className="border-b-2 border-brand-black bg-white px-5 py-4 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[1.85rem] font-black tracking-tight-brand">Founder copilot</h2>
          <span className="rounded-full border-2 border-brand-black bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em]">
            {session.selectedMode.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6">
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
            <div className="rounded-[20px] border-2 border-dashed border-brand-black bg-white/80 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-2">
                Current prompt
              </p>
              <p className="text-sm font-black leading-relaxed mb-1">{session.question.prompt}</p>
              {session.question.helperText ? (
                <p className="text-xs font-bold text-brand-black/55">{session.question.helperText}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="border-t-2 border-brand-black bg-brand-cream/35 px-5 py-4 md:px-6">
          {error ? (
            <div className="mb-4 rounded-[18px] border-2 border-red-600 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
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
