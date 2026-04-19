import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'
import { getTheme } from '../../constants/themes'

interface Metric { value: string; label: string; growth?: string }
interface ChartPoint { period: string; value: number }
interface Props {
  headline?: string
  metrics?: Metric[]
  chartData?: ChartPoint[]
  chartMetric?: string
  layout?: string
  slideIndex: number
  deckStyle?: string
}

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

const DEFAULT_CHART_DATA: ChartPoint[] = [
  { period: 'M1', value: 0 },
  { period: 'M2', value: 8000 },
  { period: 'M3', value: 25000 },
  { period: 'M4', value: 65000 },
  { period: 'M5', value: 140000 },
  { period: 'M6', value: 320000 },
  { period: 'M7', value: 1200000 },
]

const GREEN = '#10B981'
const greenBg = 'rgba(16,185,129,0.08)'
const greenBorder = 'rgba(16,185,129,0.2)'

function formatYVal(v: number, unit: string = ''): string {
  const isUSD = unit.toLowerCase().includes('arr') || unit.toLowerCase().includes('revenue') || unit.toLowerCase().includes('$')
  const prefix = isUSD ? '$' : ''
  if (v >= 1_000_000) return `${prefix}${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${prefix}${(v / 1_000).toFixed(0)}K`
  return `${prefix}${v}`
}

// Custom tooltip
function ChartTooltip({ active, payload, label, unit, t }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 10, padding: '10px 16px', fontSize: 14, color: t.text,
    }}>
      <div style={{ color: t.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: t.accent }}>{formatYVal(payload[0].value, unit)}</div>
    </div>
  )
}

// --- CHART LAYOUT (Copy.ai / Careerist style) ---
function TractionChart({ headline, metrics, chartData, chartMetric, up, slideIndex, t }: any) {
  const items: Metric[] = metrics?.length ? metrics.slice(0, 3) : DEFAULT_METRICS.slice(0, 3)
  const data: ChartPoint[] = chartData?.length ? chartData : DEFAULT_CHART_DATA
  const unit = chartMetric || 'ARR'
  const gradId = `tg-${slideIndex}`

  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      {/* Header */}
      <div className="px-16 pt-12 pb-0 shrink-0">
        <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: GREEN }}>Traction</div>
        <EditableText value={headline || "The numbers don't lie"} onChange={up('headline')} tag="h2"
          className="font-display font-black"
          style={{ fontSize: 42, letterSpacing: '-1.5px', lineHeight: 1.1,
            fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
      </div>

      {/* Chart */}
      <div className="flex-1 px-8 pb-0 pt-4" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 32, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={t.accent} stopOpacity={t.isDark ? 0.3 : 0.5} />
                <stop offset="90%" stopColor={t.accent} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fill: t.textMuted, fontSize: 13, fontFamily: 'Inter, sans-serif' }}
              axisLine={{ stroke: t.border }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatYVal(v, unit)}
              tick={{ fill: t.textMuted, fontSize: 12, fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip content={(props: any) => <ChartTooltip {...props} unit={unit} t={t} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={t.accent}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 5, fill: t.accent, stroke: t.bg, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom metrics bar */}
      <div className="shrink-0 grid grid-cols-3" style={{ borderTop: `1px solid ${t.border}`, height: 116 }}>
        {items.map((m, i) => (
          <div key={i} className="flex flex-col items-center justify-center gap-1"
            style={{ borderRight: i < 2 ? `1px solid ${t.border}` : 'none' }}>
            <div className="font-display font-black leading-none"
              style={{ fontSize: 34, letterSpacing: '-1px',
                fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }}>
              {m.value}
            </div>
            <div style={{ fontSize: 13, color: t.textSub }}>{m.label}</div>
            {m.growth && (
              <div className="font-semibold text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: greenBg, border: `1px solid ${greenBorder}`, color: GREEN }}>
                {m.growth}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- GRID LAYOUT (2×2) ---
function TractionGrid({ headline, metrics, up, t }: any) {
  const items: Metric[] = metrics?.length >= 4 ? metrics.slice(0, 4) : DEFAULT_METRICS
  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="px-20 pt-14 pb-0 shrink-0">
        <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-2.5" style={{ color: GREEN }}>Traction</div>
        <EditableText value={headline || "The numbers don't lie"} onChange={up('headline')} tag="h2"
          className="font-display font-black"
          style={{ fontSize: 46, letterSpacing: '-2px', lineHeight: 1.1,
            fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
      </div>
      <div className="flex-1 grid grid-cols-2 grid-rows-2" style={{ marginTop: 24 }}>
        {items.map((m, i) => (
          <div key={i} className="flex flex-col items-start justify-center px-20 py-6 relative"
            style={{
              borderRight: i % 2 === 0 ? `1px solid ${t.border}` : 'none',
              borderBottom: i < 2 ? `1px solid ${t.border}` : 'none'
            }}>
            <div className="absolute top-4 right-6 font-display font-black tabular-nums select-none"
              style={{ fontSize: 40, color: t.textMuted, lineHeight: 1,
                fontFamily: "'Bricolage Grotesque', sans-serif", opacity: 0.4 }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="font-display font-black leading-none mb-2"
              style={{ fontSize: metricFontSize(m.value), letterSpacing: '-3px',
                fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }}>
              {m.value}
            </div>
            <div className="font-medium mb-3" style={{ fontSize: 18, color: t.textSub }}>{m.label}</div>
            {m.growth && (
              <div className="font-semibold px-3.5 py-1 rounded-full text-sm"
                style={{ background: greenBg, border: `1px solid ${greenBorder}`, color: GREEN }}>
                {m.growth}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- HERO-METRIC LAYOUT ---
function TractionHero({ headline, metrics, up, t }: any) {
  const items: Metric[] = metrics?.length ? metrics : DEFAULT_METRICS
  const hero = items[0]
  const supporting = items.slice(1, 4)
  const heroFs = (hero?.value?.length || 0) <= 5 ? 180 : (hero?.value?.length || 0) <= 8 ? 140 : 110
  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="px-20 pt-14 shrink-0">
        <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: GREEN }}>Traction</div>
        <EditableText value={headline || "Proof of momentum"} onChange={up('headline')} tag="h2"
          className="font-display font-black"
          style={{ fontSize: 36, letterSpacing: '-1px', fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="absolute" style={{ width: 600, height: 300, background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="relative text-center">
          <div className="font-display font-black leading-none"
            style={{ fontSize: heroFs, letterSpacing: '-6px', fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 0.9, color: t.text }}>
            {hero?.value || '$1.2M'}
          </div>
          <div className="mt-4 font-medium" style={{ fontSize: 22, color: t.textSub }}>{hero?.label || 'ARR'}</div>
          {hero?.growth && (
            <div className="inline-block mt-4 font-semibold px-5 py-2 rounded-full text-base"
              style={{ background: greenBg, border: `1px solid ${greenBorder}`, color: GREEN }}>
              {hero.growth}
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 grid grid-cols-3" style={{ borderTop: `1px solid ${t.border}`, height: 160 }}>
        {supporting.map((m, i) => (
          <div key={i} className="flex flex-col items-center justify-center"
            style={{ borderRight: i < 2 ? `1px solid ${t.border}` : 'none' }}>
            <div className="font-display font-black leading-none mb-1.5"
              style={{ fontSize: 40, letterSpacing: '-1.5px', fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }}>
              {m.value}
            </div>
            <div style={{ fontSize: 15, color: t.textSub }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TractionSlide({ headline, metrics = [], chartData, chartMetric, layout = 'chart', slideIndex, deckStyle }: Props) {
  const { dispatch } = useDeck()
  const t = getTheme(deckStyle)
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const shared = { headline, metrics, chartData, chartMetric, up, slideIndex, t }
  if (layout === 'hero-metric') return <TractionHero {...shared} />
  if (layout === 'grid') return <TractionGrid {...shared} />
  return <TractionChart {...shared} />
}
