import { ExternalLink } from "lucide-react"
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'
import { getTheme } from '../../constants/themes'

interface Member { name: string; role: string; background: string; initials: string; photoUrl?: string }
interface Props { headline?: string; members?: Member[]; slideIndex: number; deckStyle?: string }

const GRAD = [
  'linear-gradient(135deg,#7C3AED,#4F46E5)',
  'linear-gradient(135deg,#0EA5E9,#7C3AED)',
  'linear-gradient(135deg,#D97706,#EF4444)',
  'linear-gradient(135deg,#10B981,#0EA5E9)',
]

function MemberAvatar({ member, index }: { member: Member; index: number }) {
  if (member.photoUrl) {
    return (
      <div className="w-20 h-20 rounded-2xl shrink-0 overflow-hidden" style={{ border: '2px solid rgba(124,58,237,0.3)' }}>
        <img
          src={member.photoUrl}
          alt={member.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>
    )
  }
  // Gradient initials fallback
  return (
    <div className="w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center font-display font-black text-white text-2xl"
       style={{ background: GRAD[index % GRAD.length], fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      {member.initials || member.name.split(' ').map((n: string) => n[0]).join('')}
    </div>
  )
}

export function TeamSlide({ headline, members = [], slideIndex, deckStyle }: Props) {
  const { dispatch } = useDeck()
  const t = getTheme(deckStyle)
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const people = members.length ? members : [
    { name: 'Alex Chen', role: 'CEO & Co-founder', background: '10 yrs scaling B2B SaaS, prev VP Product @ Stripe', initials: 'AC' },
    { name: 'Jordan Kim', role: 'CTO & Co-founder', background: 'Built infra @ Google serving 1B users', initials: 'JK' },
    { name: 'Sam Rivera', role: 'Head of Growth', background: '0→$10M ARR at two prior startups', initials: 'SR' },
  ]

  const leftBg = t.isDark ? '#06060a' : t.surfaceAlt
  const leftBorder = t.isDark ? '#111' : t.border
  const rowBorder = t.isDark ? '#111' : t.border
  const labelColor = t.accentLight
  const headlineColor = t.text
  const roleColor = t.accent
  const bgColor = t.isDark ? '#000' : t.bg
  const memberBgColor = t.isDark ? '#0a0a12' : t.surface

  return (
    <div className="w-full h-full flex" style={{ background: bgColor }}>
      {/* Left panel */}
      <div className="w-80 shrink-0 flex flex-col justify-between px-16 py-20" style={{ background: leftBg, borderRight: `1px solid ${leftBorder}` }}>
        <div>
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-8" style={{ color: labelColor }}>The Team</div>
          <EditableText value={headline || 'Operators, not academics'} onChange={up('headline')} tag="h2"
            className="font-display font-black leading-tight"
            style={{ fontSize: 48, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif", color: headlineColor }} />
        </div>
        <div className="font-display font-black" style={{ fontSize: 140, color: `${t.accent}0F`, lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          {people.length}×
        </div>
      </div>
      {/* Right: members */}
      <div className="flex-1 flex flex-col justify-center gap-0">
        {people.map((m, i) => (
          <div key={i} className="flex items-center gap-8 px-16 py-9"
               style={{ background: i % 2 === 0 ? 'transparent' : memberBgColor, borderBottom: i < people.length - 1 ? `1px solid ${rowBorder}` : 'none' }}>
            <MemberAvatar member={m} index={i} />
            <div className="flex-1 min-w-0">
              <div className="font-display font-black mb-1" style={{ fontSize: 30, fontFamily: "'Bricolage Grotesque', sans-serif", color: headlineColor }}>{m.name}</div>
              <div className="font-semibold mb-2" style={{ fontSize: 18, color: roleColor }}>{m.role}</div>
              <div className="font-medium" style={{ fontSize: 20, color: t.textMuted, lineHeight: 1.4 }}>{m.background}</div>
            </div>
            <ExternalLink size={20} color={t.isDark ? 'rgba(255,255,255,0.15)' : t.border} strokeWidth={1.5} className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
