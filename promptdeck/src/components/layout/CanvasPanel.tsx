import { useRef, useEffect, useState } from 'react'
import { useDeck } from '../../context/DeckContext'
import { SlideRenderer } from '../slides/SlideRenderer'
import type { DeckStyleType } from '../../context/DeckContext'
import { SLIDE_LAYOUTS } from '../../constants/slideLayouts'

const FREE_SLIDES = 3
const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview')

const STYLES: {
  id: DeckStyleType
  label: string
  desc: string
  preview: string
  accentBar: string
  isLight?: boolean
}[] = [
  { id: 'dark',   label: 'Dark Pro',         desc: 'Investor-grade editorial dark',    preview: 'linear-gradient(135deg,#000 0%,#0d0520 100%)',   accentBar: '#7C3AED' },
  { id: 'light',  label: 'Clean Light',       desc: 'Crisp white — boardroom ready',    preview: 'linear-gradient(135deg,#eef2ff 0%,#fff 100%)',   accentBar: '#2563EB', isLight: true },
  { id: 'bold',   label: 'Bold Color',        desc: 'High-energy gradient standout',    preview: 'linear-gradient(135deg,#0f0527 0%,#0a2a5e 100%)', accentBar: '#06B6D4' },
  { id: 'navy',   label: 'Deep Navy',         desc: 'Corporate, McKinsey-grade',        preview: 'linear-gradient(135deg,#0a1628 0%,#1e3a5f 100%)', accentBar: '#3B82F6' },
  { id: 'forest', label: 'Midnight Forest',   desc: 'Premium startup, earthy tones',   preview: 'linear-gradient(135deg,#0a1a0c 0%,#1a3a20 100%)', accentBar: '#10B981' },
  { id: 'rose',   label: 'Rose Gold',         desc: 'Luxury consumer brand',            preview: 'linear-gradient(135deg,#1a0a10 0%,#3d1525 100%)', accentBar: '#F43F5E' },
]

function StyleCard({
  style,
  selected,
  onClick,
}: {
  style: (typeof STYLES)[number]
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-3 rounded-xl transition-all duration-200 text-left w-full group"
      style={{
        background: selected ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
        border: selected ? '1.5px solid #7C3AED' : '1.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Mini slide preview */}
      <div
        className="w-full rounded-lg overflow-hidden relative"
        style={{ height: 56, background: style.preview }}
      >
        <div className="absolute bottom-2 left-2 right-2">
          <div className="rounded-sm mb-1" style={{ height: 5, width: '50%', background: style.accentBar }} />
          <div className="rounded-sm mb-0.5" style={{ height: 3, width: '72%', background: style.isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }} />
          <div className="rounded-sm" style={{ height: 3, width: '42%', background: style.isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }} />
        </div>
      </div>
      <div className="flex items-start justify-between gap-1">
        <div>
          <div className="font-semibold text-white text-xs leading-tight">{style.label}</div>
          <div className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(148,163,184,0.5)', fontSize: 10 }}>{style.desc}</div>
        </div>
        {selected && (
          <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#A78BFA' }}>
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  )
}


function LayoutPicker({ slideType, currentLayout, activeSlideIndex, dispatch }: {
  slideType: string; currentLayout: string; activeSlideIndex: number; dispatch: any
}) {
  const layouts = SLIDE_LAYOUTS[slideType]
  if (!layouts || layouts.length < 2) return null
  return (
    <div className="flex items-center gap-1.5">
      <div className="text-xs mr-1" style={{ color: 'rgba(148,163,184,0.35)', fontSize: 10, letterSpacing: '0.05em' }}>LAYOUT</div>
      {layouts.map(l => {
        const active = currentLayout === l.id || (!currentLayout && l.id === layouts[0].id)
        return (
          <button
            key={l.id}
            onClick={() => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: activeSlideIndex, key: 'layout', value: l.id } })}
            title={l.label}
            className="relative rounded overflow-hidden transition-all duration-150"
            style={{
              width: 36, height: 24,
              border: active ? '1.5px solid #7C3AED' : '1.5px solid rgba(255,255,255,0.1)',
              boxShadow: active ? '0 0 8px rgba(124,58,237,0.35)' : 'none',
              background: '#0a0a0a',
            }}
          >
            <svg viewBox="0 0 36 24" width="36" height="24" dangerouslySetInnerHTML={{ __html: l.thumb }} />
            {active && <div className="absolute inset-0 rounded" style={{ background: 'rgba(124,58,237,0.08)' }} />}
          </button>
        )
      })}
    </div>
  )
}
export function CanvasPanel() {
  const { state, dispatch } = useDeck()
  const { slides, activeSlideIndex, prevSlideIndex, deckBuilt, deckStyle } = state
  const activeSlide = slides[activeSlideIndex]
  const containerRef = useRef<HTMLDivElement>(null)
  // scale removed — using autoScale + userZoom
  const [animClass, setAnimClass] = useState('')
  const [customUploading, setCustomUploading] = useState(false)
  const [customThumb, setCustomThumb] = useState<string | null>(null)
  const styleFileRef = useRef<HTMLInputElement>(null)
  const [autoScale, setAutoScale] = useState(1)
  const [userZoom, setUserZoom] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const containerW = el.clientWidth - 64
      const containerH = el.clientHeight - 64
      setAutoScale(Math.min(containerW / 1920, containerH / 1080))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!deckBuilt) return
    const cls = activeSlideIndex >= (prevSlideIndex ?? 0) ? 'slide-enter' : 'slide-enter-back'
    setAnimClass(cls)
    const t = setTimeout(() => setAnimClass(''), 300)
    return () => clearTimeout(t)
  }, [activeSlideIndex])

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
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); setUserZoom(z => Math.min(2, parseFloat((z + 0.1).toFixed(1)))) }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); setUserZoom(z => Math.max(0.3, parseFloat((z - 0.1).toFixed(1)))) }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); setUserZoom(1) }
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
      if (file.type.startsWith('image/')) {
        setCustomThumb(URL.createObjectURL(file))
      }
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (res.ok) {
        const data = await res.json()
        dispatch({ type: 'SET_CUSTOM_STYLE', payload: data.preview || '' })
      } else {
        dispatch({ type: 'SET_DECK_STYLE', payload: 'custom' })
      }
    } catch {
      dispatch({ type: 'SET_DECK_STYLE', payload: 'custom' })
    } finally {
      setCustomUploading(false)
      if (styleFileRef.current) styleFileRef.current.value = ''
    }
  }

  // ── Style picker (pre-deck) ────────────────────────────────────────────────
  if (!deckBuilt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0D0D14] px-10 overflow-hidden">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-2xl font-black text-white mb-1">Choose your deck style</div>
          <div className="text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>
            You can change this later · Start chatting whenever you're ready
          </div>
        </div>

        {/* 3×2 grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xl mb-4">
          {STYLES.map(s => (
            <StyleCard
              key={s.id}
              style={s}
              selected={deckStyle === s.id}
              onClick={() => dispatch({ type: 'SET_DECK_STYLE', payload: s.id })}
            />
          ))}
        </div>

        {/* Upload your own — compact single row */}
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
          className="w-full max-w-xl flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-5"
          style={{
            background: deckStyle === 'custom' ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
            border: deckStyle === 'custom' ? '1.5px solid #7C3AED' : '1.5px dashed rgba(255,255,255,0.1)',
          }}
        >
          {/* Thumbnail or upload icon */}
          <div
            className="shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
            style={{ width: 52, height: 36, background: customThumb ? 'transparent' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {customThumb ? (
              <img src={customThumb} alt="ref" className="w-full h-full object-cover" />
            ) : customUploading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'rgba(148,163,184,0.4)' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(148,163,184,0.35)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-semibold text-white">Match your brand</div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(148,163,184,0.45)', fontSize: 10 }}>
              Upload a screenshot, PDF, or PPTX — we'll replicate its look
            </div>
          </div>
          {deckStyle === 'custom' ? (
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#A78BFA' }}>
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(148,163,184,0.3)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </button>

        <div className="text-xs" style={{ color: 'rgba(148,163,184,0.25)' }}>← Tell me about your startup in the chat to get started</div>
      </div>
    )
  }

  // ── Slide canvas ───────────────────────────────────────────────────────────
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
        {/* Layout picker */}
        {activeSlide && (
          <LayoutPicker
            slideType={activeSlide.type}
            currentLayout={activeSlide.props?.layout || ''}
            activeSlideIndex={activeSlideIndex}
            dispatch={dispatch}
          />
        )}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setUserZoom(z => Math.max(0.3, parseFloat((z - 0.1).toFixed(1))))}
            title="Zoom out (Ctrl -)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-surface border border-border transition-colors text-sm font-medium"
          >−</button>
          <button
            onClick={() => setUserZoom(1)}
            title="Reset zoom (Ctrl 0)"
            className="min-w-[48px] h-7 px-2 text-xs font-mono text-secondary hover:text-primary rounded-lg hover:bg-surface border border-border transition-colors"
          >{Math.round(autoScale * userZoom * 100)}%</button>
          <button
            onClick={() => setUserZoom(z => Math.min(2, parseFloat((z + 0.1).toFixed(1))))}
            title="Zoom in (Ctrl +)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-surface border border-border transition-colors text-sm font-medium"
          >+</button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ background: '#0D0D14' }}>
        <div
          className={animClass}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 1920,
            height: 1080,
            transform: `translate(-50%, -50%) scale(${autoScale * userZoom})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="w-full h-full overflow-hidden rounded-xl" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}>
            {isLocked ? <LockedSlide /> : (
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
        <div className="flex items-center justify-center gap-3">
          {['✓ All slides', '✓ PDF export', '✓ 3 deck credits', '✓ Edit everything'].map(f => (
            <span key={f} className="text-sm font-medium px-4 py-2 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
