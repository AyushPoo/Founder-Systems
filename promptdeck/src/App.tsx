import { useRef, useState, useEffect } from 'react'
import { DeckProvider } from './context/DeckContext'
import { ChatPanel } from './components/layout/ChatPanel'
import { CanvasPanel } from './components/layout/CanvasPanel'
import { NavigatorPanel } from './components/layout/NavigatorPanel'
import { PaymentGate } from './components/payment/PaymentGate'
import './index.css'

function AppInner() {
  const [chatWidth, setChatWidth] = useState(300)
  const [navWidth, setNavWidth] = useState(196)
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

      {/* Main panels */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat panel — resizable */}
        <div style={{ width: chatWidth, minWidth: 220, maxWidth: 480 }} className="shrink-0 flex flex-col overflow-hidden">
          <ChatPanel />
        </div>

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
