import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Axes { x: string; y: string }
interface Competitor { name: string; x: number; y: number; us?: boolean }
interface Props { headline?: string; axes?: Axes; competitors?: Competitor[]; slideIndex: number }

export function CompetitorSlide({ headline, axes, competitors = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const items = competitors.length ? competitors : [
    { name: 'Us', x: 82, y: 85, us: true },
    { name: 'Competitor A', x: 28, y: 65 },
    { name: 'Competitor B', x: 72, y: 28 },
    { name: 'Competitor C', x: 38, y: 40 },
  ]
  return (
    <div className="w-full h-full flex overflow-hidden" style={{ background: '#0A0F1E' }}>
      <div className="w-72 shrink-0 flex flex-col justify-center px-14" style={{ borderRight: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="text-sm font-bold tracking-widest uppercase mb-6" style={{ color: '#A78BFA' }}>Landscape</div>
        <EditableText value={headline || 'Why we win'} onChange={up('headline')} tag="h2"
          className="font-black text-white leading-tight mb-12" style={{ fontSize: 52 }} />
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', boxShadow: '0 0 12px rgba(124,58,237,0.6)' }} />
            <span className="font-bold text-white" style={{ fontSize: 22 }}>Us</span>
          </div>
          {items.filter(c => !c.us).map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ background: 'rgba(148,163,184,0.3)', border: '1px solid rgba(148,163,184,0.5)' }} />
              <span className="font-medium" style={{ fontSize: 20, color: 'rgba(148,163,184,0.7)' }}>{c.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-12 p-5 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: '#A78BFA' }}>X: {axes?.x || 'Price'}</div>
          <div className="text-sm font-semibold" style={{ color: '#A78BFA' }}>Y: {axes?.y || 'Value Delivered'}</div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-16">
        <div className="relative" style={{ width: 800, height: 560 }}>
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {[0.03,0.08,0.03,0.05].map((op, i) => (
              <div key={i} style={{ background: `rgba(124,58,237,${op})`, borderRight: i%2===0 ? '1px solid rgba(255,255,255,0.06)' : undefined, borderBottom: i<2 ? '1px solid rgba(255,255,255,0.06)' : undefined }} />
            ))}
          </div>
          {items.map((c, i) => (
            <div key={i} className="absolute flex flex-col items-center"
                 style={{ left: `${c.x}%`, bottom: `${c.y}%`, transform: 'translate(-50%, 50%)' }}>
              {c.us && <div className="absolute rounded-full" style={{ width: 80, height: 80, background: 'rgba(124,58,237,0.2)', animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }} />}
              <div className="rounded-full flex items-center justify-center font-black text-white relative"
                   style={{ width: c.us ? 64 : 44, height: c.us ? 64 : 44, background: c.us ? 'linear-gradient(135deg,#7C3AED,#A78BFA)' : 'rgba(148,163,184,0.25)', border: c.us ? '2px solid #A78BFA' : '1px solid rgba(148,163,184,0.4)', fontSize: c.us ? 20 : 16, boxShadow: c.us ? '0 0 24px rgba(124,58,237,0.5)' : 'none' }}>
                {c.name[0]}
              </div>
              <div className="mt-2 font-semibold whitespace-nowrap" style={{ fontSize: 16, color: c.us ? '#A78BFA' : 'rgba(148,163,184,0.6)' }}>{c.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
