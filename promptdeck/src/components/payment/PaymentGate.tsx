import { useDeck } from '../../context/DeckContext'
import { useCredits } from '../../hooks/useCredits'

export function PaymentGate() {
  const { state } = useDeck()
  const { initiatePayment, downloadPdf } = useCredits()
  const { deckBuilt, credits, orderId } = state

  if (!deckBuilt) return null

  if (!orderId || credits === 0) {
    return (
      <button
        onClick={initiatePayment}
        className="bg-accent hover:bg-accent/90 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2"
      >
        <span>Export PDF</span>
        <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs">₹500 · 3 decks</span>
      </button>
    )
  }

  return (
    <button
      onClick={downloadPdf}
      className="bg-success hover:bg-success/90 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2"
    >
      <span>↓ Download PDF</span>
      <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs">{credits} left</span>
    </button>
  )
}
