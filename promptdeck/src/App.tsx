import { DeckProvider } from './context/DeckContext'
import { ChatPanel } from './components/layout/ChatPanel'
import { CanvasPanel } from './components/layout/CanvasPanel'
import { NavigatorPanel } from './components/layout/NavigatorPanel'
import { PaymentGate } from './components/payment/PaymentGate'
import './index.css'

function AppInner() {
  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-bg text-primary overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">P</div>
          <span className="font-semibold text-primary">PromptDeck AI</span>
          <span className="text-xs text-secondary bg-bg border border-border rounded-full px-2 py-0.5">Beta</span>
        </div>
        <PaymentGate />
      </div>
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-80 shrink-0 flex flex-col overflow-hidden">
          <ChatPanel />
        </div>
        <CanvasPanel />
        <NavigatorPanel />
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
