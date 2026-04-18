import { AlertTriangle, TrendingDown, Zap } from 'lucide-react'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface PainPoint { icon?: string; text: string }
interface Props { headline?: string; pain_points?: PainPoint[]; stat?: { value: string; label: string }; imageUrl?: string; slideIndex: number }

const ICONS = [AlertTriangle, TrendingDown, Zap]

export function ProblemSlide({ headline, pain_points = [], stat, imageUrl, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const points = pain_points.length ? pain_points : [
    { text: 'Current solutions are fragmented and expensive' },
    { text: 'The market is underserved and growing fast' },
    { text: 'Every day of inaction compounds the cost' },
  ]
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      {/* Left: content */}
      <div className="flex-1 flex flex-col justify-center px-24 py-20 relative">
        <div className="absolute top-0 left-0 bottom-0 w-1" style={{ background: '#EF4444' }} />
        <div className="mb-10">
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-6" style={{ color: '#EF4444' }}>The Problem</div>
          <EditableText value={headline || 'Something is fundamentally broken'} onChange={up('headline')} tag="h2"
            className="font-display font-black text-white leading-tight"
            style={{ fontSize: 68, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        </div>
        <div className="flex flex-col gap-8">
          {points.map((p, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div key={i} className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center mt-1"
                     style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Icon size={22} color="#EF4444" strokeWidth={1.5} />
                </div>
                <div className="font-medium" style={{ fontSize: 26, lineHeight: 1.5, color: 'rgba(255,255,255,0.75)' }}>
                  {p.text}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Right: impact stat */}
      <div className="w-2/5 shrink-0 flex flex-col items-center justify-center relative overflow-hidden"
           style={{ background: '#0A0000', borderLeft: '1px solid #1a0000' }}>
        {imageUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0a0000, rgba(10,0,0,0.8))' }} />
          </>
        )}
        <div className="relative z-10 text-center px-12">
          <EditableText value={stat?.value || '$500B'} onChange={(v) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: 'stat', value: { ...(stat || {}), value: v } } })}
            className="font-display font-black leading-none"
            style={{ fontSize: 96, letterSpacing: '-4px', color: '#EF4444', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
          <div className="mt-4 font-medium" style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
            {stat?.label || 'annual cost of the problem'}
          </div>
        </div>
      </div>
    </div>
  )
}
