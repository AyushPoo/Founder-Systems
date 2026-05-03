const bubbleStyles = {
  assistant: 'bg-white text-brand-black rounded-3xl rounded-bl-xl border border-brand-black/10',
  user: 'bg-brand-black text-white rounded-3xl rounded-br-xl',
  challenge: 'bg-amber-50 text-brand-black rounded-3xl rounded-bl-xl border border-amber-200',
};

const ThreadMessage = ({ message }) => {
  const role =
    message?.role === 'user'
      ? 'user'
      : message?.role === 'challenge'
        ? 'challenge'
        : 'assistant';

  return (
    <article
      className={`max-w-[88%] px-4 py-3.5 shadow-[0_14px_32px_rgba(27,28,26,0.08)] md:max-w-[78%] ${
        bubbleStyles[role]
      } ${role === 'user' ? 'ml-auto' : ''}`}
    >
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] opacity-45">
        {role === 'user' ? 'Founder' : role === 'challenge' ? 'Copilot note' : 'Copilot'}
      </p>
      <p className="whitespace-pre-line text-[15px] font-bold leading-relaxed md:text-[15px]">
        {message?.content || ''}
      </p>
    </article>
  );
};

export default ThreadMessage;
