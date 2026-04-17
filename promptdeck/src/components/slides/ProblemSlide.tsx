import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface PainPoint { icon?: string; text: string }
interface Props { headline?: string; pain_points?: PainPoint[]; slideIndex: number }

export function ProblemSlide({ headline, pain_points = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const points = pain_points.length ? pain_points : [{ text: 'The status quo is broken and expensive' }, { text: 'Existing solutions miss the point entirely' }, { text: 'The cost of inaction keeps compounding' }]
  return (
    <div className="w-full h-full flex overflow-hidden" style={{ background: '#0A0F1E' }}>
      {/* Left accent bar */}
      <div className="w-3 shrink-0" style={{ background: 'linear-gradient(180deg, #EF4444, #7C3AED)' }} />
      <div className="flex-1 flex flex-col justify-center px-24 py-20 relative">
        {/* Background number */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 font-black select-none pointer-events-none"
             style={{ fontSize: 400, color: 'rgba(239,68,68,0.04)', lineHeight: 1 }}>!</div>
        <div className="relative z-10">
          <div className="text-xl font-bold tracking-[0.25em] uppercase mb-6" style={{ color: '#EF4444' }}>The Problem</div>
          <EditableText value={headline || 'Something is fundamentally broken'} onChange={up('headline')} tag="h2"
            className="font-black text-white mb-16 leading-tight" style={{ fontSize: 72 }} />
          <div className="flex flex-col gap-8">
            {points.map((p, i) => (
              <div key={i} className="flex items-start gap-8">
                <div className="shrink-0 font-black tabular-nums" style={{ fontSize: 64, color: 'rgba(239,68,68,0.25)', lineHeight: 1, width: 80 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 font-semibold text-white pt-2" style={{ fontSize: 34, lineHeight: 1.4, color: 'rgba(255,255,255,0.85)' }}>
                  {p.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
