import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props { company_name: string; tagline: string; stage: string; year: number | string; slideIndex: number }

export function HeroSlide({ company_name, tagline, stage, year, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center text-center"
         style={{ background: 'linear-gradient(135deg, #0A0A0F 0%, #0f0a2e 50%, #1a0a3e 100%)' }}>
      {/* Grid overlay */}
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.07) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      {/* Glow */}
      <div className="absolute" style={{ width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <div className="relative z-10 flex flex-col items-center px-32">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px w-16" style={{ background: 'rgba(167,139,250,0.5)' }} />
          <EditableText value={stage || 'Seed Stage'} onChange={up('stage')} tag="span"
            className="text-xl font-semibold tracking-[0.3em] uppercase" style={{ color: '#A78BFA' }} />
          <div className="h-px w-16" style={{ background: 'rgba(167,139,250,0.5)' }} />
        </div>
        <EditableText value={company_name || 'Company Name'} onChange={up('company_name')} tag="h1"
          className="font-black text-white mb-8 leading-none" style={{ fontSize: 140, letterSpacing: '-4px' }} />
        <EditableText value={tagline || 'Your tagline here'} onChange={up('tagline')}
          className="font-medium leading-snug max-w-4xl" style={{ fontSize: 40, color: 'rgba(196,181,253,0.9)' }} />
        <div className="mt-16 text-lg font-medium" style={{ color: 'rgba(148,163,184,0.6)' }}>
          Est. <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
        </div>
      </div>
    </div>
  )
}
