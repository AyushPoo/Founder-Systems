import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface MarketItem { value: string; label: string }
interface Props { headline?: string; tam?: MarketItem; sam?: MarketItem; som?: MarketItem; slideIndex: number }

export function MarketSlide({ headline, tam, sam, som, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const updateNested = (field: 'tam' | 'sam' | 'som', key: 'value' | 'label', val: string) => {
    const current = field === 'tam' ? tam : field === 'sam' ? sam : som
    dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: field, value: { ...current, [key]: val } } })
  }
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-24">
      <EditableText value={headline || 'Market Opportunity'} onChange={up('headline')} tag="h2" className="text-7xl font-extrabold text-slate-900 mb-12" />
      <div className="flex items-center justify-center gap-16 flex-1">
        <div className="flex flex-col items-center justify-center rounded-full bg-purple-700 text-white"
             style={{ width: 400, height: 400 }}>
          <EditableText value={tam?.value || '$50B'} onChange={(v) => updateNested('tam', 'value', v)} className="text-5xl font-black" />
          <EditableText value={tam?.label || 'Total Market'} onChange={(v) => updateNested('tam', 'label', v)} className="text-2xl font-medium mt-2 opacity-80" />
        </div>
        <div className="flex flex-col items-center justify-center rounded-full bg-purple-400 text-white"
             style={{ width: 300, height: 300 }}>
          <EditableText value={sam?.value || '$10B'} onChange={(v) => updateNested('sam', 'value', v)} className="text-4xl font-black" />
          <EditableText value={sam?.label || 'Serviceable'} onChange={(v) => updateNested('sam', 'label', v)} className="text-xl font-medium mt-2 opacity-80" />
        </div>
        <div className="flex flex-col items-center justify-center rounded-full bg-purple-200 text-purple-900"
             style={{ width: 220, height: 220 }}>
          <EditableText value={som?.value || '$500M'} onChange={(v) => updateNested('som', 'value', v)} className="text-3xl font-black" />
          <EditableText value={som?.label || 'Obtainable'} onChange={(v) => updateNested('som', 'label', v)} className="text-lg font-medium mt-2 opacity-80" />
        </div>
      </div>
    </div>
  )
}
