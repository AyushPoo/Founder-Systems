import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface FundItem { label: string; percentage: number }
interface Props { headline?: string; amount?: string; currency?: string; use_of_funds?: FundItem[]; runway_months?: number; slideIndex: number }

const COLORS = ['#7C3AED','#A78BFA','#C4B5FD','#DDD6FE','#4C1D95']

export function AskSlide({ headline, amount = '1M', currency = '$', use_of_funds = [], runway_months, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const funds = use_of_funds.length ? use_of_funds : [
    { label: 'Engineering', percentage: 50 },
    { label: 'Marketing', percentage: 30 },
    { label: 'Operations', percentage: 20 },
  ]
  const pieData = funds.map(f => ({ name: f.label, value: f.percentage }))
  return (
    <div className="w-full h-full flex overflow-hidden" style={{ background: '#0A0F1E' }}>
      {/* Left: the ask */}
      <div className="flex-1 flex flex-col justify-center px-20" style={{ borderRight: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="text-sm font-bold tracking-widest uppercase mb-6" style={{ color: '#A78BFA' }}>The Ask</div>
        <EditableText value={headline || 'Join us'} onChange={up('headline')} tag="h2"
          className="font-black text-white mb-8" style={{ fontSize: 68 }} />
        <div className="flex items-baseline gap-3 mb-6">
          <span className="font-black" style={{ fontSize: 40, color: 'rgba(167,139,250,0.7)' }}>{currency}</span>
          <EditableText value={amount} onChange={up('amount')} tag="span"
            className="font-black" style={{ fontSize: 120, color: '#fff', lineHeight: 1, letterSpacing: '-4px' }} />
        </div>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.3)' }} />
        </div>
        {runway_months && (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xl"
                 style={{ background: 'rgba(124,58,237,0.3)' }}>↗</div>
            <div>
              <div className="font-black text-white" style={{ fontSize: 28 }}>{runway_months} months</div>
              <div className="font-medium" style={{ fontSize: 18, color: 'rgba(148,163,184,0.6)' }}>runway to profitability</div>
            </div>
          </div>
        )}
      </div>
      {/* Right: use of funds */}
      <div className="flex-1 flex flex-col justify-center px-16">
        <div className="text-sm font-bold tracking-widest uppercase mb-8" style={{ color: 'rgba(167,139,250,0.6)' }}>Use of Funds</div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="45%" cy="50%" innerRadius={80} outerRadius={140} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10, color: '#fff' }}
                formatter={(v: any) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          {funds.map((f, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <div className="flex-1 font-semibold text-white" style={{ fontSize: 22 }}>{f.label}</div>
              <div className="font-black" style={{ fontSize: 22, color: COLORS[i % COLORS.length] }}>{f.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
