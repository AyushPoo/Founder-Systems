import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Feature { title: string; description: string }
interface Props { headline?: string; features?: Feature[]; slideIndex: number }

export function SolutionSlide({ headline, features = [], slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  const items = features.length ? features : [{ title: 'Built different', description: 'A fundamentally new approach that solves what others ignore' }, { title: 'Instant value', description: 'Results visible from day one, no long integration cycles' }, { title: 'Scales with you', description: 'Designed to grow from 10 users to 10 million' }]
  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Left panel */}
      <div className="w-96 shrink-0 flex flex-col justify-between p-16" style={{ background: 'linear-gradient(160deg, #4C1D95, #7C3AED)' }}>
        <div>
          <div className="text-sm font-bold tracking-[0.25em] uppercase mb-8" style={{ color: 'rgba(196,181,253,0.7)' }}>The Solution</div>
          <EditableText value={headline || 'How we fix it'} onChange={up('headline')} tag="h2"
            className="font-black text-white leading-tight" style={{ fontSize: 58 }} />
        </div>
        <div className="font-black" style={{ fontSize: 160, color: 'rgba(255,255,255,0.08)', lineHeight: 1 }}>✦</div>
      </div>
      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center gap-0" style={{ background: '#F8F7FF' }}>
        {items.map((f, i) => (
          <div key={i} className="flex items-center gap-8 px-16 py-10" style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none' }}>
            <div className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center font-black text-white text-2xl"
                 style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>{i + 1}</div>
            <div className="flex-1">
              <div className="font-black text-slate-900 mb-2" style={{ fontSize: 32 }}>{f.title}</div>
              <div className="font-medium text-slate-500" style={{ fontSize: 24, lineHeight: 1.5 }}>{f.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
