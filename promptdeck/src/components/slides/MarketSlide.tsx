import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface MarketItem { value: string; label: string }
interface Props { headline?: string; tam?: MarketItem; sam?: MarketItem; som?: MarketItem; slideIndex: number }

export function MarketSlide({ headline, tam, sam, som, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <EditableText value={headline || 'Market Opportunity'} onChange={up('headline')} tag="h2" className="text-7xl font-extrabold text-slate-900 mb-12" />
      <div className="flex items-center justify-center gap-16 flex-1">
        <div className="flex flex-col items-center justify-center rounded-full bg-purple-700 text-white"
             style={{ width: 400, height: 400 }}>
          <div className="text-5xl font-black">{tam?.value || '0B'}</div>
          <div className="text-2xl font-medium mt-2 opacity-80">{tam?.label || 'Total Market'}</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-full bg-purple-400 text-white"
             style={{ width: 300, height: 300 }}>
          <div className="text-4xl font-black">{sam?.value || 'B'}</div>
          <div className="text-xl font-medium mt-2 opacity-80">{sam?.label || 'Serviceable'}</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-full bg-purple-200 text-purple-900"
             style={{ width: 220, height: 220 }}>
          <div className="text-3xl font-black">{som?.value || '00M'}</div>
          <div className="text-lg font-medium mt-2 opacity-80">{som?.label || 'Obtainable'}</div>
        </div>
      </div>
    </div>
  )
}
