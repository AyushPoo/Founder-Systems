import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props { headline?: string; quote?: string; vision?: string; attribution?: string; slideIndex: number }

export function QuoteSlide({ headline, quote, vision, attribution, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg,#0A0A0F 0%,#0f0a2e 60%,#1a0a3e 100%)' }}>
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.05) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute font-black select-none pointer-events-none" style={{ fontSize: 500, color: 'rgba(124,58,237,0.06)', top: -120, left: 20, lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</div>
      <div className="relative z-10 flex flex-col items-center text-center px-40 max-w-6xl mx-auto">
        {headline && (
          <EditableText value={headline} onChange={up('headline')} tag="div"
            className="font-bold tracking-widest uppercase mb-8" style={{ fontSize: 20, color: '#A78BFA' }} />
        )}
        <EditableText value={quote || vision || 'We exist to make something impossible, possible.'} onChange={up('quote')}
          className="font-black text-white leading-tight" style={{ fontSize: 68, letterSpacing: '-1px' }} />
        {attribution && (
          <div className="mt-12 flex items-center gap-4">
            <div className="h-px w-12" style={{ background: 'rgba(167,139,250,0.4)' }} />
            <EditableText value={attribution} onChange={up('attribution')} tag="span"
              className="font-semibold" style={{ fontSize: 24, color: 'rgba(167,139,250,0.7)' }} />
            <div className="h-px w-12" style={{ background: 'rgba(167,139,250,0.4)' }} />
          </div>
        )}
      </div>
    </div>
  )
}
