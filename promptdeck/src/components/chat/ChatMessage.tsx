import type { Message } from '../../types'

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-accent text-white rounded-br-sm'
          : 'bg-surface border border-border text-primary rounded-bl-sm'
      }`}>
        {message.content}
      </div>
    </div>
  )
}
