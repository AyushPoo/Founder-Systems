import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface PainPoint { icon?: string; text: string }
interface Props { headline?: string; pain_points?: PainPoint[]; imageUrl?: string; slideIndex: number }

export function ProblemSlide({ headline, pain_points = [], imageUrl, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const points = pain_points.length ? pain_points : [
    { icon: '⚡', text: 'The status quo is broken and expensive' },
    { icon: '🔄', text: 'Existing solutions miss the point entirely' },
    { icon: '📈', text: 'The cost of inaction keeps compounding' }
  ]
  return (
    <div className="w-full h-full flex overflow-hidden" style={{ background: '#0A0F1E' }}>
      {/* Left: content */}
      <div className="flex-1 flex flex-col justify-center px-20 py-20 relative">
        <div className="absolute right-8 top-1/2 -translate-y-1/2 font-black select-none pointer-events-none"
             style={{ fontSize: 360, color: 'rgba(239,68,68,0.04)', lineHeight: 1 }}>!</div>
        <div className="relative z-10">
          <div className="text-xl font-bold tracking-[0.25em] uppercase mb-6 flex items-center gap-3" style={{ color: '#EF4444' }}>
            <div className="w-8 h-px" style={{ background: '#EF4444' }} />
            The Problem
          </div>
          <EditableText value={headline || 'Something is fundamentally broken'} onChange={up('headline')} tag="h2"
            className="font-black text-white mb-14 leading-tight" style={{ fontSize: 64 }} />
          <div className="flex flex-col gap-7">
            {points.map((p, i) => (
              <div key={i} className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-2xl"
                     style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {p.icon || ['⚡','🔄','📈'][i] || '•'}
                </div>
                <div className="flex-1 font-semibold text-white pt-3" style={{ fontSize: 28, lineHeight: 1.4, color: 'rgba(255,255,255,0.85)' }}>
                  {p.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right: image panel */}
      <div className="w-2/5 shrink-0 relative overflow-hidden" style={{ borderLeft: '1px solid rgba(239,68,68,0.15)' }}>
        {imageUrl ? (
          <>
            <div className="absolute inset-0" style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(10,15,30,0.6) 0%, rgba(10,15,30,0.2) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(124,58,237,0.08))' }}>
            <div className="font-black" style={{ fontSize: 180, color: 'rgba(239,68,68,0.12)', lineHeight: 1 }}>?</div>
          </div>
        )}
        {/* Stat overlay */}
        <div className="absolute bottom-10 left-10 right-10">
          <div className="rounded-2xl px-8 py-6" style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="font-black text-white mb-1" style={{ fontSize: 48 }}>$3.2T</div>
            <div className="font-medium" style={{ fontSize: 20, color: 'rgba(239,68,68,0.8)' }}>annual cost of the problem</div>
          </div>
        </div>
      </div>
    </div>
  )
}
