import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'
import { getTheme } from '../../constants/themes'

interface MarketItem { value: string; label: string }
interface Props { headline?: string; tam?: MarketItem; sam?: MarketItem; som?: MarketItem; layout?: string; slideIndex: number; deckStyle?: string }

// --- NUMBERS LAYOUT (Careerist style — 3 big columns) ---
function MarketNumbers({ headline, tam, sam, som, up, updateNested, t }: any) {
  const tiers = [
    { key: 'tam' as const, data: tam, def: '$40B',  label: 'TAM',  sub: 'Total Addressable Market',     color: t.accent },
    { key: 'sam' as const, data: sam, def: '$8B',   label: 'SAM',  sub: 'Serviceable Available Market',  color: t.accentLight },
    { key: 'som' as const, data: som, def: '$800M', label: 'SOM',  sub: 'Obtainable Market',              color: '#C4B5FD' },
  ]
  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="px-20 pt-14 pb-0 shrink-0">
        <div className="text-xs font-semibold tracking-[0.35em] uppercase mb-3" style={{ color: t.accentLight }}>Market Size</div>
        <EditableText value={headline || 'A massive opportunity'} onChange={up('headline')} tag="h2"
          className="font-display font-black"
          style={{ fontSize: 52, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
      </div>
      <div className="flex-1 grid grid-cols-3" style={{ marginTop: 0 }}>
        {tiers.map((tier, i) => (
          <div key={tier.key} className="flex flex-col justify-center px-16 py-12 relative"
            style={{
              borderRight: i < 2 ? `1px solid ${t.border}` : 'none',
              borderTop: `3px solid ${tier.color}`,
            }}>
            {/* Big ghost number behind */}
            <div className="absolute right-8 bottom-8 font-display font-black select-none"
              style={{ fontSize: 120, color: tier.color, opacity: 0.05, lineHeight: 1,
                fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {i + 1}
            </div>
            <div className="font-semibold tracking-[0.15em] uppercase mb-4"
              style={{ fontSize: 14, color: t.textMuted }}>{tier.label}</div>
            <EditableText value={(tier.data as any)?.value || tier.def}
              onChange={(v: string) => updateNested(tier.key, 'value', v)}
              className="font-display font-black leading-none mb-5"
              style={{ fontSize: 76, letterSpacing: '-3px', color: tier.color,
                fontFamily: "'Bricolage Grotesque', sans-serif" }} />
            <div className="w-10 h-0.5 mb-4" style={{ background: tier.color, opacity: 0.4 }} />
            <div style={{ fontSize: 18, color: t.textSub, lineHeight: 1.5, maxWidth: 260 }}>{tier.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- BARS LAYOUT ---
function MarketBars({ headline, tam, sam, som, up, updateNested, t }: any) {
  const tiers = [
    { key: 'tam' as const, data: tam, def: '$40B',  label: 'TAM', sub: 'Total Addressable Market',    color: t.accent,      pct: 100 },
    { key: 'sam' as const, data: sam, def: '$8B',   label: 'SAM', sub: 'Serviceable Available Market', color: t.accentLight, pct: 55  },
    { key: 'som' as const, data: som, def: '$800M', label: 'SOM', sub: 'Obtainable Market',             color: '#C4B5FD',     pct: 25  },
  ]
  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="px-20 pt-14 shrink-0">
        <div className="text-xs font-semibold tracking-[0.35em] uppercase mb-3" style={{ color: t.accentLight }}>Market Size</div>
        <EditableText value={headline || 'A massive opportunity'} onChange={up('headline')} tag="h2"
          className="font-display font-black"
          style={{ fontSize: 52, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
      </div>
      <div className="flex-1 flex flex-col justify-center gap-0 px-20" style={{ paddingBottom: 60 }}>
        {tiers.map((tier, i) => (
          <div key={tier.key} className="flex items-center gap-8"
            style={{ paddingTop: i === 0 ? 0 : 36, paddingBottom: i < 2 ? 36 : 0, borderBottom: i < 2 ? `1px solid ${t.border}` : 'none' }}>
            <div className="shrink-0" style={{ width: 180 }}>
              <div className="font-display font-bold" style={{ fontSize: 18, fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }}>{tier.label}</div>
              <div style={{ fontSize: 14, color: t.textMuted, marginTop: 2 }}>{tier.sub}</div>
            </div>
            <div className="flex-1 relative" style={{ height: 36 }}>
              <div className="absolute inset-0 rounded-full opacity-10" style={{ background: tier.color }} />
              <div className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{ width: `${tier.pct}%`, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}99)`, boxShadow: `0 0 20px ${tier.color}30` }} />
            </div>
            <div className="shrink-0 font-display font-black" style={{ fontSize: 44, letterSpacing: '-1.5px', color: tier.color, fontFamily: "'Bricolage Grotesque', sans-serif", minWidth: 160, textAlign: 'right' }}>
              <EditableText value={(tier.data as any)?.value || tier.def} onChange={(v: string) => updateNested(tier.key, 'value', v)} tag="span" className="inline" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- CIRCLES LAYOUT ---
function MarketCircles({ headline, tam, sam, som, up, updateNested, t }: any) {
  const items = [
    { key: 'tam' as const, data: tam, def: '$40B',  color: t.accent,      bg: `${t.accent}0f`, size: 680, label: 'TAM — Total Addressable Market' },
    { key: 'sam' as const, data: sam, def: '$8B',   color: t.accentLight, bg: `${t.accent}1a`, size: 460, label: 'SAM — Serviceable Available Market' },
    { key: 'som' as const, data: som, def: '$800M', color: '#C4B5FD',     bg: `${t.accent}2e`, size: 280, label: 'SOM — Obtainable Market' },
  ]
  return (
    <div className="w-full h-full flex" style={{ background: t.bg }}>
      <div className="w-96 shrink-0 flex flex-col justify-center px-16 gap-12" style={{ borderRight: `1px solid ${t.border}` }}>
        <div>
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-6" style={{ color: t.accentLight }}>Market Size</div>
          <EditableText value={headline || 'A massive opportunity'} onChange={up('headline')} tag="h2"
            className="font-display font-black leading-tight"
            style={{ fontSize: 52, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
        </div>
        <div className="flex flex-col gap-8">
          {items.map(({ key, data, def, color, label }) => (
            <div key={key}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <div className="text-sm font-medium" style={{ color: t.textMuted }}>{label}</div>
              </div>
              <EditableText value={(data as any)?.value || def} onChange={(v: string) => updateNested(key, 'value', v)}
                className="font-display font-black"
                style={{ fontSize: 44, letterSpacing: '-1px', color, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative">
        {[...items].reverse().map((c, i) => (
          <div key={i} className="absolute flex flex-col items-center justify-center rounded-full"
            style={{ width: c.size, height: c.size, background: c.bg, border: `1px solid ${c.color}33` }}>
            {i === 2 && (
              <div className="text-center">
                <div className="font-display font-black" style={{ fontSize: 48, color: '#C4B5FD', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {(som as any)?.value || '$800M'}
                </div>
                <div className="font-medium mt-1" style={{ fontSize: 18, color: t.textMuted }}>SOM</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MarketSlide({ headline, tam, sam, som, layout = 'numbers', slideIndex, deckStyle }: Props) {
  const { dispatch } = useDeck()
  const t = getTheme(deckStyle)
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const updateNested = (field: 'tam' | 'sam' | 'som', key: 'value' | 'label', val: string) => {
    const current = field === 'tam' ? tam : field === 'sam' ? sam : som
    dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: field, value: { ...current, [key]: val } } })
  }
  const shared = { headline, tam, sam, som, up, updateNested, t }
  if (layout === 'bars') return <MarketBars {...shared} />
  if (layout === 'circles') return <MarketCircles {...shared} />
  return <MarketNumbers {...shared} />
}
