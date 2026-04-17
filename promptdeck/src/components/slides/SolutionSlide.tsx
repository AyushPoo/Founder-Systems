import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Feature { title: string; description: string }
interface Props { headline?: string; features?: Feature[]; slideIndex: number }

export function SolutionSlide({ headline, features = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const defaultFeatures = [{ title: 'Feature One', description: 'Description of the first key feature' }, { title: 'Feature Two', description: 'Description of the second key feature' }, { title: 'Feature Three', description: 'Description of the third key feature' }]
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <EditableText value={headline || 'Our Solution'} onChange={up('headline')} tag="h2"
        className="text-7xl font-extrabold text-slate-900 mb-12" />
      <div className="grid grid-cols-3 gap-8 flex-1">
        {(features.length ? features : defaultFeatures).map((f, i) => (
          <div key={i} className="bg-white rounded-3xl p-12 border-2 border-slate-200 flex flex-col">
            <div className="text-4xl font-bold text-slate-900 mb-4">{f.title}</div>
            <div className="text-2xl text-slate-500 leading-relaxed">{f.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
