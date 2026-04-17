import { useRef, useEffect, useState } from 'react'
import { useDeck } from '../../context/DeckContext'
import { SlideRenderer } from '../slides/SlideRenderer'

export function CanvasPanel() {
  const { state, dispatch } = useDeck()
  const { slides, activeSlideIndex, deckBuilt } = state
  const activeSlide = slides[activeSlideIndex]
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Scale to fit container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const containerW = el.clientWidth - 64
      const containerH = el.clientHeight - 64
      const scaleW = containerW / 1920
      const scaleH = containerH / 1080
      setScale(Math.min(scaleW, scaleH))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Keyboard + wheel navigation
  useEffect(() => {
    if (!deckBuilt) return

    const go = (delta: number) => {
      const next = Math.max(0, Math.min(slides.length - 1, activeSlideIndex + delta))
      if (next !== activeSlideIndex) dispatch({ type: 'SET_ACTIVE_SLIDE', payload: next })
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.isContentEditable) return
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(1) }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(-1) }
    }

    let wheelTimer: ReturnType<typeof setTimeout>
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      clearTimeout(wheelTimer)
      wheelTimer = setTimeout(() => go(e.deltaY > 0 ? 1 : -1), 80)
    }

    window.addEventListener('keydown', onKey)
    containerRef.current?.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      containerRef.current?.removeEventListener('wheel', onWheel)
      clearTimeout(wheelTimer)
    }
  }, [deckBuilt, slides.length, activeSlideIndex, dispatch])

  if (!deckBuilt || !activeSlide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D14]">
        <div className="text-center text-secondary">
          <div className="text-6xl mb-4 opacity-20">🖼</div>
          <div className="text-sm">Your slides will appear here as we talk</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0D0D14] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: Math.max(0, activeSlideIndex - 1) })}
            disabled={activeSlideIndex === 0}
            className="text-secondary hover:text-primary disabled:opacity-20 transition-colors text-lg leading-none"
          >‹</button>
          <span className="text-xs text-secondary">
            Slide {activeSlideIndex + 1} of {slides.length} · <span className="text-accent-light">{activeSlide.type.replace('Slide', '')}</span>
          </span>
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: Math.min(slides.length - 1, activeSlideIndex + 1) })}
            disabled={activeSlideIndex === slides.length - 1}
            className="text-secondary hover:text-primary disabled:opacity-20 transition-colors text-lg leading-none"
          >›</button>
        </div>
        <div className="text-xs text-secondary/50">← → keys or scroll to navigate</div>
      </div>
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-8">
        <div
          style={{
            width: 1920,
            height: 1080,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="shadow-2xl rounded-lg overflow-hidden"
        >
          <SlideRenderer
            type={activeSlide.type}
            props={activeSlide.props}
            slideIndex={activeSlideIndex}
          />
        </div>
      </div>
    </div>
  )
}
