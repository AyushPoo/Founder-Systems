import { Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Feature { title: string; description: string; icon?: string }
interface Props { headline?: string; features?: Feature[]; imageUrl?: string; layout?: string; slideIndex: number }
const ICONS = [Zap, Shield, TrendingUp]

function headlineSize(text: string) {
  const n = (text || '').length
  if (n <= 25) return 56; if (n <= 45) return 44; if (n <= 65) return 36; return 30
}

const DEFAULT_FEATURES = [
  { title: 'Built different', description: 'A fundamentally new approach that solves what others ignore' },
  { title: 'Instant value', description: 'Results from day one — no long onboarding cycles' },
  { title: 'Scales with you', description: 'From 10 users to 10 million without re-architecture' },
]

function SolutionFeatures({ headline, features, imageUrl, up }: any) {
  const items = features?.length ? features : DEFAULT_FEATURES
  const hl = headline || 'How we fix it'
  const fs = headlineSize(hl)
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      <div className="w-5/12 shrink-0 flex flex-col justify-between px-16 py-16 relative overflow-hidden" style={{ background: '#08001a', borderRight: '1px solid #1a0a3e' }}>
        {imageUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08 }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(76,29,149,0.96), rgba(8,0,26,0.99))' }} />
          </>
        )}
        <div className="relative z-10">
          <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-6" style={{ color: '#A78BFA' }}>The Solution</div>
          <EditableText value={hl} onChange={up('headline')} tag="h2" className="font-display font-black text-white"
            style={{ fontSize: fs, letterSpacing: '-1px', lineHeight: 1.1, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        </div>
        <div className="relative z-10">
          <div className="w-10 h-0.5 mb-5" style={{ background: '#7C3AED' }} />
          <div className="font-medium" style={{ fontSize: 16, color: 'rgba(167,139,250,0.45)', lineHeight: 1.7 }}>Built for founders who refuse to compromise.</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {items.map((f: Feature, i: number) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <div key={i} className="flex items-center gap-8 px-14 py-10" style={{ borderBottom: i < items.length - 1 ? '1px solid #111' : 'none' }}>
              <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Icon size={22} color="#A78BFA" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold mb-1.5" style={{ fontSize: 24, color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{f.title}</div>
                <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{f.description}</div>
              </div>
              <div className="font-display font-black tabular-nums shrink-0" style={{ fontSize: 60, color: 'rgba(124,58,237,0.06)', lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {String(i + 1).padStart(2, '0')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SolutionSteps({ headline, features, up }: any) {
  const items = features?.length ? features : DEFAULT_FEATURES
  const hl = headline || 'Three steps to transformation'
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
      <div className="px-20 pt-16 pb-0 shrink-0">
        <div className="text-xs font-semibold tracking-[0.35em] uppercase mb-3" style={{ color: '#A78BFA' }}>The Solution</div>
        <EditableText value={hl} onChange={up('headline')} tag="h2" className="font-display font-black text-white"
          style={{ fontSize: 44, letterSpacing: '-1.5px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
      </div>
      {/* Steps */}
      <div className="flex-1 flex items-center px-16 gap-0" style={{ marginTop: 32 }}>
        {items.slice(0, 3).map((f: Feature, i: number) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <div key={i} className="flex items-center flex-1">
              {/* Step card */}
              <div className="flex-1 flex flex-col px-12 py-12 relative" style={{ borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Step number */}
                <div className="font-display font-black mb-6" style={{ fontSize: 64, letterSpacing: '-3px', lineHeight: 1, color: 'rgba(124,58,237,0.25)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
                  <Icon size={20} color="#A78BFA" strokeWidth={1.5} />
                </div>
                <div className="font-display font-bold mb-3" style={{ fontSize: 26, color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{f.title}</div>
                <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{f.description}</div>
              </div>
              {/* Arrow connector */}
              {i < items.length - 1 && (
                <div className="flex items-center justify-center shrink-0 px-3">
                  <ArrowRight size={20} color="rgba(124,58,237,0.4)" strokeWidth={1.5} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SolutionCards({ headline, features, up }: any) {
  const items = features?.length ? features : DEFAULT_FEATURES
  const hl = headline || 'What we built'
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
      {/* Header */}
      <div className="flex items-end justify-between px-20 pt-16 pb-0 shrink-0">
        <div>
          <div className="text-xs font-semibold tracking-[0.35em] uppercase mb-3" style={{ color: '#A78BFA' }}>The Solution</div>
          <EditableText value={hl} onChange={up('headline')} tag="h2" className="font-display font-black text-white"
            style={{ fontSize: 52, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        </div>
        <div className="w-20 h-0.5 mb-4" style={{ background: 'linear-gradient(90deg, transparent, #7C3AED)' }} />
      </div>
      {/* Cards row */}
      <div className="flex-1 flex items-center gap-6 px-20" style={{ marginTop: 36, paddingBottom: 48 }}>
        {items.slice(0, 3).map((f: Feature, i: number) => {
          const Icon = ICONS[i % ICONS.length]
          const gradients = [
            'linear-gradient(135deg, #1a0a3e 0%, #0a0016 100%)',
            'linear-gradient(135deg, #0a1a0e 0%, #000a04 100%)',
            'linear-gradient(135deg, #1a1000 0%, #0a0800 100%)',
          ]
          const accents = ['#A78BFA', '#10B981', '#F59E0B']
          const borderColors = ['rgba(124,58,237,0.25)', 'rgba(16,185,129,0.2)', 'rgba(245,158,11,0.2)']
          return (
            <div key={i} className="flex-1 flex flex-col h-full rounded-2xl p-12 relative overflow-hidden"
              style={{ background: gradients[i], border: `1px solid ${borderColors[i]}` }}>
              {/* Faint number watermark */}
              <div className="absolute top-4 right-6 font-display font-black opacity-[0.06]"
                style={{ fontSize: 100, color: accents[i], lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {i + 1}
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
                style={{ background: `${accents[i]}15`, border: `1px solid ${accents[i]}30` }}>
                <Icon size={24} color={accents[i]} strokeWidth={1.5} />
              </div>
              <div className="font-display font-bold mb-4" style={{ fontSize: 28, color: '#fff', lineHeight: 1.2, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{f.title}</div>
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{f.description}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SolutionSlide({ headline, features = [], imageUrl, layout = 'features', slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const shared = { headline, features, imageUrl, up }
  if (layout === 'steps') return <SolutionSteps {...shared} />
  if (layout === 'cards') return <SolutionCards {...shared} />
  return <SolutionFeatures {...shared} />
}
