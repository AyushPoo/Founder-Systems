import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Milestone { date: string; label: string }
interface Props { headline?: string; milestones?: Milestone[]; slideIndex: number }

export function TimelineSlide({ headline, milestones = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const items = milestones.length ? milestones : [
    { date: 'Q1 2023', label: 'Founded & idea validated' },
    { date: 'Q3 2023', label: 'MVP launched, first 100 users' },
    { date: 'Q1 2024', label: '$50K MRR milestone' },
    { date: 'Q3 2024', label: 'Series A fundraise' },
    { date: 'Q1 2025', label: '100K users, profitable' },
  ]
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0D0D14' }}>
      <div className="px-24 pt-20 pb-12">
        <div className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: '#A78BFA' }}>Roadmap</div>
        <EditableText value={headline || 'The journey so far'} onChange={up('headline')} tag="h2"
          className="font-black text-white" style={{ fontSize: 72 }} />
      </div>
      <div className="flex-1 flex items-center px-24 pb-20">
        <div className="w-full relative">
          <div className="absolute left-0 right-0" style={{ top: 56, height: 3, background: 'linear-gradient(90deg,#7C3AED,rgba(124,58,237,0.15))' }} />
          <div className="flex justify-between">
            {items.map((m, i) => (
              <div key={i} className="flex flex-col items-center" style={{ flex: 1 }}>
                <div className="font-semibold mb-4 text-center" style={{ fontSize: 20, color: 'rgba(167,139,250,0.7)' }}>{m.date}</div>
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-white z-10 relative"
                     style={{ background: i < 3 ? 'linear-gradient(135deg,#7C3AED,#A78BFA)' : 'rgba(124,58,237,0.2)', border: '3px solid #7C3AED', fontSize: 22 }}>
                  {i < 3 ? '✓' : String(i + 1)}
                </div>
                <div className="mt-4 text-center font-semibold leading-snug"
                     style={{ fontSize: 20, color: i < 3 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)', maxWidth: 160 }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
