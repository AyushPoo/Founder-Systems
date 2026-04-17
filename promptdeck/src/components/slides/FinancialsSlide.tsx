import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props { headline?: string; years?: number[]; revenue?: number[]; currency?: string; unit?: string; projected?: boolean; slideIndex: number }

export function FinancialsSlide({ headline, years = [2024,2025,2026], revenue = [0,0,0], currency = '$', unit = 'K', projected = true, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const data = years.map((yr, i) => ({ year: String(yr), revenue: revenue[i] ?? 0 }))
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0D0D14' }}>
      <div className="flex items-end justify-between px-24 pt-20 pb-10" style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
        <div>
          <div className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: '#A78BFA' }}>Financials</div>
          <EditableText value={headline || 'Revenue Projections'} onChange={up('headline')} tag="h2"
            className="font-black text-white" style={{ fontSize: 72 }} />
        </div>
        <div className="flex items-end gap-8 pb-2">
          {data.slice(-1).map(d => (
            <div key={d.year} className="text-right">
              <div className="font-black" style={{ fontSize: 52, color: '#A78BFA', lineHeight: 1 }}>{currency}{d.revenue}{unit}</div>
              <div className="font-semibold mt-1" style={{ fontSize: 20, color: 'rgba(148,163,184,0.6)' }}>{d.year} Target</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 px-20 py-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.15)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 26, fontWeight: 700, fill: 'rgba(148,163,184,0.7)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${currency}${v}${unit}`} tick={{ fontSize: 22, fill: 'rgba(148,163,184,0.5)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 12, color: '#fff' }}
              formatter={(v: any) => [`${currency}${v}${unit}`, 'Revenue']}
            />
            <Bar dataKey="revenue" radius={[8,8,0,0]} maxBarSize={160}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === data.length - 1 ? 'url(#grad)' : i === data.length - 2 ? 'rgba(124,58,237,0.7)' : 'rgba(124,58,237,0.4)'} />
              ))}
            </Bar>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {projected && (
        <div className="px-24 pb-6 flex items-center gap-2">
          <div className="w-6 h-px" style={{ background: '#A78BFA' }} />
          <span className="text-lg font-medium" style={{ color: 'rgba(148,163,184,0.5)' }}>Projected figures</span>
        </div>
      )}
    </div>
  )
}
