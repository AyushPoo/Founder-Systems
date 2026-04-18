import { CheckCircle2, Circle } from 'lucide-react'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Milestone { label: string; date: string; done?: boolean }
interface Props { headline?: string; milestones?: Milestone[]; slideIndex: number }

export function TimelineSlide({ headline, milestones = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const items: Milestone[] = milestones.length ? milestones : [
    { label: 'Founded & MVP', date: 'Q1 2023', done: true },
    { label: 'First 100 Customers', date: 'Q3 2023', done: true },
    { label: '$1M ARR', date: 'Q1 2024', done: true },
    { label: 'Series A Close', date: 'Q3 2024', done: false },
    { label: 'International Expansion', date: 'Q1 2025', done: false },
  ]
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
      <div className="px-24 pt-20 pb-16 shrink-0">
        <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-4" style={{ color: '#A78BFA' }}>Roadmap</div>
        <EditableText value={headline || 'From zero to category leader'} onChange={up('headline')} tag="h2"
          className="font-display font-black text-white"
          style={{ fontSize: 64, letterSpacing: '-3px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
      </div>
      <div className="flex-1 flex items-center px-24 pb-20 relative">
        {/* Timeline line */}
        <div className="absolute left-24 right-24 top-1/2 -translate-y-1/2 h-px" style={{ background: 'linear-gradient(to right, #7C3AED, rgba(124,58,237,0.1))' }} />
        <div className="w-full flex items-start justify-between relative z-10">
          {items.map((m, i) => {
            const done = m.done ?? i < 3
            return (
              <div key={i} className="flex flex-col items-center" style={{ width: `${100 / items.length}%` }}>
                <div className="mb-4">
                  {done ? (
                    <CheckCircle2 size={32} color="#7C3AED" fill="#7C3AED" strokeWidth={1.5} />
                  ) : (
                    <Circle size={32} color="rgba(124,58,237,0.4)" strokeWidth={1.5} />
                  )}
                </div>
                <div className="text-center px-2">
                  <div className="font-semibold mb-1" style={{ fontSize: 20, color: done ? '#fff' : 'rgba(255,255,255,0.35)' }}>{m.label}</div>
                  <div className="font-medium" style={{ fontSize: 16, color: done ? '#7C3AED' : 'rgba(255,255,255,0.2)' }}>{m.date}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
