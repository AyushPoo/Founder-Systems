import { DollarSign, Users, Repeat2 } from 'lucide-react'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'
import { getTheme } from '../../constants/themes'

interface Stream { name: string; description: string; percentage: number }
interface Props { type?: string; headline?: string; streams?: Stream[]; slideIndex: number; deckStyle?: string }

const ICONS = [DollarSign, Users, Repeat2]

export function BusinessModelSlide({ type = 'SaaS', headline, streams = [], slideIndex, deckStyle }: Props) {
  const { dispatch } = useDeck()
  const t = getTheme(deckStyle)
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const items = streams.length ? streams : [
    { name: 'Subscription', description: 'Monthly/annual SaaS plans — $99–$999/mo per seat', percentage: 70 },
    { name: 'Usage-based', description: 'Pay-per-API call for high-volume enterprise customers', percentage: 20 },
    { name: 'Professional Services', description: 'Implementation, training, and custom integrations', percentage: 10 },
  ]
  const COLORS = [t.accent, t.accentLight, '#C4B5FD']
  return (
    <div className="w-full h-full flex" style={{ background: t.bg }}>
      {/* Left */}
      <div className="w-96 shrink-0 flex flex-col justify-between px-16 py-20"
        style={{ background: t.surface, borderRight: `1px solid ${t.border}` }}>
        <div>
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-8" style={{ color: t.accentLight }}>Business Model</div>
          <EditableText value={headline || 'How we make money'} onChange={up('headline')} tag="h2"
            className="font-display font-black leading-tight"
            style={{ fontSize: 52, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
        </div>
        <div className="px-5 py-4 rounded-2xl" style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}` }}>
          <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: t.textMuted }}>Model Type</div>
          <div className="font-display font-black" style={{ fontSize: 28, color: t.accent, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{type}</div>
        </div>
      </div>
      {/* Right */}
      <div className="flex-1 flex flex-col justify-center gap-0">
        {items.map((s, i) => {
          const Icon = ICONS[i % ICONS.length]
          const color = COLORS[i % COLORS.length]
          return (
            <div key={i} className="px-16 py-10" style={{ borderBottom: i < items.length - 1 ? `1px solid ${t.border}` : 'none' }}>
              <div className="flex items-center gap-5 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}` }}>
                  <Icon size={22} color={color} strokeWidth={1.5} />
                </div>
                <div className="font-display font-black" style={{ fontSize: 26, color: t.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{s.name}</div>
                <div className="ml-auto font-display font-black" style={{ fontSize: 32, color, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{s.percentage}%</div>
              </div>
              <div className="mb-4 font-medium" style={{ fontSize: 20, color: t.textSub, lineHeight: 1.5 }}>{s.description}</div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: t.border }}>
                <div className="h-full rounded-full" style={{ width: `${s.percentage}%`, background: `linear-gradient(to right, ${color}, ${t.accentBg})` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
