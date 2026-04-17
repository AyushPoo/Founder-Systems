import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Metric { value: string; label: string; growth?: string }
interface Props { headline?: string; metrics?: Metric[]; slideIndex: number }

export function TractionSlide({ headline, metrics = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const items = metrics.length ? metrics : [{ value: '10K', label: 'Active Users', growth: '+40% MoM' }, { value: '8K', label: 'Monthly Revenue', growth: '+25% MoM' }, { value: '94%', label: 'Retention Rate', growth: '+8 pts' }]
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0A0F1E' }}>
      {/* Header */}
      <div className="flex items-end justify-between px-24 pt-20 pb-12" style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
        <EditableText value={headline || 'Traction'} onChange={up('headline')} tag="h2"
          className="font-black text-white" style={{ fontSize: 80 }} />
        <div className="text-lg font-medium pb-3" style={{ color: 'rgba(167,139,250,0.6)' }}>Numbers don't lie</div>
      </div>
      {/* Metrics */}
      <div className="flex-1 flex">
        {items.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center relative"
               style={{ borderRight: i < items.length - 1 ? '1px solid rgba(124,58,237,0.15)' : 'none' }}>
            {/* Background label */}
            <div className="absolute font-black uppercase select-none pointer-events-none" style={{ fontSize: 130, color: 'rgba(124,58,237,0.05)', letterSpacing: '-4px' }}>{m.label}</div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="font-black text-white" style={{ fontSize: 110, lineHeight: 1, letterSpacing: '-3px' }}>{m.value}</div>
              <div className="font-semibold mt-4 mb-4" style={{ fontSize: 28, color: 'rgba(148,163,184,0.8)' }}>{m.label}</div>
              {m.growth && (
                <div className="px-5 py-2 rounded-full font-bold" style={{ fontSize: 22, background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                  ↑ {m.growth}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
