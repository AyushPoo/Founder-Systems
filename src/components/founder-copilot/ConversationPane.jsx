const bubbleStyles = {
  assistant: 'bg-brand-cream/55 text-brand-black',
  user: 'bg-brand-black text-white',
};

const ConversationPane = ({
  session,
  inputValue,
  onInputChange,
  onSubmit,
  loading,
  error,
  disabled,
}) => {
  const promptLabel =
    session.question?.helperText ||
    'Answer in plain language. The copilot will turn it into structure.';

  return (
    <section className="rounded-[28px] border-2 border-brand-black bg-white p-6 md:p-7 shadow-[8px_8px_0px_0px_rgba(27,28,26,1)] min-h-[640px] flex flex-col">
      <div className="flex items-start justify-between gap-4 pb-5 border-b-2 border-brand-black">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange mb-2">
            Guided conversation
          </p>
          <h2 className="text-2xl font-black tracking-tight-brand">Founder copilot</h2>
        </div>
        {session.selectedMode ? (
          <span className="rounded-full border-2 border-brand-black px-3 py-2 text-xs font-black uppercase tracking-[0.16em] bg-brand-cream/45">
            {session.selectedMode.replace(/_/g, ' ')}
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col pt-5">
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {(session.messages || []).map((message) => (
            <article
              key={message.id}
              className={`max-w-[92%] rounded-[22px] border-2 border-brand-black px-4 py-4 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] ${
                bubbleStyles[message.role] || bubbleStyles.assistant
              } ${message.role === 'user' ? 'ml-auto' : ''}`}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-2 opacity-65">
                {message.role === 'user' ? 'Founder' : 'Copilot'}
              </p>
              <p className="text-sm md:text-[15px] font-bold leading-relaxed whitespace-pre-line">
                {message.content}
              </p>
            </article>
          ))}
        </div>

        <div className="pt-5 mt-5 border-t-2 border-brand-black">
          {session.question ? (
            <div className="rounded-[20px] border-2 border-brand-black border-dashed bg-brand-cream/35 px-4 py-3 mb-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/55 mb-2">
                Current prompt
              </p>
              <p className="text-sm font-black leading-relaxed mb-1">{session.question.prompt}</p>
              <p className="text-xs font-bold text-brand-black/55">{promptLabel}</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[18px] border-2 border-red-600 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 mb-4">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-3">
            <textarea
              rows={4}
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              disabled={disabled}
              placeholder={
                disabled
                  ? 'Pick a starting point first.'
                  : 'Reply naturally. The copilot should infer the structure from your answer.'
              }
              className="w-full rounded-[22px] border-2 border-brand-black bg-brand-cream/35 p-4 font-medium leading-relaxed focus:outline-none focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className="text-xs md:text-sm font-bold text-brand-black/55 leading-relaxed">
                Keep it messy. Good founder guidance starts from real constraints, not polished input.
              </p>
              <button
                type="submit"
                disabled={disabled || loading}
                className={`btn-cta !px-6 !py-3 ${disabled || loading ? 'pointer-events-none opacity-60' : ''}`}
              >
                {loading ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ConversationPane;
