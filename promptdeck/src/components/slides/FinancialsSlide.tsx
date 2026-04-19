import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'
import { getTheme } from '../../constants/themes'

interface Props { headline?: string; years?: number[]; revenue?: number[]; currency?: string; unit?: string; projected?: boolean; slideIndex: number; deckStyle?: string }

export function FinancialsSlide({ headline, years = [2023, 2024, 2025, 2026], revenue = [0.5, 1.2, 2.8, 6.0], currency = '$', unit = 'M', projected = true, slideIndex, deckStyle }: Props) {
  const { dispatch } = useDeck()
  const t = getTheme(deckStyle)
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const data = years.map((yr, i) => ({
    year: String(yr),
    revenue: revenue[i] ?? 0,
    future: projected && i >= revenue.filter((_, j) => j < 3 && (revenue[j] || 0) > 0).length
  }))
  const latestRev = revenue[revenue.length - 1] || 0
  const prevRev = revenue[revenue.length - 2] || 0
  const growth = prevRev > 0 ? Math.round(((latestRev - prevRev) / prevRev) * 100) : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 16px' }}>
        <div style={{ color: t.textMuted, fontSize: 14, marginBottom: 4 }}>{label}</div>
        <div style={{ color: t.text, fontSize: 20, fontWeight: 700 }}>{currency}{payload[0].value}{unit}</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="flex items-end justify-between px-24 pt-20 pb-10 shrink-0" style={{ borderBottom: `1px solid ${t.border}` }}>
        <div>
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-4" style={{ color: t.accentLight }}>Financials</div>
          <EditableText value={headline || 'Revenue Projections'} onChange={up('headline')} tag="h2"
            className="font-display font-black"
            style={{ fontSize: 72, letterSpacing: '-3px', fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
        </div>
        <div className="text-right pb-2">
          <div className="font-display font-black" style={{ fontSize: 64, color: t.accent, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {currency}{latestRev}{unit}
          </div>
          <div className="font-medium" style={{ fontSize: 18, color: t.textMuted }}>{years[years.length - 1]} target</div>
          {growth > 0 && (
            <div className="inline-block mt-2 font-semibold px-3 py-1 rounded-full text-sm"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
              +{growth}% YoY
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 px-24 py-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%">
            <XAxis dataKey="year" axisLine={false} tickLine={false}
              tick={{ fill: t.textMuted, fontSize: 18, fontWeight: 500 }} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: t.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.future ? `${t.accent}40` : i === data.length - 1 ? t.accent : `${t.accent}${Math.round((0.4 + i * 0.15) * 255).toString(16).padStart(2, '0')}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
