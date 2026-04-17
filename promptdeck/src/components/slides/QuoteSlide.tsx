interface Props { quote?: string; vision?: string; slideIndex: number }

export function QuoteSlide({ quote, vision }: Props) {
  return (
    <div className="w-full h-full flex items-center justify-center text-center p-32"
         style={{ background: '#0A0A0F' }}>
      <blockquote className="text-6xl font-semibold text-white leading-relaxed max-w-5xl">
        &ldquo;{quote || vision || 'Our vision for the future'}&rdquo;
      </blockquote>
    </div>
  )
}
