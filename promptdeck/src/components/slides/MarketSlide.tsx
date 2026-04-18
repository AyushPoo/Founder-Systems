import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface MarketItem { value: string; label: string }
interface Props { headline?: string; tam?: MarketItem; sam?: MarketItem; som?: MarketItem; layout?: string; slideIndex: number }

function MarketCircles({ headline, tam, sam, som, up, updateNested }: any) {
  const items = [
    { key: 'tam', data: tam, def: '$40B', color: '#7C3AED', bg: 'rgba(124,58,237,0.06)', size: 680, label: 'TAM — Total Addressable Market' },
    { key: 'sam', data: sam, def: '$8B',  color: '#A78BFA', bg: 'rgba(124,58,237,0.1)',  size: 460, label: 'SAM — Serviceable Available Market' },
    { key: 'som', data: som, def: '$800M',color: '#C4B5FD', bg: 'rgba(124,58,237,0.18)', size: 280, label: 'SOM — Obtainable Market' },
  ]
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      <div className="w-96 shrink-0 flex flex-col justify-center px-16 gap-12" style={{ borderRight: '1px solid #111' }}>
        <div>
          <div className="text-sm font-semibold tracking-[0.35em] uppercase mb-6" style={{ color: '#A78BFA' }}>Market Size</div>
          <EditableText value={headline || 'A massive opportunity'} onChange={up('headline')} tag="h2"
            className="font-display font-black text-white leading-tight"
            style={{ fontSize: 52, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        </div>
        <div className="flex flex-col gap-8">
          {items.map(({ key, data, def, color, label }) => (
            <div key={key}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</div>
              </div>
              <EditableText value={(data as any)?.value || def} onChange={(v: string) => updateNested(key, 'value', v)}
                className="font-display font-black" style={{ fontSize: 44, letterSpacing: '-1px', color, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
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
                <div className="font-medium mt-1" style={{ fontSize: 18, color: 'rgba(196,181,253,0.5)' }}>SOM</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MarketBars({ headline, tam, sam, som, up, updateNested }: any) {
  const tiers = [
    { key: 'tam', data: tam, def: '$40B',  label: 'TAM', sub: 'Total Addressable Market', color: '#7C3AED', pct: 100 },
    { key: 'sam', data: sam, def: '$8B',   label: 'SAM', sub: 'Serviceable Available Market', color: '#A78BFA', pct: 55 },
    { key: 'som', data: som, def: '$800M', label: 'SOM', sub: 'Obtainable Market', color: '#C4B5FD', pct: 25 },
  ]
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
      <div className="px-20 pt-14 shrink-0">
        <div className="text-xs font-semibold tracking-[0.35em] uppercase mb-3" style={{ color: '#A78BFA' }}>Market Size</div>
        <EditableText value={headline || 'A massive opportunity'} onChange={up('headline')} tag="h2"
          className="font-display font-black text-white"
          style={{ fontSize: 52, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif" }} />
      </div>
      <div className="flex-1 flex flex-col justify-center gap-0 px-20" style={{ paddingBottom: 60 }}>
        {tiers.map((t, i) => (
          <div key={t.key} className="flex items-center gap-8" style={{ paddingTop: i === 0 ? 0 : 36, paddingBottom: i < 2 ? 36 : 0, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            {/* Label column */}
            <div className="shrink-0" style={{ width: 180 }}>
              <div className="font-display font-bold text-white" style={{ fontSize: 18, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{t.label}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t.sub}</div>
            </div>
            {/* Bar */}
            <div className="flex-1 relative" style={{ height: 36 }}>
              <div className="absolute inset-0 rounded-full opacity-10" style={{ background: t.color }} />
              <div className="absolute left-0 top-0 bottom-0 rounded-full flex items-center pr-4"
                style={{ width: `${t.pct}%`, background: `linear-gradient(90deg, ${t.color}, ${t.color}99)`, boxShadow: `0 0 20px ${t.color}30` }}>
              </div>
            </div>
            {/* Value */}
            <div className="shrink-0 font-display font-black" style={{ fontSize: 44, letterSpacing: '-1.5px', color: t.color, fontFamily: "'Bricolage Grotesque', sans-serif", minWidth: 160, textAlign: 'right' }}>
              <EditableText value={(t.data as any)?.value || t.def} onChange={(v: string) => updateNested(t.key, 'value', v)} tag="span" className="inline" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MarketSlide({ headline, tam, sam, som, layout = 'circles', slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const updateNested = (field: 'tam' | 'sam' | 'som', key: 'value' | 'label', val: string) => {
    const current = field === 'tam' ? tam : field === 'sam' ? sam : som
    dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: field, value: { ...current, [key]: val } } })
  }
  const shared = { headline, tam, sam, som, up, updateNested }
  if (layout === 'bars') return <MarketBars {...shared} />
  return <MarketCircles {...shared} />
}
