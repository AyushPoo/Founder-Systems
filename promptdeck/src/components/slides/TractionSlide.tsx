import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Metric { value: string; label: string; growth?: string }
interface Props { headline?: string; metrics?: Metric[]; layout?: string; slideIndex: number }

function metricFontSize(val: string) {
  const n = (val || '').length
  if (n <= 4) return 80; if (n <= 6) return 64; if (n <= 8) return 52; return 44
}

const DEFAULT_METRICS: Metric[] = [
  { value: '$1.2M', label: 'ARR', growth: '↑ 3.2× YoY' },
  { value: '12,400', label: 'Active Users', growth: '↑ 18% MoM' },
  { value: '94%', label: 'Retention', growth: '+4pts QoQ' },
  { value: '48', label: 'Enterprise Clients', growth: '↑ 2× in 6 months' },
]

function TractionGrid({ headline, metrics, up }: any) {
  const items: Metric[] = metrics?.length >= 4 ? metrics.slice(0, 4) : DEFAULT_METRICS
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
      <div className="px-20 pt-14 pb-0 shrink-0">
        <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-2.5" style={{ color: '#10B981' }}>Traction</div>
        <EditableText value={headline || "The numbers don't lie"} onChange={up('headline')} tag="h2" className="font-display font-black text-white"
          style={{ fontSize: 46, letterSpacing: '-2px', lineHeight: 1.1, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
      </div>
      <div className="flex-1 grid grid-cols-2 grid-rows-2" style={{ marginTop: 24 }}>
        {items.map((m, i) => (
          <div key={i} className="flex flex-col items-start justify-center px-20 py-6 relative"
            style={{ borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
            <div className="absolute top-4 right-6 font-display font-black tabular-nums select-none"
              style={{ fontSize: 40, color: 'rgba(255,255,255,0.04)', lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="font-display font-black text-white leading-none mb-2"
              style={{ fontSize: metricFontSize(m.value), letterSpacing: '-3px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {m.value}
            </div>
            <div className="font-medium mb-3" style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}>{m.label}</div>
            {m.growth && (
              <div className="font-semibold px-3.5 py-1 rounded-full text-sm"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>
                {m.growth}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TractionHero({ headline, metrics, up }: any) {
  const items: Metric[] = metrics?.length ? metrics : DEFAULT_METRICS
  const hero = items[0]
  const supporting = items.slice(1, 4)
  const heroFs = hero?.value?.length <= 5 ? 180 : hero?.value?.length <= 8 ? 140 : 110
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
      <div className="px-20 pt-14 shrink-0">
        <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: '#10B981' }}>Traction</div>
        <EditableText value={headline || "Proof of momentum"} onChange={up('headline')} tag="h2" className="font-display font-black text-white"
          style={{ fontSize: 36, letterSpacing: '-1px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
      </div>
      {/* Hero metric - centered */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Radial glow */}
        <div className="absolute" style={{ width: 600, height: 300, background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="relative text-center">
          <div className="font-display font-black text-white leading-none"
            style={{ fontSize: heroFs, letterSpacing: '-6px', fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 0.9 }}>
            {hero?.value || '$1.2M'}
          </div>
          <div className="mt-4 font-medium" style={{ fontSize: 22, color: 'rgba(255,255,255,0.35)' }}>{hero?.label || 'ARR'}</div>
          {hero?.growth && (
            <div className="inline-block mt-4 font-semibold px-5 py-2 rounded-full text-base"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>
              {hero.growth}
            </div>
          )}
        </div>
      </div>
      {/* Supporting metrics row */}
      <div className="shrink-0 grid grid-cols-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', height: 160 }}>
        {supporting.map((m, i) => (
          <div key={i} className="flex flex-col items-center justify-center"
            style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
            <div className="font-display font-black text-white leading-none mb-1.5"
              style={{ fontSize: 40, letterSpacing: '-1.5px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {m.value}
            </div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TractionTimeline({ headline, metrics, up }: any) {
  const items: Metric[] = metrics?.length ? metrics.slice(0, 4) : DEFAULT_METRICS
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
      <div className="px-20 pt-14 shrink-0">
        <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-2.5" style={{ color: '#10B981' }}>Traction</div>
        <EditableText value={headline || "Our growth story"} onChange={up('headline')} tag="h2" className="font-display font-black text-white"
          style={{ fontSize: 46, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
      </div>
      {/* Timeline */}
      <div className="flex-1 flex items-center px-16 relative">
        {/* Horizontal line */}
        <div className="absolute left-16 right-16" style={{ height: 1, background: 'rgba(255,255,255,0.1)', top: '50%' }} />
        {/* Nodes */}
        {items.map((m, i) => {
          const positions = ['12%', '36%', '62%', '86%']
          return (
            <div key={i} className="absolute flex flex-col items-center" style={{ left: positions[i], transform: 'translateX(-50%)' }}>
              {/* Top: value */}
              <div className="text-center mb-6">
                <div className="font-display font-black text-white leading-none" style={{ fontSize: 44, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {m.value}
                </div>
                <div className="mt-1.5" style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>{m.label}</div>
              </div>
              {/* Node circle */}
              <div className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
                <div className="absolute rounded-full" style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }} />
                <div className="relative rounded-full z-10" style={{ width: 12, height: 12, background: '#10B981' }} />
              </div>
              {/* Bottom: growth */}
              {m.growth && (
                <div className="mt-6 font-semibold px-3 py-1 rounded-full text-sm"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', color: '#10B981' }}>
                  {m.growth}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TractionSlide({ headline, metrics = [], layout = 'grid', slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const shared = { headline, metrics, up }
  if (layout === 'hero-metric') return <TractionHero {...shared} />
  if (layout === 'timeline') return <TractionTimeline {...shared} />
  return <TractionGrid {...shared} />
}
