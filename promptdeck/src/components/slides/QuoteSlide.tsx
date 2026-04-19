import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'
import { getTheme } from '../../constants/themes'

interface Quote { text: string; author: string; role?: string; company?: string }
interface Props { headline?: string; quotes?: Quote[]; slideIndex: number; deckStyle?: string }

const DEFAULT_QUOTES: Quote[] = [
  { text: "This is hands-down the fastest way to build a pitch deck I've ever seen. We closed our seed round in 3 weeks.", author: "Sarah K.", role: "Founder & CEO", company: "Seed-stage startup" },
  { text: "Saved us weeks of back-and-forth with designers. Investors said it was one of the best decks they'd seen this year.", author: "Raj M.", role: "CEO", company: "YC W23" },
  { text: "Used it for our Series A raise. Closed $4M in 6 weeks. The quality matched decks from top design agencies.", author: "Priya S.", role: "Co-founder", company: "Fintech startup" },
]

export function QuoteSlide({ headline, quotes = [], slideIndex, deckStyle }: Props) {
  const { dispatch } = useDeck()
  const t = getTheme(deckStyle)
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const items: Quote[] = quotes.length ? quotes : DEFAULT_QUOTES
  const cardBg = t.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'
  const cardBorder = t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'

  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      {/* Header */}
      <div className="px-20 pt-14 pb-0 shrink-0">
        <div className="text-xs font-semibold tracking-[0.35em] uppercase mb-3" style={{ color: t.accentLight }}>
          Customer Feedback
        </div>
        <EditableText value={headline || 'What our customers say'} onChange={up('headline')} tag="h2"
          className="font-display font-black"
          style={{ fontSize: 52, letterSpacing: '-2px', fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
      </div>

      {/* Cards */}
      <div className="flex-1 flex items-stretch gap-5 px-20 pb-16" style={{ marginTop: 32 }}>
        {items.slice(0, 3).map((q: Quote, i: number) => (
          <div key={i} className="flex-1 flex flex-col rounded-2xl p-10 relative overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            {/* Opening quote mark */}
            <div className="absolute top-6 right-8 font-black select-none"
              style={{
                fontSize: 96, lineHeight: 1, color: t.accent, opacity: 0.1,
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}>"</div>

            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {[0, 1, 2, 3, 4].map(s => (
                <svg key={s} width="16" height="16" viewBox="0 0 16 16" fill={t.accent}>
                  <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" />
                </svg>
              ))}
            </div>

            {/* Quote text */}
            <div className="flex-1">
              <div className="font-medium leading-relaxed"
                style={{ fontSize: 19, color: t.text, lineHeight: 1.7 }}>
                "{q.text}"
              </div>
            </div>

            {/* Author */}
            <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${cardBorder}` }}>
              <div className="flex items-center gap-3">
                {/* Avatar initials */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-black text-sm shrink-0"
                  style={{
                    background: t.accentBg,
                    border: `1px solid ${t.accentBorder}`,
                    color: t.accent,
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}>
                  {q.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="font-display font-bold"
                    style={{ fontSize: 16, color: t.text, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {q.author}
                  </div>
                  {(q.role || q.company) && (
                    <div style={{ fontSize: 13, color: t.textMuted }}>
                      {[q.role, q.company].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
