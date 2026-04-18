import { useDeck } from '../../context/DeckContext'
import { regenerateSlide } from '../../api/client'

const FREE_SLIDES = 3
const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview')

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

  const isPaid = isPreview || !!state.orderId

  return (
    <div className="w-52 border-l border-border bg-bg flex flex-col overflow-hidden">
      <div className="px-3 py-3 border-b border-border text-xs font-semibold text-secondary uppercase tracking-wider">
        Slides ({slides.length})
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {slides.map((slide, i) => {
          const locked = !isPaid && i >= FREE_SLIDES
          return (
            <div
              key={i}
              onClick={() => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: i })}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                i === activeSlideIndex
                  ? 'bg-accent/20 border border-accent/40 text-primary'
                  : 'hover:bg-surface border border-transparent text-secondary hover:text-primary'
              } ${locked ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-5 h-5 rounded text-xs flex items-center justify-center shrink-0 font-mono ${
                  i === activeSlideIndex ? 'bg-accent text-white' : 'bg-surface text-secondary'
                }`}>
                  {locked ? '🔒' : i + 1}
                </div>
                <span className="text-xs truncate">{slide.type.replace('Slide', '')}</span>
              </div>
              {!locked && (
                <button
                  onClick={e => { e.stopPropagation(); handleRegenerate(i, slide.type) }}
                  className="opacity-0 group-hover:opacity-100 text-secondary hover:text-accent-light text-xs transition-opacity"
                  title="Regenerate slide"
                >
                  ⟳
                </button>
              )}
            </div>
          )
        })}
      </div>
      {!isPaid && (
        <div className="p-3 border-t border-border">
          <div className="text-xs text-center" style={{ color: 'rgba(148,163,184,0.5)' }}>
            {FREE_SLIDES} of {slides.length} slides free
          </div>
          <div className="mt-1 w-full rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}>
            <div style={{ width: `${(FREE_SLIDES / slides.length) * 100}%`, height: '100%', background: '#7C3AED' }} />
          </div>
        </div>
      )}
    </div>
  )
}
