import { useDeck } from '../../context/DeckContext'
import { regenerateSlide } from '../../api/client'

export function NavigatorPanel() {
  const { state, dispatch } = useDeck()
  const { slides, activeSlideIndex, deckBuilt } = state

  if (!deckBuilt) {
    return <div className="w-52 border-l border-border bg-bg" />
  }

  async function handleRegenerate(index: number, type: string) {
    const { slide } = await regenerateSlide(type, state.dimensions)
    dispatch({ type: 'UPDATE_SLIDE', payload: { index, slide } })
  }

  return (
    <div className="w-52 border-l border-border bg-bg flex flex-col overflow-hidden">
      <div className="px-3 py-3 border-b border-border text-xs font-semibold text-secondary uppercase tracking-wider">
        Slides ({slides.length})
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {slides.map((slide, i) => (
          <div
            key={i}
            onClick={() => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: i })}
            className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
              i === activeSlideIndex
                ? 'bg-accent/20 border border-accent/40 text-primary'
                : 'hover:bg-surface border border-transparent text-secondary hover:text-primary'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-5 h-5 rounded text-xs flex items-center justify-center shrink-0 font-mono ${
                i === activeSlideIndex ? 'bg-accent text-white' : 'bg-surface text-secondary'
              }`}>
                {i + 1}
              </div>
              <span className="text-xs truncate">{slide.type.replace('Slide', '')}</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); handleRegenerate(i, slide.type) }}
              className="opacity-0 group-hover:opacity-100 text-secondary hover:text-accent-light text-xs transition-opacity"
              title="Regenerate slide"
            >
              ⟳
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
