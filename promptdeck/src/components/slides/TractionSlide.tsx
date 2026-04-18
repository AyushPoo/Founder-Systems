import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Metric { value: string; label: string; growth?: string }
interface Props { headline?: string; metrics?: Metric[]; slideIndex: number }

function metricFontSize(val: string) {
  const n = (val || '').length
  if (n <= 4) return 80
  if (n <= 6) return 64
  if (n <= 8) return 52
  return 44
}

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
      <div className="px-20 pt-14 pb-0 shrink-0">
        <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-2.5" style={{ color: '#10B981' }}>Traction</div>
        <EditableText
          value={headline || "The numbers don't lie"}
          onChange={up('headline')}
          tag="h2"
          className="font-display font-black text-white"
          style={{ fontSize: 46, letterSpacing: '-2px', lineHeight: 1.1, fontFamily: "'Bricolage Grotesque', sans-serif" }}
        />
      </div>

      {/* 2×2 metric grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2" style={{ marginTop: 24 }}>
        {items.map((m, i) => (
          <div
            key={i}
            className="flex flex-col items-start justify-center px-20 py-6 relative"
            style={{
              borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}
          >
            {/* Faint quadrant number */}
            <div
              className="absolute top-4 right-6 font-display font-black tabular-nums select-none"
              style={{ fontSize: 40, color: 'rgba(255,255,255,0.04)', lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>

            {/* Metric value */}
            <div
              className="font-display font-black text-white leading-none mb-2"
              style={{
                fontSize: metricFontSize(m.value),
                letterSpacing: '-3px',
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}
            >
              {m.value}
            </div>

            {/* Label */}
            <div className="font-medium mb-3" style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}>
              {m.label}
            </div>

            {/* Growth badge */}
            {m.growth && (
              <div
                className="font-semibold px-3.5 py-1 rounded-full text-sm"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10B981',
                }}
              >
                {m.growth}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
