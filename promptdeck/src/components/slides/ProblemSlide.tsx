import { AlertTriangle, TrendingDown, Zap } from 'lucide-react'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface PainPoint { icon?: string; text: string }
interface Props { headline?: string; pain_points?: PainPoint[]; stat?: { value: string; label: string }; imageUrl?: string; slideIndex: number }

const ICONS = [AlertTriangle, TrendingDown, Zap]

function headlineSize(text: string) {
  const n = (text || '').length
  if (n <= 25) return 60
  if (n <= 45) return 46
  if (n <= 65) return 36
  return 30
}

export function ProblemSlide({ headline, pain_points = [], stat, imageUrl, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const points = pain_points.length ? pain_points : [
    { text: 'Current solutions are fragmented and expensive' },
    { text: 'The market is underserved and growing fast' },
    { text: 'Every day of inaction compounds the cost' },
  ]
  const hl = headline || 'Something is fundamentally broken'
  const fs = headlineSize(hl)
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      {/* Left */}
      <div className="flex-1 flex flex-col justify-center px-20 py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-0.5" style={{ background: '#EF4444' }} />
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-5" style={{ color: '#EF4444' }}>The Problem</div>
          <EditableText value={hl} onChange={up('headline')} tag="h2"
            className="font-display font-black text-white"
            style={{ fontSize: fs, letterSpacing: '-1px', lineHeight: 1.1, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        </div>
        <div className="flex flex-col gap-6">
          {points.map((p, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div key={i} className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                     style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Icon size={18} color="#EF4444" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 22, lineHeight: 1.55, color: 'rgba(255,255,255,0.65)' }}>{p.text}</div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Right: stat */}
      <div className="w-5/12 shrink-0 flex flex-col items-center justify-center relative overflow-hidden"
           style={{ background: '#0A0000', borderLeft: '1px solid #1a0000' }}>
        {imageUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12 }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0a0000, rgba(10,0,0,0.85))' }} />
          </>
        )}
        <div className="relative z-10 text-center px-10">
          <EditableText
            value={stat?.value || '$500B'}
            onChange={(v) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: 'stat', value: { ...(stat || {}), value: v } } })}
            className="font-display font-black leading-none"
            style={{ fontSize: 88, letterSpacing: '-3px', color: '#EF4444', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
          <div className="mt-4 font-medium" style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
            {stat?.label || 'annual cost of the problem'}
          </div>
        </div>
      </div>
    </div>
  )
}
