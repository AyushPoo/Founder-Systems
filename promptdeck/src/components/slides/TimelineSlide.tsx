import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Milestone { date: string; label: string }
interface Props { headline?: string; milestones?: Milestone[]; slideIndex: number }

export function TimelineSlide({ headline, milestones = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const defaults = [{ date: 'Q1 2024', label: 'Founded' }, { date: 'Q3 2024', label: 'Beta Launch' }, { date: 'Q1 2025', label: '1K Users' }, { date: 'Q3 2025', label: 'Series A' }]
  const items = milestones.length ? milestones : defaults
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <EditableText value={headline || 'Roadmap'} onChange={up('headline')} tag="h2" className="text-7xl font-extrabold text-slate-900 mb-16" />
      <div className="relative flex-1 flex items-center">
        <div className="absolute top-1/3 left-0 right-0 h-1 bg-purple-600 rounded" />
        <div className="flex justify-between w-full">
          {items.map((m, i) => (
            <div key={i} className="flex flex-col items-center" style={{ width: `${100 / items.length}%` }}>
              <div className="text-2xl font-bold text-purple-700 mb-3">{m.date}</div>
              <div className="w-14 h-14 rounded-full bg-purple-700 border-4 border-white shadow-lg mb-3" />
              <div className="text-2xl text-slate-700 text-center font-medium">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
