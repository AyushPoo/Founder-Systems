import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Stream { name: string; description: string; percentage?: number }
interface Props { headline?: string; type?: string; streams?: Stream[]; slideIndex: number }

export function BusinessModelSlide({ headline, type, streams = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const items = streams.length ? streams : [
    { name: 'Subscription', description: 'Monthly SaaS recurring revenue from SMB customers', percentage: 65 },
    { name: 'Usage-Based', description: 'Pay per API call or transaction volume', percentage: 25 },
    { name: 'Enterprise', description: 'Annual contracts with custom onboarding tiers', percentage: 10 },
  ]
  return (
    <div className="w-full h-full flex overflow-hidden" style={{ background: '#F8F7FF' }}>
      <div className="w-80 shrink-0 flex flex-col justify-center px-14" style={{ background: 'linear-gradient(160deg,#0A0F1E,#1a0a3e)' }}>
        <div className="text-sm font-bold tracking-widest uppercase mb-6" style={{ color: '#A78BFA' }}>Business Model</div>
        <EditableText value={headline || 'How we make money'} onChange={up('headline')} tag="h2"
          className="font-black text-white leading-tight mb-8" style={{ fontSize: 48 }} />
        {type && (
          <div className="px-5 py-3 rounded-xl font-bold self-start" style={{ fontSize: 22, background: 'rgba(124,58,237,0.3)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.5)' }}>
            {type}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center px-20 gap-10">
        {items.map((s, i) => (
          <div key={i}>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="font-black text-slate-900" style={{ fontSize: 30 }}>{s.name}</div>
                <div className="font-medium text-slate-500 mt-1" style={{ fontSize: 20 }}>{s.description}</div>
              </div>
              {s.percentage != null && (
                <div className="font-black" style={{ fontSize: 44, color: '#7C3AED' }}>{s.percentage}%</div>
              )}
            </div>
            {s.percentage != null && (
              <div className="h-3 rounded-full" style={{ background: 'rgba(124,58,237,0.1)' }}>
                <div className="h-3 rounded-full transition-all" style={{ width: `${s.percentage}%`, background: 'linear-gradient(90deg,#7C3AED,#A78BFA)' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
