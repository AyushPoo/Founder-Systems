const bubbleStyles = {
  assistant: 'bg-white text-brand-black',
  user: 'bg-brand-black text-white',
  challenge: 'bg-amber-50 text-brand-black',
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
      className={`max-w-[92%] rounded-[22px] border-2 border-brand-black px-4 py-4 shadow-[4px_4px_0px_0px_rgba(27,28,26,1)] ${
        bubbleStyles[role]
      } ${role === 'user' ? 'ml-auto' : ''}`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-2 opacity-60">
        {role === 'user' ? 'Founder' : role === 'challenge' ? 'Challenge' : 'Copilot'}
      </p>
      <p className="text-sm md:text-[15px] font-bold leading-relaxed whitespace-pre-line">
        {message?.content || ''}
      </p>
    </article>
  );
};

export default ThreadMessage;
