import { useRef, useEffect, useState } from 'react'
import { useDeck } from '../../context/DeckContext'
import { SlideRenderer } from '../slides/SlideRenderer'

export function CanvasPanel() {
  const { state } = useDeck()
  const { slides, activeSlideIndex, deckBuilt } = state
  const activeSlide = slides[activeSlideIndex]
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

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
        <div className="text-xs text-secondary">
          Slide {activeSlideIndex + 1} of {slides.length} · <span className="text-accent-light">{activeSlide.type}</span>
        </div>
        <div className="text-xs text-secondary/50">Click any text to edit inline</div>
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
