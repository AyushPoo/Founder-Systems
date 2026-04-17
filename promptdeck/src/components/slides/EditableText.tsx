import { useRef } from 'react'
import type { CSSProperties } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
  className?: string
  style?: CSSProperties
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span'
}

export function EditableText({ value, onChange, className = '', style, tag: Tag = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null)
  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      style={style}
      className={`outline-none cursor-text hover:ring-2 hover:ring-purple-500/30 rounded focus:ring-2 focus:ring-purple-500 ${className}`}
      onBlur={(e) => onChange(e.currentTarget.textContent || '')}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  )
}
