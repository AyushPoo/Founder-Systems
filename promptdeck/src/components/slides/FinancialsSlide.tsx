import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props { headline?: string; years?: number[]; revenue?: number[]; currency?: string; unit?: string; projected?: boolean; slideIndex: number }

export function FinancialsSlide({ headline, years = [2024, 2025, 2026], revenue = [0, 0, 0], currency = '$', unit = '', projected = true, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const data = years.map((yr, i) => ({ year: String(yr), revenue: revenue[i] ?? 0 }))
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <EditableText value={headline || 'Financial Projections'} onChange={up('headline')} tag="h2" className="text-7xl font-extrabold text-slate-900 mb-12" />
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="year" tick={{ fontSize: 28, fontWeight: 600, fill: '#64748B' }} />
            <YAxis tickFormatter={(v) => `${currency}${v}${unit}`} tick={{ fontSize: 24, fill: '#64748B' }} />
            <Tooltip formatter={(v: any) => [`${currency}${v}${unit}`, 'Revenue']} />
            <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={i === data.length - 1 ? '#A78BFA' : '#7C3AED'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {projected && <div className="text-2xl text-slate-400 mt-4">*Projected</div>}
    </div>
  )
}
