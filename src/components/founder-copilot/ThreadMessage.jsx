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
      className={`max-w-[92%] px-3.5 py-3 shadow-[0_10px_22px_rgba(27,28,26,0.08)] sm:px-4 sm:py-3.5 lg:max-w-[78%] ${
        bubbleStyles[role]
      } ${role === 'user' ? 'ml-auto' : ''}`}
    >
      <p className="mb-1 text-[9px] font-black uppercase tracking-[0.15em] opacity-42 sm:mb-1.5 sm:text-[10px] sm:tracking-[0.18em]">
        {role === 'user' ? 'Founder' : role === 'challenge' ? 'Copilot note' : 'Copilot'}
      </p>
      <p className="whitespace-pre-line text-[14px] font-bold leading-relaxed sm:text-[15px]">
        {message?.content || ''}
      </p>
    </article>
  );
};

export default ThreadMessage;
