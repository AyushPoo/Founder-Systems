import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface UseOfFunds { label: string; percentage: number }
interface Props { headline?: string; amount?: string; currency?: string; use_of_funds?: UseOfFunds[]; runway_months?: number; slideIndex: number }

const COLORS = ['#7C3AED', '#A78BFA', '#C4B5FD', '#4F46E5']

export function AskSlide({ headline, amount = '$2.5M', currency = 'USD', use_of_funds = [], runway_months = 18, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const funds = use_of_funds.length ? use_of_funds : [
    { label: 'Product & Engineering', percentage: 45 },
    { label: 'Sales & Marketing', percentage: 30 },
    { label: 'Operations', percentage: 15 },
    { label: 'Reserve', percentage: 10 },
  ]
  const pieData = funds.map(f => ({ name: f.label, value: f.percentage }))
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      {/* Left: funding ask */}
      <div className="flex-1 flex flex-col justify-center px-24 py-20" style={{ borderRight: '1px solid #111' }}>
        <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-8" style={{ color: '#A78BFA' }}>The Ask</div>
        <EditableText value={headline || 'Raising our Seed Round'} onChange={up('headline')} tag="h2"
          className="font-display font-black text-white mb-12 leading-tight"
          style={{ fontSize: 56, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        <EditableText value={amount} onChange={up('amount')} tag="div"
          className="font-display font-black text-white leading-none mb-8"
          style={{ fontSize: 120, letterSpacing: '-6px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        <div className="flex items-center gap-3 mb-2">
          <div className="font-medium" style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)' }}>Currency</div>
          <div className="font-semibold" style={{ fontSize: 20, color: '#A78BFA' }}>{currency}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-medium" style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)' }}>Runway</div>
          <div className="font-semibold" style={{ fontSize: 20, color: '#10B981' }}>{runway_months} months</div>
        </div>
      </div>
      {/* Right: use of funds */}
      <div className="w-5/12 shrink-0 flex flex-col justify-center px-16 py-20">
        <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-8" style={{ color: 'rgba(255,255,255,0.25)' }}>Use of Funds</div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={130} dataKey="value" strokeWidth={2} stroke="#000">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-4 mt-6">
          {funds.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <div className="flex-1 font-medium" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>{f.label}</div>
              <div className="font-display font-bold" style={{ fontSize: 18, color: COLORS[i % COLORS.length], fontFamily: "'Bricolage Grotesque', sans-serif" }}>{f.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
