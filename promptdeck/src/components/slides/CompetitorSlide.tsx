import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Competitor { name: string; x: number; y: number; us?: boolean }
interface Props { headline?: string; axes?: { x: string; y: string }; competitors?: Competitor[]; slideIndex: number }

export function CompetitorSlide({ headline, axes, competitors = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const items = competitors.length ? competitors : [
    { name: 'Us', x: 8.5, y: 8.5, us: true },
    { name: 'Competitor A', x: 3, y: 7, us: false },
    { name: 'Competitor B', x: 7, y: 3, us: false },
    { name: 'Competitor C', x: 2, y: 3, us: false },
  ]
  const axX = axes?.x || 'Ease of Use'
  const axY = axes?.y || 'Value / Price'
  const CHART_W = 680, CHART_H = 560
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      {/* Left panel */}
      <div className="w-80 shrink-0 flex flex-col justify-between px-16 py-20" style={{ background: '#06060a', borderRight: '1px solid #111' }}>
        <div>
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-8" style={{ color: '#A78BFA' }}>Landscape</div>
          <EditableText value={headline || "We're in a league of our own"} onChange={up('headline')} tag="h2"
            className="font-display font-black text-white leading-tight"
            style={{ fontSize: 48, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        </div>
        <div className="flex flex-col gap-5">
          {items.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.us ? '#7C3AED' : 'rgba(255,255,255,0.2)' }} />
              <div className="text-sm font-medium" style={{ color: c.us ? '#C4B5FD' : 'rgba(255,255,255,0.4)' }}>
                {c.us ? `${c.name} (You)` : c.name}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Right: chart */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative" style={{ width: CHART_W, height: CHART_H }}>
          {/* Quadrant lines */}
          <div className="absolute inset-0">
            <div className="absolute left-0 right-0" style={{ top: '50%', height: 1, background: '#1a1a1a' }} />
            <div className="absolute top-0 bottom-0" style={{ left: '50%', width: 1, background: '#1a1a1a' }} />
          </div>
          {/* Axis labels */}
          <div className="absolute -bottom-8 left-0 right-0 text-center text-sm font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>{axX} →</div>
          <div className="absolute -left-10 top-0 bottom-0 flex items-center text-sm font-medium" style={{ color: 'rgba(255,255,255,0.25)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>↑ {axY}</div>
          {/* Dots */}
          {items.map((c, i) => {
            const cx = (c.x / 10) * CHART_W
            const cy = CHART_H - (c.y / 10) * CHART_H
            return (
              <div key={i} className="absolute flex flex-col items-center gap-2"
                   style={{ left: cx, top: cy, transform: 'translate(-50%,-50%)', zIndex: c.us ? 20 : 10 }}>
                {c.us ? (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(124,58,237,0.3)', scale: '2' }} />
                      <div className="w-6 h-6 rounded-full relative" style={{ background: '#7C3AED', boxShadow: '0 0 20px rgba(124,58,237,0.6)' }} />
                    </div>
                    <div className="font-display font-bold text-sm px-3 py-1 rounded-full"
                         style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#C4B5FD', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {c.name}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }} />
                    <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.name}</div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
