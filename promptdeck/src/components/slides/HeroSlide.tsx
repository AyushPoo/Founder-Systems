import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props { company_name: string; tagline: string; stage: string; year: number | string; imageUrl?: string; slideIndex: number }

export function HeroSlide({ company_name, tagline, stage, year, imageUrl, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ background: '#000' }}>
      {imageUrl && (
        <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      <div className="absolute inset-0" style={{ background: imageUrl ? 'linear-gradient(to right, rgba(0,0,0,0.97) 45%, rgba(0,0,0,0.5) 100%)' : '#000' }} />
      {/* Subtle grain texture via repeating gradient */}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px' }} />
      <div className="relative z-10 flex flex-col justify-between h-full px-24 py-20">
        {/* Top: stage */}
        <div className="flex items-center gap-4">
          <div className="h-px w-12" style={{ background: '#7C3AED' }} />
          <EditableText value={stage || 'Seed Stage'} onChange={up('stage')} tag="span"
            className="text-sm font-semibold tracking-[0.35em] uppercase" style={{ color: '#7C3AED' }} />
        </div>
        {/* Center: company name */}
        <div className="flex flex-col gap-8">
          <EditableText value={company_name || 'Company'} onChange={up('company_name')} tag="h1"
            className="font-display font-black text-white leading-none"
            style={{ fontSize: 200, letterSpacing: '-8px', lineHeight: 0.9, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
          <div className="w-20 h-1" style={{ background: '#7C3AED' }} />
          <EditableText value={tagline || 'Your tagline'} onChange={up('tagline')}
            className="font-medium max-w-3xl" style={{ fontSize: 36, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }} />
        </div>
        {/* Bottom: year */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Est. <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
          </div>
        </div>
      </div>
    </div>
  )
}
