import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props { headline?: string; years?: number[]; revenue?: number[]; currency?: string; unit?: string; projected?: boolean; slideIndex: number }

const CustomTooltip = ({ active, payload, label, currency, unit }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 16px' }}>
      <div style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{currency}{payload[0].value}{unit}</div>
    </div>
  )
}

export function FinancialsSlide({ headline, years = [2023, 2024, 2025, 2026], revenue = [0.5, 1.2, 2.8, 6.0], currency = '$', unit = 'M', projected = true, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const data = years.map((yr, i) => ({ year: String(yr), revenue: revenue[i] ?? 0, future: projected && i >= revenue.filter((_, j) => j < 3 && (revenue[j] || 0) > 0).length }))
  const latestRev = revenue[revenue.length - 1] || 0
  const prevRev = revenue[revenue.length - 2] || 0
  const growth = prevRev > 0 ? Math.round(((latestRev - prevRev) / prevRev) * 100) : 0

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
      <div className="flex items-end justify-between px-24 pt-20 pb-10 shrink-0" style={{ borderBottom: '1px solid #111' }}>
        <div>
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-4" style={{ color: '#A78BFA' }}>Financials</div>
          <EditableText value={headline || 'Revenue Projections'} onChange={up('headline')} tag="h2"
            className="font-display font-black text-white"
            style={{ fontSize: 72, letterSpacing: '-3px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        </div>
        <div className="text-right pb-2">
          <div className="font-display font-black" style={{ fontSize: 64, color: '#7C3AED', letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {currency}{latestRev}{unit}
          </div>
          <div className="font-medium" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>{years[years.length - 1]} target</div>
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
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 18, fontWeight: 500 }} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip currency={currency} unit={unit} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.future ? 'rgba(124,58,237,0.25)' : i === data.length - 1 ? '#7C3AED' : `rgba(124,58,237,${0.4 + i * 0.15})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
