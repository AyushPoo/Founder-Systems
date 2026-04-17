import { useRef, useEffect } from 'react'
import type { CSSProperties } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
  className?: string
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span'
  style?: CSSProperties
}

export function EditableText({ value, onChange, className = '', tag: Tag = 'div', style }: Props) {
  const ref = useRef<HTMLElement>(null)
  const isFocused = useRef(false)

  useEffect(() => {
    // Only update DOM content when not focused (external value change)
    if (ref.current && !isFocused.current) {
      ref.current.textContent = value
    }
  }, [value])

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      style={style}
      className={`outline-none cursor-text hover:ring-2 hover:ring-purple-400/30 rounded focus:ring-2 focus:ring-purple-500 ${className}`}
      onFocus={() => { isFocused.current = true }}
      onBlur={(e) => {
        isFocused.current = false
        onChange(e.currentTarget.textContent || '')
      }}
    />
  )
}
