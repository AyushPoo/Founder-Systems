import type { ConfirmationCardData } from '../../types'
import { useChat } from '../../hooks/useChat'
import { useDeck } from '../../context/DeckContext'

export function ConfirmationCard({ card }: { card: ConfirmationCardData }) {
  const { confirmBuild } = useChat()
  const { dispatch } = useDeck()
  const s = card.summary

  return (
    <div className="mx-2 mb-4 rounded-2xl border border-accent/40 bg-surface p-4">
      <div className="text-xs font-semibold text-accent-light mb-3 uppercase tracking-wider">
        Here's what I've understood
      </div>
      <div className="space-y-2 text-sm text-secondary mb-4">
        {s.company && <div><span className="text-primary font-medium">Company:</span> {typeof s.company === 'object' ? s.company.name : s.company}</div>}
        {s.problem && <div><span className="text-primary font-medium">Problem:</span> {typeof s.problem === 'object' ? s.problem.statement : s.problem}</div>}
        {s.market && <div><span className="text-primary font-medium">Market:</span> {typeof s.market === 'object' ? `TAM: ${s.market.tam}` : s.market}</div>}
        {s.traction && <div><span className="text-primary font-medium">Traction:</span> {typeof s.traction === 'object' ? s.traction.users || s.traction.revenue : s.traction}</div>}
        {s.ask && <div><span className="text-primary font-medium">Ask:</span> {typeof s.ask === 'object' ? `${s.ask.amount} for ${s.ask.purpose}` : s.ask}</div>}
      </div>
      <div className="flex gap-2">
        <button
          onClick={confirmBuild}
          className="flex-1 bg-accent hover:bg-accent/90 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          ✓ Build my deck
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_CONFIRMATION_CARD', payload: null })}
          className="flex-1 border border-border hover:border-secondary text-secondary rounded-xl py-2.5 text-sm transition-colors"
        >
          ✎ Edit this
        </button>
      </div>
    </div>
  )
}
