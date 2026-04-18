import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props { quote?: string; author?: string; role?: string; imageUrl?: string; slideIndex: number }

export function QuoteSlide({ quote, author, role, imageUrl, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#000' }}>
      {imageUrl && (
        <>
          <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08 }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)' }} />
        </>
      )}
      {/* Decorative quotation mark */}
      <div className="absolute font-display font-black select-none pointer-events-none"
           style={{ fontSize: 600, color: 'rgba(124,58,237,0.04)', top: -160, left: 40, lineHeight: 1, fontFamily: "'Bricolage Grotesque', sans-serif" }}>"</div>
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-40 max-w-7xl mx-auto">
        <div className="w-16 h-1 mb-16" style={{ background: '#7C3AED' }} />
        <EditableText value={quote || 'This is the most important company building in our space right now.'} onChange={up('quote')} tag="p"
          className="font-display font-bold text-white leading-tight mb-16"
          style={{ fontSize: 58, letterSpacing: '-2px', lineHeight: 1.25, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
        <div className="flex flex-col items-center gap-2">
          <EditableText value={author || 'Partner Name'} onChange={up('author')} tag="div"
            className="font-display font-black text-white"
            style={{ fontSize: 28, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
          <EditableText value={role || 'Partner @ Tier-1 VC'} onChange={up('role')} tag="div"
            className="font-medium" style={{ fontSize: 20, color: 'rgba(255,255,255,0.35)' }} />
        </div>
      </div>
    </div>
  )
}
