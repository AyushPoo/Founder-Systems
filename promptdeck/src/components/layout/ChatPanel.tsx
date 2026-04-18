import { useState, useRef, useEffect } from 'react'
import { useDeck } from '../../context/DeckContext'
import { useChat } from '../../hooks/useChat'
import { ChatMessage } from '../chat/ChatMessage'
import { ConfirmationCard } from '../chat/ConfirmationCard'
import { uploadReference } from '../../api/client'

const STARTER_PROMPTS = [
  "We're building a B2B SaaS for...",
  "Fintech startup solving...",
  "Marketplace connecting...",
  "AI tool that helps...",
]

export function ChatPanel() {
  const { state, dispatch } = useDeck()
  const { send, analyzeReference, buildDirect, loading } = useChat()
  const [input, setInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages.length, loading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  const handleSend = () => {
    if (!input.trim() && state.references.length === 0) return
    send(input, state.references)
    setInput('')
    dispatch({ type: 'CLEAR_REFERENCES' })
  }

  const handleBuildDirect = () => {
    if (!input.trim()) return
    buildDirect(input)
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
      // Show file as user message, then auto-analyze
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', content: `📎 ${ref.filename}`, timestamp: Date.now() } })
      await analyzeReference(ref)
    } catch (err: any) {
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'ai', content: `Upload failed: ${err.message}`, timestamp: Date.now() } })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const isEmpty = state.messages.length === 0
  const canBuildDirect = !state.deckBuilt && input.trim().length > 40

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="text-sm font-semibold text-primary">PromptDeck AI</div>
        <div className="text-xs text-secondary">Chat to build your pitch deck</div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col h-full">
            {/* Icon + tagline */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 pb-2">
              <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#A78BFA' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-sm font-bold text-primary mb-1 text-center">Build your pitch deck</div>
              <div className="text-xs text-secondary text-center leading-relaxed">
                Chat to answer a few questions, or paste your full description to build instantly.
              </div>
            </div>
            {/* Starter chips */}
            <div className="px-3 pb-3 space-y-1.5">
              <div className="text-xs font-medium mb-2" style={{ color: 'rgba(148,163,184,0.45)' }}>Try a prompt</div>
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { setInput(p); textareaRef.current?.focus() }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(148,163,184,0.75)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {state.messages.map((m, i) => <ChatMessage key={i} message={m} />)}
            {(loading || uploading) && (
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
        )}
      </div>

      {/* Confirmation card */}
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.pptx"
          className="hidden"
          onChange={handleFile}
        />

        <div className="flex gap-2 items-end mb-2">
          {/* Attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploading}
            title="Attach a document, image, or brand guide"
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

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder={state.deckBuilt ? 'Ask to edit a slide...' : 'Tell me about your startup...'}
            className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-primary placeholder-secondary resize-none focus:outline-none focus:border-accent/60 min-h-[40px] max-h-[120px]"
            rows={1}
            disabled={loading || uploading}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && state.references.length === 0) || loading || uploading}
            className="bg-accent hover:bg-accent/90 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0"
          >
            →
          </button>
        </div>

        {/* Build directly — appears when user has typed enough */}
        {canBuildDirect && !loading && (
          <button
            onClick={handleBuildDirect}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#C4B5FD',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
            </svg>
            Build deck now — skip Q&amp;A
          </button>
        )}
      </div>
    </div>
  )
}
