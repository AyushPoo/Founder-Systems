import { useState, useRef, useEffect } from 'react'
import { useDeck } from '../../context/DeckContext'
import { useChat } from '../../hooks/useChat'
import { ChatMessage } from '../chat/ChatMessage'
import { ConfirmationCard } from '../chat/ConfirmationCard'
import { uploadReference } from '../../api/client'

export function ChatPanel() {
  const { state, dispatch } = useDeck()
  const { send, loading } = useChat()
  const [input, setInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages.length])

  const handleSend = () => {
    send(input, state.references)
    setInput('')
    dispatch({ type: 'CLEAR_REFERENCES' })
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ref = await uploadReference(file)
      dispatch({ type: 'ADD_REFERENCE', payload: ref })
    } catch (err: any) {
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'ai', content: `Upload failed: ${err.message}`, timestamp: Date.now() } })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="text-sm font-semibold text-primary">PromptDeck AI</div>
        <div className="text-xs text-secondary">Chat to build your pitch deck</div>
      </div>

      {/* Messages — min-h-0 required for flex overflow to work */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-1">
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

      {/* Attached references */}
      {state.references.length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-1.5 shrink-0">
          {state.references.map(ref => (
            <div key={ref.ref_id} className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-primary max-w-[180px]">
              <span className="text-accent">📎</span>
              <span className="truncate">{ref.filename}</span>
              <button
                onClick={() => dispatch({ type: 'REMOVE_REFERENCE', payload: ref.ref_id })}
                className="text-secondary hover:text-primary ml-1 shrink-0"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-border">
        <div className="flex gap-2 items-end">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv"
            className="hidden"
            onChange={handleFile}
          />
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploading}
            title="Attach reference (PDF, image, text)"
            className="shrink-0 text-secondary hover:text-accent disabled:opacity-40 transition-colors p-1.5 rounded-lg hover:bg-surface"
          >
            {uploading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>
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
            disabled={(!input.trim() && state.references.length === 0) || loading}
            className="bg-accent hover:bg-accent/90 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
