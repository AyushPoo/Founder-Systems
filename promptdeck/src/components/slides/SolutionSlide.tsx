import { Zap, Shield, TrendingUp } from 'lucide-react'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Feature { title: string; description: string; icon?: string }
interface Props { headline?: string; features?: Feature[]; imageUrl?: string; slideIndex: number }

const ICONS = [Zap, Shield, TrendingUp]

export function SolutionSlide({ headline, features = [], imageUrl, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const items = features.length ? features : [
    { title: 'Built different', description: 'A fundamentally new approach that solves what others ignore' },
    { title: 'Instant value', description: 'Results from day one — no long onboarding cycles' },
    { title: 'Scales with you', description: 'From 10 users to 10 million without re-architecture' },
  ]
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      {/* Left: headline panel */}
      <div className="w-2/5 shrink-0 flex flex-col justify-between px-20 py-20 relative overflow-hidden"
           style={{ background: '#08001a', borderRight: '1px solid #1a0a3e' }}>
        {imageUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.1 }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(76,29,149,0.95), rgba(8,0,26,0.98))' }} />
          </>
        )}
        <div className="relative z-10">
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-8" style={{ color: '#A78BFA' }}>The Solution</div>
          <EditableText value={headline || 'How we fix it'} onChange={up('headline')} tag="h2"
            className="font-display font-black text-white leading-tight"
            style={{ fontSize: 64, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        </div>
        <div className="relative z-10">
          <div className="w-12 h-1 mb-6" style={{ background: '#7C3AED' }} />
          <div className="font-medium" style={{ fontSize: 18, color: 'rgba(167,139,250,0.5)', lineHeight: 1.7 }}>
            Built for founders who refuse to compromise.
          </div>
        </div>
      </div>
      {/* Right: features */}
      <div className="flex-1 flex flex-col justify-center gap-0">
        {items.map((f, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <div key={i} className="flex items-center gap-10 px-16 py-11"
                 style={{ borderBottom: i < items.length - 1 ? '1px solid #111' : 'none' }}>
              <div className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center"
                   style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Icon size={24} color="#A78BFA" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="font-display font-black mb-2" style={{ fontSize: 30, color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{f.title}</div>
                <div className="font-medium" style={{ fontSize: 22, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{f.description}</div>
              </div>
              <div className="font-display font-black tabular-nums shrink-0" style={{ fontSize: 80, color: 'rgba(124,58,237,0.07)', lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {String(i + 1).padStart(2, '0')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
