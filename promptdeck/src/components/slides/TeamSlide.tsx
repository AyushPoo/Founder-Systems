import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Member { name: string; role: string; background?: string; initials?: string }
interface Props { headline?: string; members?: Member[]; slideIndex: number }

export function TeamSlide({ headline, members = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const defaults = [
    { name: 'Jane Smith', role: 'CEO & Co-founder', background: '10 years in fintech', initials: 'JS' },
    { name: 'Bob Lee', role: 'CTO & Co-founder', background: 'Ex-Google, Stanford CS', initials: 'BL' },
    { name: 'Sara Chen', role: 'Head of Growth', background: 'Ex-Stripe, 0→1M users', initials: 'SC' },
  ]
  const team = members.length ? members : defaults
  const gradients = [
    'linear-gradient(135deg,#7C3AED,#A78BFA)',
    'linear-gradient(135deg,#0EA5E9,#38BDF8)',
    'linear-gradient(135deg,#F59E0B,#FCD34D)',
    'linear-gradient(135deg,#EF4444,#F87171)',
  ]
  return (
    <div className="w-full h-full flex overflow-hidden" style={{ background: '#F8F7FF' }}>
      <div className="w-72 shrink-0 flex flex-col justify-center px-14" style={{ background: 'linear-gradient(160deg,#0A0F1E,#1a0a3e)' }}>
        <div className="text-sm font-bold tracking-widest uppercase mb-6" style={{ color: '#A78BFA' }}>The Team</div>
        <EditableText value={headline || 'Built by people who get it'} onChange={up('headline')} tag="h2"
          className="font-black text-white leading-tight" style={{ fontSize: 44 }} />
        <div className="mt-10 font-medium" style={{ fontSize: 18, color: 'rgba(148,163,184,0.6)', lineHeight: 1.7 }}>
          Domain expertise. Operator experience. Ready to execute.
        </div>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-0">
        {team.map((m, i) => (
          <div key={i} className="flex flex-col items-center justify-center p-12"
               style={{ borderRight: i < team.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
            <div className="w-28 h-28 rounded-2xl flex items-center justify-center font-black text-white text-4xl mb-6 shadow-lg"
                 style={{ background: gradients[i % gradients.length] }}>
              {m.initials || m.name?.[0] || '?'}
            </div>
            <div className="font-black text-slate-900 text-center mb-1" style={{ fontSize: 30 }}>{m.name}</div>
            <div className="font-bold text-center mb-3" style={{ fontSize: 20, color: '#7C3AED' }}>{m.role}</div>
            {m.background && (
              <div className="px-4 py-2 rounded-lg text-center font-medium"
                   style={{ fontSize: 18, background: 'rgba(124,58,237,0.08)', color: '#4C1D95' }}>
                {m.background}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
