import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props {
  company_name: string; tagline: string; stage: string
  year: number | string; imageUrl?: string; layout?: string; slideIndex: number
}

function nameSize(name: string) {
  const n = (name || '').length
  if (n <= 5) return 160; if (n <= 8) return 128; if (n <= 12) return 100; if (n <= 16) return 80; return 64
}

function HeroMagazine({ company_name, tagline, stage, year, imageUrl, up }: any) {
  const fs = nameSize(company_name)
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ background: '#000' }}>
      {imageUrl && <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      <div className="absolute inset-0" style={{ background: imageUrl ? 'linear-gradient(to right, rgba(0,0,0,0.96) 50%, rgba(0,0,0,0.4) 100%)' : '#000' }} />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px' }} />
      <div className="relative z-10 flex flex-col justify-between h-full px-24 py-20">
        <div className="flex items-center gap-4">
          <div className="h-px w-10" style={{ background: '#7C3AED' }} />
          <EditableText value={stage || 'Seed'} onChange={up('stage')} tag="span" className="text-sm font-semibold tracking-[0.3em] uppercase" style={{ color: '#7C3AED' }} />
        </div>
        <div className="flex flex-col gap-6 max-w-4xl">
          <EditableText value={company_name || 'Company'} onChange={up('company_name')} tag="h1" className="font-display font-black text-white leading-none"
            style={{ fontSize: fs, letterSpacing: fs > 100 ? '-4px' : '-2px', lineHeight: 0.92, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
          <div className="w-16 h-0.5" style={{ background: '#7C3AED' }} />
          <EditableText value={tagline || 'Your tagline here'} onChange={up('tagline')} className="font-medium max-w-2xl" style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }} />
        </div>
        <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Est. <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
        </div>
      </div>
    </div>
  )
}

function HeroCentered({ company_name, tagline, stage, year, up }: any) {
  const fs = nameSize(company_name)
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#000' }}>
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />
      {/* Top badge */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="h-px w-8" style={{ background: 'rgba(124,58,237,0.5)' }} />
        <EditableText value={stage || 'Seed'} onChange={up('stage')} tag="span" className="text-sm font-semibold tracking-[0.35em] uppercase" style={{ color: '#A78BFA' }} />
        <div className="h-px w-8" style={{ background: 'rgba(124,58,237,0.5)' }} />
      </div>
      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center text-center px-24">
        <EditableText value={company_name || 'Company'} onChange={up('company_name')} tag="h1" className="font-display font-black text-white"
          style={{ fontSize: fs, letterSpacing: '-4px', lineHeight: 0.9, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        <div className="w-24 h-0.5 my-10" style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)' }} />
        <EditableText value={tagline || 'Your tagline here'} onChange={up('tagline')} className="max-w-3xl font-light" style={{ fontSize: 26, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, letterSpacing: '0.01em' }} />
      </div>
      {/* Bottom year */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-sm font-medium tabular-nums" style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>
        EST. <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
      </div>
    </div>
  )
}

function HeroSplit({ company_name, tagline, stage, year, up }: any) {
  const fs = nameSize(company_name)
  const smallFs = Math.min(fs, 100)
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      {/* Left: text */}
      <div className="flex flex-col justify-between px-20 py-20" style={{ width: '58%' }}>
        <div className="flex items-center gap-3">
          <div className="h-px w-8" style={{ background: '#7C3AED' }} />
          <EditableText value={stage || 'Seed'} onChange={up('stage')} tag="span" className="text-sm font-semibold tracking-[0.35em] uppercase" style={{ color: '#7C3AED' }} />
        </div>
        <div>
          <EditableText value={company_name || 'Company'} onChange={up('company_name')} tag="h1" className="font-display font-black text-white"
            style={{ fontSize: smallFs, letterSpacing: '-3px', lineHeight: 0.9, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
          <div className="w-12 h-0.5 my-8" style={{ background: '#7C3AED' }} />
          <EditableText value={tagline || 'Your tagline here'} onChange={up('tagline')} className="font-light" style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }} />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm font-medium tabular-nums" style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>
            EST. <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
          </div>
        </div>
      </div>
      {/* Right: accent panel */}
      <div className="relative overflow-hidden flex items-center justify-center" style={{ width: '42%', background: '#3b0764' }}>
        {/* Geometric background pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <circle cx="200" cy="300" r="280" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="200" cy="300" r="200" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="200" cy="300" r="120" fill="none" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="300" x2="400" y2="300" stroke="white" strokeWidth="0.5" />
          <line x1="200" y1="0" x2="200" y2="600" stroke="white" strokeWidth="0.5" />
        </svg>
        {/* Big faint year */}
        <div className="absolute bottom-8 right-8 font-display font-black text-white opacity-10 select-none"
          style={{ fontSize: 160, lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-8px' }}>
          {String(year || '24').slice(-2)}
        </div>
        {/* Center dot */}
        <div className="relative z-10 w-4 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.4)' }} />
      </div>
    </div>
  )
}

export function HeroSlide({ company_name, tagline, stage, year, imageUrl, layout = 'magazine', slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const shared = { company_name, tagline, stage, year, imageUrl, up }
  if (layout === 'centered') return <HeroCentered {...shared} />
  if (layout === 'split') return <HeroSplit {...shared} />
  return <HeroMagazine {...shared} />
}
