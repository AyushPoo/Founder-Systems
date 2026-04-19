import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'
import { getTheme } from '../../constants/themes'

interface Props {
  company_name: string; tagline: string; stage: string
  year: number | string; imageUrl?: string; layout?: string
  logoUrl?: string
  slideIndex: number; deckStyle?: string
}

function nameSize(name: string) {
  const n = (name || '').length
  if (n <= 5) return 160; if (n <= 8) return 128; if (n <= 12) return 100; if (n <= 16) return 80; return 64
}

function LogoBadge({ logoUrl, company_name, t }: { logoUrl?: string; company_name: string; t: any }) {
  if (logoUrl) {
    return (
      <div className="flex items-center justify-center rounded-xl overflow-hidden"
        style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.08)', border: `1px solid ${t.border}` }}>
        <img src={logoUrl} alt="logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
      </div>
    )
  }
  // SVG monogram fallback
  const letter = (company_name || 'C')[0].toUpperCase()
  return (
    <div className="flex items-center justify-center rounded-xl font-black"
      style={{
        width: 52, height: 52,
        background: t.accentBg,
        border: `1px solid ${t.accentBorder}`,
        fontSize: 24,
        color: t.accent,
        fontFamily: "'Bricolage Grotesque', sans-serif",
        letterSpacing: '-1px',
      }}>
      {letter}
    </div>
  )
}

function HeroMagazine({ company_name, tagline, stage, year, imageUrl, logoUrl, up, t }: any) {
  const fs = nameSize(company_name)
  if (!t.isDark) {
    return (
      <div className="w-full h-full flex" style={{ background: t.bg }}>
        <div className="flex flex-col justify-between px-24 py-20" style={{ width: '55%' }}>
          <div className="flex items-center gap-4">
            <LogoBadge logoUrl={logoUrl} company_name={company_name} t={t} />
            <div className="flex items-center gap-3">
              <div className="h-px w-6" style={{ background: t.accent }} />
              <EditableText value={stage || 'Seed'} onChange={up('stage')} tag="span"
                className="text-sm font-semibold tracking-[0.3em] uppercase" style={{ color: t.accent }} />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <EditableText value={company_name || 'Company'} onChange={up('company_name')} tag="h1"
              className="font-display font-black leading-none"
              style={{ fontSize: fs, letterSpacing: fs > 100 ? '-4px' : '-2px', lineHeight: 0.92,
                fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
            <div className="w-16 h-0.5" style={{ background: t.accent }} />
            <EditableText value={tagline || 'Your tagline here'} onChange={up('tagline')}
              className="font-medium max-w-xl" style={{ fontSize: 26, color: t.textSub, lineHeight: 1.6 }} />
          </div>
          <div className="text-sm font-medium" style={{ color: t.textMuted, letterSpacing: '0.15em' }}>
            EST. <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
          </div>
        </div>
        <div className="relative overflow-hidden flex-1" style={{ background: t.surface }}>
          {imageUrl
            ? <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            : (
              <>
                <div className="absolute inset-0" style={{ background: t.surfaceAlt }} />
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 500 1080" preserveAspectRatio="xMidYMid slice">
                  <circle cx="250" cy="540" r="400" fill="none" stroke={t.accent} strokeWidth="1" />
                  <circle cx="250" cy="540" r="280" fill="none" stroke={t.accent} strokeWidth="0.5" />
                  <circle cx="250" cy="540" r="160" fill="none" stroke={t.accent} strokeWidth="0.5" />
                </svg>
              </>
            )
          }
          <div className="absolute inset-0" style={{ background: imageUrl ? `linear-gradient(to right, ${t.bg}30, transparent)` : 'none' }} />
        </div>
      </div>
    )
  }
  // Dark theme: full-bleed magazine
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col" style={{ background: t.bg }}>
      {imageUrl && <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      <div className="absolute inset-0" style={{ background: imageUrl ? 'linear-gradient(to right, rgba(0,0,0,0.96) 50%, rgba(0,0,0,0.4) 100%)' : t.bg }} />
      <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px' }} />
      <div className="relative z-10 flex flex-col justify-between h-full px-24 py-20">
        <div className="flex items-center gap-4">
          <LogoBadge logoUrl={logoUrl} company_name={company_name} t={t} />
          <div className="flex items-center gap-3">
            <div className="h-px w-6" style={{ background: t.accent }} />
            <EditableText value={stage || 'Seed'} onChange={up('stage')} tag="span"
              className="text-sm font-semibold tracking-[0.3em] uppercase" style={{ color: t.accentLight }} />
          </div>
        </div>
        <div className="flex flex-col gap-6 max-w-4xl">
          <EditableText value={company_name || 'Company'} onChange={up('company_name')} tag="h1"
            className="font-display font-black leading-none"
            style={{ fontSize: fs, letterSpacing: fs > 100 ? '-4px' : '-2px', lineHeight: 0.92,
              fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
          <div className="w-16 h-0.5" style={{ background: t.accent }} />
          <EditableText value={tagline || 'Your tagline here'} onChange={up('tagline')}
            className="font-medium max-w-2xl" style={{ fontSize: 28, color: t.textSub, lineHeight: 1.6 }} />
        </div>
        <div className="text-sm font-medium" style={{ color: t.textMuted }}>
          Est. <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
        </div>
      </div>
    </div>
  )
}

function HeroCentered({ company_name, tagline, stage, year, logoUrl, up, t }: any) {
  const fs = nameSize(company_name)
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: t.bg }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(${t.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'} 1px, transparent 1px), linear-gradient(90deg, ${t.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'} 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <LogoBadge logoUrl={logoUrl} company_name={company_name} t={t} />
        <div className="flex items-center gap-3">
          <div className="h-px w-8" style={{ background: t.accentBorder }} />
          <EditableText value={stage || 'Seed'} onChange={up('stage')} tag="span"
            className="text-sm font-semibold tracking-[0.35em] uppercase" style={{ color: t.accentLight }} />
          <div className="h-px w-8" style={{ background: t.accentBorder }} />
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center text-center px-24">
        <EditableText value={company_name || 'Company'} onChange={up('company_name')} tag="h1"
          className="font-display font-black"
          style={{ fontSize: fs, letterSpacing: '-4px', lineHeight: 0.9,
            fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
        <div className="w-24 h-0.5 my-10" style={{ background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)` }} />
        <EditableText value={tagline || 'Your tagline here'} onChange={up('tagline')}
          className="max-w-3xl font-light" style={{ fontSize: 26, color: t.textSub, lineHeight: 1.65, letterSpacing: '0.01em' }} />
      </div>
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-sm font-medium tabular-nums" style={{ color: t.textMuted, letterSpacing: '0.2em' }}>
        EST. <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
      </div>
    </div>
  )
}

function HeroSplit({ company_name, tagline, stage, year, logoUrl, up, t }: any) {
  const fs = nameSize(company_name)
  const smallFs = Math.min(fs, 100)
  return (
    <div className="w-full h-full flex" style={{ background: t.bg }}>
      <div className="flex flex-col justify-between px-20 py-20" style={{ width: '58%' }}>
        <div className="flex items-center gap-4">
          <LogoBadge logoUrl={logoUrl} company_name={company_name} t={t} />
          <div className="flex items-center gap-3">
            <div className="h-px w-8" style={{ background: t.accent }} />
            <EditableText value={stage || 'Seed'} onChange={up('stage')} tag="span"
              className="text-sm font-semibold tracking-[0.35em] uppercase" style={{ color: t.accent }} />
          </div>
        </div>
        <div>
          <EditableText value={company_name || 'Company'} onChange={up('company_name')} tag="h1"
            className="font-display font-black"
            style={{ fontSize: smallFs, letterSpacing: '-3px', lineHeight: 0.9,
              fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
          <div className="w-12 h-0.5 my-8" style={{ background: t.accent }} />
          <EditableText value={tagline || 'Your tagline here'} onChange={up('tagline')}
            className="font-light" style={{ fontSize: 24, color: t.textSub, lineHeight: 1.65 }} />
        </div>
        <div className="text-sm font-medium tabular-nums" style={{ color: t.textMuted, letterSpacing: '0.2em' }}>
          EST. <EditableText value={String(year || 2024)} onChange={up('year')} tag="span" className="inline" />
        </div>
      </div>
      <div className="relative overflow-hidden flex items-center justify-center" style={{ width: '42%', background: t.accentBg, borderLeft: `1px solid ${t.accentBorder}` }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.15]" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
          <circle cx="200" cy="300" r="280" fill="none" stroke={t.accent} strokeWidth="1" />
          <circle cx="200" cy="300" r="200" fill="none" stroke={t.accent} strokeWidth="0.5" />
          <circle cx="200" cy="300" r="120" fill="none" stroke={t.accent} strokeWidth="0.5" />
          <line x1="0" y1="300" x2="400" y2="300" stroke={t.accent} strokeWidth="0.5" />
          <line x1="200" y1="0" x2="200" y2="600" stroke={t.accent} strokeWidth="0.5" />
        </svg>
        <div className="absolute bottom-8 right-8 font-display font-black opacity-10 select-none"
          style={{ fontSize: 160, lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif",
            letterSpacing: '-8px', color: t.accent }}>
          {String(year || '24').slice(-2)}
        </div>
        <div className="relative z-10 w-4 h-4 rounded-full" style={{ background: t.accent, opacity: 0.5 }} />
      </div>
    </div>
  )
}

export function HeroSlide({ company_name, tagline, stage, year, imageUrl, logoUrl, layout = 'magazine', slideIndex, deckStyle }: Props) {
  const { dispatch } = useDeck()
  const t = getTheme(deckStyle)
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const shared = { company_name, tagline, stage, year, imageUrl, logoUrl, up, t }
  if (layout === 'centered') return <HeroCentered {...shared} />
  if (layout === 'split') return <HeroSplit {...shared} />
  return <HeroMagazine {...shared} />
}
