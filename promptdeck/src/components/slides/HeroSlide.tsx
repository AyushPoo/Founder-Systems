import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props { company_name: string; tagline: string; stage: string; year: number | string; slideIndex: number }

export function HeroSlide({ company_name, tagline, stage, year, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-24"
         style={{ background: 'linear-gradient(135deg, #0A0A0F 0%, #1a0a2e 60%, #2d1b69 100%)'}}>
      <EditableText value={company_name || 'Company Name'} onChange={up('company_name')} tag="h1"
        className="text-8xl font-black text-white tracking-tight mb-6 leading-none" />
      <EditableText value={tagline || 'Your tagline here'} onChange={up('tagline')}
        className="text-4xl font-medium mb-10" style={{ color: '#A78BFA' } as any} />
      <div className="text-2xl text-slate-500 flex gap-4">
        <EditableText value={stage || 'Seed'} onChange={up('stage')} tag="span" className="inline" />
        <span>·</span>
        <span>Est.</span>
        <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
      </div>
    </div>
  )
}
