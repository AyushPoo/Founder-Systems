import { ExternalLink } from "lucide-react"
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Member { name: string; role: string; background: string; initials: string }
interface Props { headline?: string; members?: Member[]; slideIndex: number }

const GRAD = [
  'linear-gradient(135deg,#7C3AED,#4F46E5)',
  'linear-gradient(135deg,#0EA5E9,#7C3AED)',
  'linear-gradient(135deg,#D97706,#EF4444)',
  'linear-gradient(135deg,#10B981,#0EA5E9)',
]

export function TeamSlide({ headline, members = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const people = members.length ? members : [
    { name: 'Alex Chen', role: 'CEO & Co-founder', background: '10 yrs scaling B2B SaaS, prev VP Product @ Stripe', initials: 'AC' },
    { name: 'Jordan Kim', role: 'CTO & Co-founder', background: 'Built infra @ Google serving 1B users', initials: 'JK' },
    { name: 'Sam Rivera', role: 'Head of Growth', background: '0→$10M ARR at two prior startups', initials: 'SR' },
  ]
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      {/* Left panel */}
      <div className="w-80 shrink-0 flex flex-col justify-between px-16 py-20" style={{ background: '#06060a', borderRight: '1px solid #111' }}>
        <div>
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-8" style={{ color: '#A78BFA' }}>The Team</div>
          <EditableText value={headline || 'Operators, not academics'} onChange={up('headline')} tag="h2"
            className="font-display font-black text-white leading-tight"
            style={{ fontSize: 48, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        </div>
        <div className="font-display font-black" style={{ fontSize: 140, color: 'rgba(124,58,237,0.06)', lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {people.length}×
        </div>
      </div>
      {/* Right: members */}
      <div className="flex-1 flex flex-col justify-center gap-0">
        {people.map((m, i) => (
          <div key={i} className="flex items-center gap-8 px-16 py-9"
               style={{ borderBottom: i < people.length - 1 ? '1px solid #111' : 'none' }}>
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center font-display font-black text-white text-2xl"
                 style={{ background: GRAD[i % GRAD.length], fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {m.initials || m.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-black text-white mb-1" style={{ fontSize: 30, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{m.name}</div>
              <div className="font-semibold mb-2" style={{ fontSize: 18, color: '#7C3AED' }}>{m.role}</div>
              <div className="font-medium" style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{m.background}</div>
            </div>
            <ExternalLink size={20} color="rgba(255,255,255,0.15)" strokeWidth={1.5} className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
