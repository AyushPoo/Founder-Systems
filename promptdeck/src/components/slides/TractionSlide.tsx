import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Metric { value: string; label: string; growth?: string }
interface Props { headline?: string; metrics?: Metric[]; slideIndex: number }

export function TractionSlide({ headline, metrics = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const defaults = [{ value: '10K', label: 'Users', growth: '40% MoM' }, { value: 'K', label: 'MRR', growth: '25% MoM' }, { value: '94%', label: 'Retention' }]
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <EditableText value={headline || 'Traction'} onChange={up('headline')} tag="h2" className="text-7xl font-extrabold text-slate-900 mb-12" />
      <div className="grid grid-cols-3 gap-8 flex-1">
        {(metrics.length ? metrics : defaults).map((m, i) => (
          <div key={i} className="bg-white rounded-3xl p-16 border-2 border-slate-200 flex flex-col items-center justify-center">
            <div className="text-8xl font-black text-purple-700">{m.value}</div>
            <div className="text-3xl text-slate-500 mt-4 font-medium">{m.label}</div>
            {m.growth && <div className="text-2xl text-emerald-500 mt-2">&uarr; {m.growth}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
