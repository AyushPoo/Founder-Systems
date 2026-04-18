import { useRef, useEffect, useState } from 'react'
import { useDeck } from '../../context/DeckContext'
import { SlideRenderer } from '../slides/SlideRenderer'
import type { DeckStyleType } from '../../context/DeckContext'

const FREE_SLIDES = 3
const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview')

const STYLES: {
  id: DeckStyleType
  label: string
  desc: string
  accent: string
  preview: string
  accentBar: string
}[] = [
  {
    id: 'dark',
    label: 'Dark Pro',
    desc: 'Investor-grade editorial dark',
    accent: '#7C3AED',
    preview: 'linear-gradient(135deg,#000000 0%,#0d0520 100%)',
    accentBar: '#7C3AED',
  },
  {
    id: 'light',
    label: 'Clean Light',
    desc: 'Crisp white — boardroom ready',
    accent: '#2563EB',
    preview: 'linear-gradient(135deg,#f0f4ff 0%,#ffffff 100%)',
    accentBar: '#2563EB',
  },
  {
    id: 'bold',
    label: 'Bold Color',
    desc: 'High-energy gradient standout',
    accent: '#06B6D4',
    preview: 'linear-gradient(135deg,#0f0527 0%,#1a0a5e 50%,#0a2a5e 100%)',
    accentBar: '#06B6D4',
  },
  {
    id: 'navy',
    label: 'Deep Navy',
    desc: 'Corporate, McKinsey-grade',
    accent: '#3B82F6',
    preview: 'linear-gradient(135deg,#0a1628 0%,#1e3a5f 100%)',
    accentBar: '#3B82F6',
  },
  {
    id: 'forest',
    label: 'Midnight Forest',
    desc: 'Premium startup, earthy tones',
    accent: '#10B981',
    preview: 'linear-gradient(135deg,#0a1a0c 0%,#1a3a20 100%)',
    accentBar: '#10B981',
  },
  {
    id: 'rose',
    label: 'Rose Gold',
    desc: 'Luxury consumer brand',
    accent: '#F43F5E',
    preview: 'linear-gradient(135deg,#1a0a10 0%,#3d1525 100%)',
    accentBar: '#F43F5E',
  },
]

function StylePreviewCard({
  style,
  selected,
  onClick,
}: {
  style: (typeof STYLES)[number]
  selected: boolean
  onClick: () => void
}) {
  const isLight = style.id === 'light'
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 p-4 rounded-2xl transition-all duration-200 text-left w-full"
      style={{
        background: selected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
        border: selected ? '2px solid #7C3AED' : '2px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Mini slide preview */}
      <div
        className="w-full rounded-xl overflow-hidden relative"
        style={{ height: 80, background: style.preview }}
      >
        <div className="absolute bottom-2.5 left-2.5 right-2.5">
          <div
            className="rounded-sm mb-1.5"
            style={{ height: 7, width: '55%', background: style.accentBar, opacity: 0.9 }}
          />
          <div
            className="rounded-sm mb-1"
            style={{ height: 4, width: '75%', background: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)' }}
          />
          <div
            className="rounded-sm"
            style={{ height: 4, width: '45%', background: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)' }}
          />
        </div>
      </div>
      <div>
        <div className="font-semibold text-white text-xs mb-0.5">{style.label}</div>
        <div className="text-xs" style={{ color: 'rgba(148,163,184,0.55)' }}>{style.desc}</div>
      </div>
      {selected && (
        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#A78BFA' }}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Selected
        </div>
      )}
    </button>
  )
}

export function CanvasPanel() {
  const { state, dispatch } = useDeck()
  const { slides, activeSlideIndex, prevSlideIndex, deckBuilt, deckStyle } = state
  const activeSlide = slides[activeSlideIndex]
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [animClass, setAnimClass] = useState('')
  const [customUploading, setCustomUploading] = useState(false)
  const [customThumb, setCustomThumb] = useState<string | null>(null)
  const styleFileRef = useRef<HTMLInputElement>(null)

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

  const handleStyleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCustomUploading(true)
    try {
      // Show thumbnail preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setCustomThumb(url)
      }
      // Upload to backend for style extraction
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      dispatch({ type: 'SET_CUSTOM_STYLE', payload: data.preview || '' })
    } catch {
      // Still set custom style even if backend fails — use local preview
      dispatch({ type: 'SET_DECK_STYLE', payload: 'custom' })
    } finally {
      setCustomUploading(false)
      if (styleFileRef.current) styleFileRef.current.value = ''
    }
  }

  // Style picker (before deck built)
  if (!deckBuilt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D0D14] px-8 gap-8 overflow-y-auto py-10">
        <div className="text-center">
          <div className="text-3xl font-black text-white mb-2">Choose your deck style</div>
          <div className="text-sm" style={{ color: 'rgba(148,163,184,0.6)' }}>
            You can change this later. Start chatting whenever you're ready.
          </div>
        </div>

        {/* 3×2 grid of presets */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
          {STYLES.map(s => (
            <StylePreviewCard
              key={s.id}
              style={s}
              selected={deckStyle === s.id}
              onClick={() => dispatch({ type: 'SET_DECK_STYLE', payload: s.id })}
            />
          ))}
        </div>

        {/* Upload your own style reference */}
        <div className="w-full max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(148,163,184,0.4)' }}>
            Or match your own brand
          </div>
          <input
            ref={styleFileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.pptx"
            className="hidden"
            onChange={handleStyleUpload}
          />
          <button
            onClick={() => styleFileRef.current?.click()}
            disabled={customUploading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200"
            style={{
              background: deckStyle === 'custom' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
              border: deckStyle === 'custom' ? '2px solid #7C3AED' : '2px dashed rgba(255,255,255,0.12)',
            }}
          >
            {/* Thumbnail or icon */}
            <div
              className="shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                width: 72,
                height: 48,
                background: customThumb ? 'transparent' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {customThumb ? (
                <img src={customThumb} alt="style ref" className="w-full h-full object-cover" />
              ) : customUploading ? (
                <svg className="w-5 h-5 animate-spin text-white opacity-50" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(148,163,184,0.4)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-white text-sm mb-0.5">Upload Style Reference</div>
              <div className="text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>
                Drop a screenshot, PDF, or PPTX — we'll match its look and feel
              </div>
            </div>
            {deckStyle === 'custom' && (
              <div className="flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: '#A78BFA' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Selected
              </div>
            )}
          </button>
        </div>

        <div className="text-xs" style={{ color: 'rgba(148,163,184,0.3)' }}>← Tell me about your startup in the chat to get started</div>
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
