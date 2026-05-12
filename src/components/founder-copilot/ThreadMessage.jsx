const bubbleStyles = {
  assistant: 'bg-white text-brand-black rounded-[16px] border border-brand-black/7',
  user: 'bg-brand-black text-white rounded-[16px]',
  challenge: 'bg-amber-50 text-brand-black rounded-[16px] border border-amber-200',
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
      className={`max-w-[88%] px-3.5 py-3 shadow-[0_6px_14px_rgba(27,28,26,0.03)] sm:px-4 sm:py-3.5 lg:max-w-[72%] ${
        bubbleStyles[role]
      } ${role === 'user' ? 'ml-auto' : ''}`}
    >
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] opacity-36">
        {role === 'user' ? 'You' : role === 'challenge' ? 'Note' : 'Copilot'}
      </p>
      <p className="whitespace-pre-line text-[14px] font-medium leading-6">
        {message?.content || ''}
      </p>
    </article>
  );
};

export default ThreadMessage;
