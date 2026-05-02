import ModeSelector from './ModeSelector';
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
  modes = [],
  onSelectMode,
}) => {
  const promptLabel =
    session.question?.helperText ||
    'Answer in plain language. The copilot will turn it into structure.';
  const hasActiveMode = Boolean(session.selectedMode);
  const messages = Array.isArray(session.messages) ? session.messages : [];
  const visibleMessages = hasActiveMode ? messages : messages.filter((message) => message.role !== 'assistant');
  const hasMessages = visibleMessages.length > 0;

  return (
    <section className="rounded-[28px] border-2 border-brand-black bg-brand-cream/20 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] min-h-[calc(100vh-170px)] max-h-[calc(100vh-170px)] overflow-hidden">
      <div className="border-b-2 border-brand-black bg-white px-6 py-5 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-2">
              Guided conversation
            </p>
            <h2 className="text-2xl font-black tracking-tight-brand">Founder copilot</h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-brand-black/60">
              Keep the thread messy. The structure should emerge from the exchange.
            </p>
          </div>
          {hasActiveMode ? (
            <span className="rounded-full border-2 border-brand-black bg-brand-cream/45 px-3 py-2 text-xs font-black uppercase tracking-[0.16em]">
              {session.selectedMode.replace(/_/g, ' ')}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex h-[calc(100vh-264px)] min-h-[560px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 md:px-7">
          {!hasActiveMode ? (
            <ModeSelector
              modes={modes}
              selectedMode={session.selectedMode}
              onSelect={onSelectMode}
              compact
            />
          ) : null}

          {!hasMessages && hasActiveMode ? (
            <ThreadMessage
              message={{
                role: 'assistant',
                content:
                  'Great. Start wherever the signal is strongest: market pain, your edge, a customer pattern, or a half-formed wedge.',
              }}
            />
          ) : null}

          {visibleMessages.map((message) => (
            <ThreadMessage key={message.id} message={message} />
          ))}

          {hasActiveMode && session.question ? (
            <div className="rounded-[20px] border-2 border-dashed border-brand-black bg-white/80 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-2">
                Current prompt
              </p>
              <p className="text-sm font-black leading-relaxed mb-1">{session.question.prompt}</p>
              <p className="text-xs font-bold text-brand-black/55">{promptLabel}</p>
            </div>
          ) : null}
        </div>

        <div className="border-t-2 border-brand-black bg-brand-cream/35 px-6 py-5 md:px-7">
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
            disabled={disabled}
            placeholder={
              disabled
                ? 'Pick a starting point first.'
                : 'Reply naturally. The copilot should infer the structure from your answer.'
            }
            helperText={
              hasActiveMode
                ? 'Strong founder guidance starts from real constraints, not polished input.'
                : 'The composer stays ready, but the mode only needs to be chosen once at session start.'
            }
          />
        </div>
      </div>
    </section>
  );
};

export default ConversationPane;
