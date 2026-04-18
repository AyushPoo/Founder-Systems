import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Metric { value: string; label: string; growth?: string }
interface Props { headline?: string; metrics?: Metric[]; slideIndex: number }

export function TractionSlide({ headline, metrics = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const items: Metric[] = metrics.length >= 4 ? metrics.slice(0, 4) : [
    { value: '$1.2M', label: 'ARR', growth: '↑ 3.2× YoY' },
    { value: '12,400', label: 'Active Users', growth: '↑ 18% MoM' },
    { value: '94%', label: 'Retention', growth: '+4pts QoQ' },
    { value: '48', label: 'Enterprise Clients', growth: '↑ 2× in 6 months' },
  ]
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
      {/* Header strip */}
      <div className="px-24 pt-16 pb-0 shrink-0">
        <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-3" style={{ color: '#10B981' }}>Traction</div>
        <EditableText value={headline || "The numbers don't lie"} onChange={up('headline')} tag="h2"
          className="font-display font-black text-white"
          style={{ fontSize: 52, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
      </div>
      {/* 2×2 metric grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 mt-8">
        {items.map((m, i) => (
          <div key={i} className="flex flex-col items-start justify-center px-24 py-8 relative"
               style={{
                 borderRight: i % 2 === 0 ? '1px solid #111' : 'none',
                 borderBottom: i < 2 ? '1px solid #111' : 'none',
               }}>
            {/* Faint index */}
            <div className="absolute top-6 right-8 font-display font-black tabular-nums" style={{ fontSize: 48, color: '#111', lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="font-display font-black text-white leading-none mb-3"
                 style={{ fontSize: 92, letterSpacing: '-4px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {m.value}
            </div>
            <div className="font-medium mb-4" style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }}>{m.label}</div>
            {m.growth && (
              <div className="font-semibold px-4 py-1.5 rounded-full text-base"
                   style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
                {m.growth}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
