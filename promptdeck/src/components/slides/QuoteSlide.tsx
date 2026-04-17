import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'

interface Props { quote?: string; vision?: string; slideIndex: number }

export function QuoteSlide({ quote, vision, slideIndex }: Props) {
  const { dispatch } = useDeck()
  const up = (key: string) => (val: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key, value: val } })
  return (
    <div className="w-full h-full flex items-center justify-center text-center p-32"
         style={{ background: '#0A0A0F' }}>
      <blockquote className="text-6xl font-semibold text-white leading-relaxed max-w-5xl">
        &ldquo;<EditableText value={quote || vision || 'Our vision for the future'} onChange={up('quote')} tag="span" className="inline" />&rdquo;
      </blockquote>
    </div>
  )
}
