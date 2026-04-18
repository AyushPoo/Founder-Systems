import { useRef, useEffect, useState } from 'react'
import { useDeck } from '../../context/DeckContext'
import { SlideRenderer } from '../slides/SlideRenderer'
import type { DeckStyleType } from '../../context/DeckContext'

const FREE_SLIDES = 3
const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview')

const STYLES: { id: DeckStyleType; label: string; desc: string; bg: string; accent: string; preview: string }[] = [
  {
    id: 'dark',
    label: 'Dark Pro',
    desc: 'Investor-grade, editorial dark theme',
    bg: '#0A0F1E',
    accent: '#7C3AED',
    preview: 'linear-gradient(135deg,#0A0F1E,#1a0a3e)',
  },
  {
    id: 'light',
    label: 'Clean Light',
    desc: 'Crisp, airy white — boardroom ready',
    bg: '#FAFAFA',
    accent: '#2563EB',
    preview: 'linear-gradient(135deg,#f0f4ff,#ffffff)',
  },
  {
    id: 'bold',
    label: 'Bold Color',
    desc: 'High-energy gradient — built to stand out',
    bg: '#0D0D14',
    accent: '#06B6D4',
    preview: 'linear-gradient(135deg,#1e0a3e,#0a1e3e)',
  },
]

export function CanvasPanel() {
  const { state, dispatch } = useDeck()
  const { slides, activeSlideIndex, prevSlideIndex, deckBuilt, deckStyle } = state
  const activeSlide = slides[activeSlideIndex]
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [animClass, setAnimClass] = useState('')

  // Scale to fit
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const containerW = el.clientWidth - 64
      const containerH = el.clientHeight - 64
      setScale(Math.min(containerW / 1920, containerH / 1080))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Slide enter animation
  useEffect(() => {
    if (!deckBuilt) return
    const cls = activeSlideIndex >= (prevSlideIndex ?? 0) ? 'slide-enter' : 'slide-enter-back'
    setAnimClass(cls)
    const t = setTimeout(() => setAnimClass(''), 300)
    return () => clearTimeout(t)
  }, [activeSlideIndex])

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
      wheelTimer = setTimeout(() => go(e.deltaY > 0 ? 1 : -1), 60)
    }
    window.addEventListener('keydown', onKey)
    containerRef.current?.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      containerRef.current?.removeEventListener('wheel', onWheel)
      clearTimeout(wheelTimer)
    }
  }, [deckBuilt, slides.length, activeSlideIndex, dispatch])

  // Style picker (before deck built)
  if (!deckBuilt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D0D14] gap-12">
        <div className="text-center">
          <div className="text-3xl font-black text-white mb-2">Choose your deck style</div>
          <div className="text-sm" style={{ color: 'rgba(148,163,184,0.7)' }}>You can change this later. Start chatting whenever you're ready.</div>
        </div>
        <div className="flex gap-6">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => dispatch({ type: 'SET_DECK_STYLE', payload: s.id })}
              className="flex flex-col gap-4 p-5 rounded-2xl transition-all duration-200 w-52"
              style={{
                background: deckStyle === s.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                border: deckStyle === s.id ? '2px solid #7C3AED' : '2px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Preview card */}
              <div className="w-full rounded-xl overflow-hidden" style={{ height: 100, background: s.preview, position: 'relative' }}>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="rounded" style={{ height: 8, width: '60%', background: s.accent, marginBottom: 6 }} />
                  <div className="rounded" style={{ height: 5, width: '80%', background: 'rgba(255,255,255,0.3)' }} />
                  <div className="rounded mt-1" style={{ height: 5, width: '50%', background: 'rgba(255,255,255,0.15)' }} />
                </div>
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm mb-0.5">{s.label}</div>
                <div className="text-xs" style={{ color: 'rgba(148,163,184,0.6)' }}>{s.desc}</div>
              </div>
              {deckStyle === s.id && (
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#A78BFA' }}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  Selected
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>← Tell me about your startup in the chat to get started</div>
      </div>
    )
  }

  const isLocked = !isPreview && !state.orderId && activeSlideIndex >= FREE_SLIDES

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
            Slide {activeSlideIndex + 1} of {slides.length} · <span className="text-accent-light">{activeSlide?.type.replace('Slide', '')}</span>
          </span>
          <button
            onClick={() => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: Math.min(slides.length - 1, activeSlideIndex + 1) })}
            disabled={activeSlideIndex === slides.length - 1}
            className="text-secondary hover:text-primary disabled:opacity-20 transition-colors text-lg leading-none"
          >›</button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'SET_DRAG_MODE', payload: !state.dragMode })}
            title={state.dragMode ? 'Exit move mode' : 'Move elements'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              state.dragMode ? 'bg-accent text-white' : 'text-secondary hover:text-primary hover:bg-surface border border-border'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            {state.dragMode ? 'Move ON' : 'Move'}
          </button>
          <div className="text-xs text-secondary/50">← → or scroll</div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-8">
        <div
          className={animClass}
          style={{
            width: 1920,
            height: 1080,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            position: 'relative',
          }}
        >
          <div className="w-full h-full shadow-2xl rounded-lg overflow-hidden">
            {isLocked ? (
              <LockedSlide />
            ) : (
              <SlideRenderer type={activeSlide.type} props={{ ...activeSlide.props, deckStyle }} slideIndex={activeSlideIndex} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LockedSlide() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#0A0F1E' }}>
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-6">🔒</div>
        <div className="text-4xl font-black text-white mb-4">Unlock your full deck</div>
        <div className="text-xl mb-8" style={{ color: 'rgba(148,163,184,0.7)' }}>
          Your first 3 slides are free. Get the complete pitch deck + PDF export for ₹500.
        </div>
        <div className="flex items-center justify-center gap-3 mb-8">
          {['✓ All slides', '✓ PDF export', '✓ 3 deck credits', '✓ Edit everything'].map(f => (
            <span key={f} className="text-sm font-medium px-4 py-2 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
