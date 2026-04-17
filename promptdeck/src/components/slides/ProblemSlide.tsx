import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface PainPoint { icon?: string; text: string }
interface Props { headline?: string; pain_points?: PainPoint[]; slideIndex: number }

export function ProblemSlide({ headline, pain_points = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <EditableText value={headline || 'The Problem'} onChange={up('headline')} tag="h2"
        className="text-7xl font-extrabold text-slate-900 mb-12" />
      <div className="flex flex-col gap-6 flex-1">
        {(pain_points.length ? pain_points : [{ icon: '⚡', text: 'Key pain point here' }]).map((p, i) => (
          <div key={i} className="flex items-center gap-8 bg-white rounded-2xl p-10 border-2 border-slate-200">
            <span className="text-5xl">{p.icon || '⚡'}</span>
            <span className="text-3xl font-medium text-slate-800">{p.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
