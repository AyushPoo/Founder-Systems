import { useRef, useState, useEffect } from 'react'
import { useDeck } from './context/DeckContext'
import { DeckProvider } from './context/DeckContext'
import { ChatPanel } from './components/layout/ChatPanel'
import { CanvasPanel } from './components/layout/CanvasPanel'
import { NavigatorPanel } from './components/layout/NavigatorPanel'
import { PaymentGate } from './components/payment/PaymentGate'
import { WorkspaceMemoryBar } from './components/workspace/WorkspaceMemoryBar'
import './index.css'

function AppInner() {
  const { state } = useDeck()
  const [chatWidth, setChatWidth] = useState(300)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [navWidth, setNavWidth] = useState(196)

  // Auto-collapse chat when deck is built to give more canvas space
  useEffect(() => {
    if (state.deckBuilt) {
      setChatCollapsed(true)
    }
  }, [state.deckBuilt])
  const dragging = useRef<null | 'chat' | 'nav'>(null)
  const startX = useRef(0)
  const startW = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - startX.current
      if (dragging.current === 'chat') {
        setChatWidth(Math.max(220, Math.min(480, startW.current + dx)))
      } else {
        setNavWidth(Math.max(140, Math.min(320, startW.current - dx)))
      }
    }
    const onUp = () => {
      dragging.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const startDrag = (which: 'chat' | 'nav', e: React.MouseEvent, currentW: number) => {
    dragging.current = which
    startX.current = e.clientX
    startW.current = currentW
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-bg text-primary overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="font-semibold text-primary">PromptDeck AI</span>
          <span className="text-xs text-secondary bg-bg border border-border rounded-full px-2 py-0.5">Beta</span>
        </div>
        <PaymentGate />
      </div>
      <WorkspaceMemoryBar />

      {/* Main panels */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat panel — resizable + collapsible */}
        {chatCollapsed ? (
          <div className="shrink-0 flex flex-col items-center py-3 gap-3 overflow-hidden border-r border-border" style={{ width: 44 }}>
            <button
              onClick={() => setChatCollapsed(false)}
              title="Expand chat"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-accent transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </button>
          </div>
        ) : (
          <div style={{ width: chatWidth, minWidth: 220, maxWidth: 480 }} className="shrink-0 flex flex-col overflow-hidden relative">
            <div className="absolute top-2.5 right-2.5 z-10">
              <button
                onClick={() => setChatCollapsed(true)}
                title="Hide chat"
                className="w-6 h-6 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-surface border border-border transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
                </svg>
              </button>
            </div>
            <ChatPanel />
          </div>
        )}

        {/* Chat ↔ Canvas divider */}
        <div
          className="group w-1 shrink-0 cursor-col-resize relative flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          onMouseDown={e => startDrag('chat', e, chatWidth)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-accent/20 transition-colors duration-150 rounded" />
          <div className="w-0.5 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#7C3AED' }} />
        </div>

        {/* Canvas — takes remaining space */}
        <CanvasPanel />

        {/* Canvas ↔ Nav divider */}
        <div
          className="group w-1 shrink-0 cursor-col-resize relative flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          onMouseDown={e => startDrag('nav', e, navWidth)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-accent/20 transition-colors duration-150 rounded" />
          <div className="w-0.5 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#7C3AED' }} />
        </div>

        {/* Navigator panel — resizable */}
        <div style={{ width: navWidth, minWidth: 140, maxWidth: 320 }} className="shrink-0 overflow-hidden flex flex-col">
          <NavigatorPanel />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <DeckProvider>
      <AppInner />
    </DeckProvider>
  )
}
