import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface MarketItem { value: string; label: string }
interface Props { headline?: string; tam?: MarketItem; sam?: MarketItem; som?: MarketItem; slideIndex: number }

export function MarketSlide({ headline, tam, sam, som, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const updateNested = (field: 'tam' | 'sam' | 'som', key: 'value' | 'label', val: string) => {
    const current = field === 'tam' ? tam : field === 'sam' ? sam : som
    dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: field, value: { ...current, [key]: val } } })
  }
  const items = [
    { key: 'tam' as const, data: tam, def: '$40B', color: '#7C3AED', bg: 'rgba(124,58,237,0.06)', size: 680, label: 'TAM — Total Addressable Market' },
    { key: 'sam' as const, data: sam, def: '$8B', color: '#A78BFA', bg: 'rgba(124,58,237,0.1)', size: 460, label: 'SAM — Serviceable Available Market' },
    { key: 'som' as const, data: som, def: '$800M', color: '#C4B5FD', bg: 'rgba(124,58,237,0.18)', size: 280, label: 'SOM — Obtainable Market' },
  ]
  return (
    <div className="w-full h-full flex" style={{ background: '#000' }}>
      {/* Left: labels */}
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
              <EditableText value={(data as any)?.value || def} onChange={(v) => updateNested(key, 'value', v)}
                className="font-display font-black" style={{ fontSize: 44, letterSpacing: '-1px', color, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
            </div>
          ))}
        </div>
      </div>
      {/* Right: circles */}
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
