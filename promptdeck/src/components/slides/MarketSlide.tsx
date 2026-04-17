import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface MarketItem { value: string; label: string }
interface Props { headline?: string; tam?: MarketItem; sam?: MarketItem; som?: MarketItem; slideIndex: number }

export function MarketSlide({ headline, tam, sam, som, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const updateNested = (field: 'tam'|'sam'|'som', key: 'value'|'label', val: string) => {
    const current = field === 'tam' ? tam : field === 'sam' ? sam : som
    dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: field, value: { ...current, [key]: val } } })
  }
  const circles = [
    { size: 680, bg: 'rgba(124,58,237,0.12)', br: 'rgba(124,58,237,0.5)' },
    { size: 460, bg: 'rgba(124,58,237,0.18)', br: 'rgba(167,139,250,0.6)' },
    { size: 280, bg: 'rgba(124,58,237,0.35)', br: 'rgba(196,181,253,0.9)' },
  ]
  return (
    <div className="w-full h-full flex overflow-hidden" style={{ background: '#0D0D14' }}>
      <div className="w-80 shrink-0 flex flex-col justify-center px-16" style={{ borderRight: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="text-sm font-bold tracking-widest uppercase mb-6" style={{ color: '#A78BFA' }}>Market Size</div>
        <EditableText value={headline || 'A massive opportunity'} onChange={up('headline')} tag="h2"
          className="font-black text-white leading-tight mb-16" style={{ fontSize: 48 }} />
        <div className="flex flex-col gap-10">
          {(['tam', 'sam', 'som'] as const).map((k, i) => {
            const data = k === 'tam' ? tam : k === 'sam' ? sam : som
            const defs = ['0B', 'B', '00M']
            const colors = ['#7C3AED', '#A78BFA', '#C4B5FD']
            const labels = ['Total Addressable', 'Serviceable Available', 'Obtainable']
            return (
              <div key={k}>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: colors[i] }} />
                  <div className="text-sm font-semibold" style={{ color: 'rgba(148,163,184,0.7)' }}>{labels[i]}</div>
                </div>
                <EditableText value={(data as any)?.value || defs[i]} onChange={(v) => updateNested(k, 'value', v)}
                  className="font-black" style={{ fontSize: 42, color: colors[i] }} />
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative">
        {circles.map((c, i) => (
          <div key={i} className="absolute flex flex-col items-center justify-center rounded-full"
               style={{ width: c.size, height: c.size, background: c.bg, border: `2px solid ${c.br}` }}>
            {i === 2 && (
              <>
                <div className="font-black text-white" style={{ fontSize: 44 }}>{som?.value || '00M'}</div>
                <div className="font-semibold mt-1" style={{ fontSize: 18, color: 'rgba(196,181,253,0.8)' }}>SOM</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
