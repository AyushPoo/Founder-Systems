import { useState, useRef, useEffect } from 'react'
import { useDeck } from '../../context/DeckContext'
import { useChat } from '../../hooks/useChat'
import { ChatMessage } from '../chat/ChatMessage'
import { ConfirmationCard } from '../chat/ConfirmationCard'

export function ChatPanel() {
  const { state } = useDeck()
  const { send, loading } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages.length])

  const handleSend = () => {
    send(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full bg-bg border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-sm font-semibold text-primary">PromptDeck AI</div>
        <div className="text-xs text-secondary">Chat to build your pitch deck</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {state.messages.length === 0 && (
          <div className="text-center text-secondary text-sm mt-12 px-4">
            <div className="text-4xl mb-4">🚀</div>
            <div className="font-medium text-primary mb-2">Tell me about your startup</div>
            <div>I'll ask a few questions, then build your pitch deck in real-time.</div>
          </div>
        )}
        {state.messages.map((m, i) => <ChatMessage key={i} message={m} />)}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Confirmation Card */}
      {state.confirmationCard && <ConfirmationCard card={state.confirmationCard} />}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={state.deckBuilt ? "Ask to edit a slide..." : "Tell me about your startup..."}
            className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-primary placeholder-secondary resize-none focus:outline-none focus:border-accent/60 min-h-[40px] max-h-[120px]"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-accent hover:bg-accent/90 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
