import { useRef, useEffect } from 'react'
import type { CSSProperties, ElementType, FocusEvent } from 'react'
import Draggable from 'react-draggable'
import { useDeck } from '../../context/DeckContext'

interface Props {
  value: string
  onChange: (val: string) => void
  tag?: ElementType
  className?: string
  style?: CSSProperties
  placeholder?: string
  posKey?: string
  slideIndex?: number
}

export function EditableText({ value, onChange, tag: Tag = 'div', className = '', style, placeholder, posKey, slideIndex }: Props) {
  const ref = useRef<HTMLElement>(null)
  const isFocused = useRef(false)
  const { state, dispatch } = useDeck()

  useEffect(() => {
    if (ref.current && !isFocused.current) {
      ref.current.textContent = value ?? ''
    }
  }, [value])

  const el = (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => { isFocused.current = true }}
      onBlur={(e: FocusEvent<HTMLElement>) => {
        isFocused.current = false
        onChange(e.currentTarget.textContent ?? '')
      }}
      className={className}
      style={{
        outline: 'none',
        cursor: state.dragMode ? 'move' : 'text',
        ...style,
      }}
      data-placeholder={placeholder}
    />
  )

  if (!state.dragMode || !posKey || slideIndex === undefined) return el

  const slide = state.slides[slideIndex]
  const positions: Record<string, { x: number; y: number }> = (slide?.props as any)?._positions ?? {}
  const pos = positions[posKey] ?? { x: 0, y: 0 }

  return (
    <Draggable
      defaultPosition={pos}
      onStop={(_e: any, data: any) => {
        const current: Record<string, { x: number; y: number }> = (state.slides[slideIndex]?.props as any)?._positions ?? {}
        dispatch({
          type: 'UPDATE_SLIDE_PROP',
          payload: {
            index: slideIndex,
            key: '_positions',
            value: { ...current, [posKey]: { x: data.x, y: data.y } }
          }
        })
      }}
    >
      <div style={{ position: 'absolute', zIndex: 10 }}>
        <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px dashed rgba(124,58,237,0.5)', borderRadius: 4, padding: '2px 4px', cursor: 'move' }}>
          {el}
        </div>
      </div>
    </Draggable>
  )
}
