import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface FundItem { label: string; percentage: number }
interface Props { headline?: string; amount?: string; currency?: string; use_of_funds?: FundItem[]; runway_months?: number; slideIndex: number }

const COLORS = ['#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE']

export function AskSlide({ headline, amount = '1M', currency = '$', use_of_funds = [], runway_months, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const defaults = [{ label: 'Engineering', percentage: 50 }, { label: 'Marketing', percentage: 30 }, { label: 'Operations', percentage: 20 }]
  const funds = use_of_funds.length ? use_of_funds : defaults
  const pieData = funds.map(f => ({ name: f.label, value: f.percentage }))
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <EditableText value={headline || 'The Ask'} onChange={up('headline')} tag="h2" className="text-7xl font-extrabold text-slate-900 mb-4" />
      <div className="text-9xl font-black text-purple-700 mb-4">{currency}{amount}</div>
      {runway_months && <div className="text-3xl text-slate-500 mb-8">{runway_months} months runway</div>}
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 300 }}>
        <ResponsiveContainer width="70%" height={320}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} dataKey="value"
                 label={({ name, value }) => `${name}: ${value}%`} labelLine>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: any) => [`${v}%`, 'Allocation']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
