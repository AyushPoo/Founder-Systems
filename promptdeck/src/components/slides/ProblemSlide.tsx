import { AlertTriangle, TrendingDown, Clock, DollarSign, Users, Lock, Zap, AlertCircle, XCircle } from 'lucide-react'
import { EditableText } from './EditableText'
import { useDeck } from '../../context/DeckContext'
import { getTheme } from '../../constants/themes'

interface PainPoint { icon?: string; title?: string; text: string }
interface Props {
  headline?: string; pain_points?: PainPoint[]
  stat?: { value: string; label: string }; imageUrl?: string
  layout?: string; slideIndex: number; deckStyle?: string
}

const ICON_MAP: Record<string, any> = {
  clock: Clock,
  time: Clock,
  dollar: DollarSign,
  money: DollarSign,
  cost: DollarSign,
  users: Users,
  people: Users,
  lock: Lock,
  security: Lock,
  zap: Zap,
  alert: AlertTriangle,
  warning: AlertTriangle,
  trend: TrendingDown,
  down: TrendingDown,
  x: XCircle,
  circle: AlertCircle,
}
const ICONS = [Clock, TrendingDown, DollarSign, AlertTriangle]

function headlineSize(text: string) {
  const n = (text || '').length
  if (n <= 25) return 60; if (n <= 45) return 46; if (n <= 65) return 36; return 30
}

const RED = '#EF4444'
const redBg = 'rgba(239,68,68,0.07)'
const redBorder = 'rgba(239,68,68,0.18)'

// --- CARDS LAYOUT (Copy.ai style — 2×2 pain point cards) ---
function ProblemCards({ headline, pain_points, up, t }: any) {
  const points: PainPoint[] = pain_points?.length ? pain_points : [
    { icon: 'clock', title: 'Time-intensive', text: 'Takes too long to create content your business needs' },
    { icon: 'dollar', title: "Writer's Block", text: 'Hard to start — staring at a blank page burns hours' },
    { icon: 'lock', title: 'Outsourcing is Expensive', text: 'Most businesses cannot afford a copywriter or agency' },
    { icon: 'trend', title: 'Limited Creativity', text: 'Challenging to think of fresh ideas consistently' },
  ]
  const hl = headline || 'Something is fundamentally broken'
  const fs = hl.length <= 35 ? 56 : hl.length <= 55 ? 44 : 36

  return (
    <div className="w-full h-full flex" style={{ background: t.bg }}>
      {/* Left: headline panel */}
      <div className="w-5/12 shrink-0 flex flex-col justify-between px-16 py-16 relative"
        style={{ borderRight: `1px solid ${t.border}` }}>
        <div className="absolute top-0 left-0 bottom-0 w-1" style={{ background: RED }} />
        <div className="ml-4">
          <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-5" style={{ color: RED }}>The Problem</div>
          <EditableText value={hl} onChange={up('headline')} tag="h2" className="font-display font-black"
            style={{ fontSize: fs, letterSpacing: '-1.5px', lineHeight: 1.1,
              fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
        </div>
        <div className="ml-4">
          <div className="w-8 h-0.5 mb-4" style={{ background: RED }} />
          <div style={{ fontSize: 16, color: t.textMuted }}>
            {points.length} critical pain points
          </div>
        </div>
      </div>
      {/* Right: 2×2 cards */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-0">
        {points.slice(0, 4).map((p: PainPoint, i: number) => {
          const Icon = ICON_MAP[p.icon || ''] || ICONS[i % ICONS.length]
          const col = i % 2
          const row = Math.floor(i / 2)
          return (
            <div key={i} className="flex flex-col justify-start p-10"
              style={{
                borderRight: col === 0 ? `1px solid ${t.border}` : 'none',
                borderBottom: row === 0 ? `1px solid ${t.border}` : 'none',
                background: i === 0 ? (t.isDark ? 'rgba(239,68,68,0.04)' : '#FFF9F9') : 'transparent',
              }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shrink-0"
                style={{ background: redBg, border: `1px solid ${redBorder}` }}>
                <Icon size={20} color={RED} strokeWidth={1.5} />
              </div>
              {p.title && (
                <div className="font-display font-bold mb-2"
                  style={{ fontSize: 20, color: t.text, fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 1.2 }}>
                  {p.title}
                </div>
              )}
              <div style={{ fontSize: 17, color: t.textSub, lineHeight: 1.6 }}>{p.text}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- STATEMENT LAYOUT (original — headline + bullets + big stat) ---
function ProblemStatement({ headline, pain_points, stat, imageUrl, up, slideIndex, dispatch, t }: any) {
  const points: PainPoint[] = pain_points?.length ? pain_points : [
    { text: 'Current solutions are fragmented and expensive' },
    { text: 'The market is underserved and growing fast' },
    { text: 'Every day of inaction compounds the cost' },
  ]
  const hl = headline || 'Something is fundamentally broken'
  const fs = headlineSize(hl)
  const rightBg = t.isDark ? '#0A0000' : '#FFF5F5'
  const rightBorder = t.isDark ? '#1a0000' : 'rgba(239,68,68,0.12)'
  return (
    <div className="w-full h-full flex" style={{ background: t.bg }}>
      <div className="flex-1 flex flex-col justify-center px-20 py-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-0.5" style={{ background: RED }} />
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-[0.3em] uppercase mb-5" style={{ color: RED }}>The Problem</div>
          <EditableText value={hl} onChange={up('headline')} tag="h2" className="font-display font-black"
            style={{ fontSize: fs, letterSpacing: '-1px', lineHeight: 1.1,
              fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
        </div>
        <div className="flex flex-col gap-6">
          {points.map((p: PainPoint, i: number) => {
            const Icon = ICON_MAP[p.icon || ''] || ICONS[i % ICONS.length]
            return (
              <div key={i} className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: redBg, border: `1px solid ${redBorder}` }}>
                  <Icon size={18} color={RED} strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 22, lineHeight: 1.55, color: t.textSub }}>{p.text}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="w-5/12 shrink-0 flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: rightBg, borderLeft: `1px solid ${rightBorder}` }}>
        {imageUrl && (
          <>
            <div className="absolute inset-0" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: t.isDark ? 0.12 : 0.18 }} />
            <div className="absolute inset-0" style={{ background: t.isDark ? 'linear-gradient(to bottom, #0a0000, rgba(10,0,0,0.85))' : 'linear-gradient(to bottom, rgba(255,245,245,0.9), rgba(255,245,245,0.75))' }} />
          </>
        )}
        <div className="relative z-10 text-center px-10">
          <EditableText value={stat?.value || '$500B'}
            onChange={(v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: 'stat', value: { ...(stat || {}), value: v } } })}
            className="font-display font-black leading-none"
            style={{ fontSize: 88, letterSpacing: '-3px', color: RED, fontFamily: "'Bricolage Grotesque', sans-serif" }} />
          <div className="mt-4 font-medium" style={{ fontSize: 20, color: t.textSub, lineHeight: 1.4 }}>
            {stat?.label || 'annual cost of the problem'}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- STATS LAYOUT (3 columns, each with big red number) ---
function ProblemStats({ headline, pain_points, up, t }: any) {
  const points: PainPoint[] = pain_points?.length ? pain_points : [
    { text: '$500B lost annually to inefficiency' },
    { text: '73% of teams report burnout from manual work' },
    { text: '4.2 hours wasted per employee per day' },
  ]
  function extractStat(text: string) {
    const match = text.match(/(\$[\d,.]+[BMK]?|[\d,.]+[%×xBMK+]+|[\d,.]+\s*(?:hours?|days?|months?|years?))/i)
    if (match) return { value: match[0], context: text.replace(match[0], '').replace(/^\s*[-–—]\s*/, '').trim() || text }
    const words = text.split(' ')
    return { value: words.slice(0, 2).join(' '), context: words.slice(2).join(' ') || text }
  }
  const stats = points.slice(0, 3).map((p: PainPoint) => extractStat(p.text))
  return (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="px-20 pt-14 shrink-0">
        <div className="text-xs font-semibold tracking-[0.35em] uppercase mb-3" style={{ color: RED }}>The Problem</div>
        <EditableText value={headline || 'The scale of the problem'} onChange={up('headline')} tag="h2"
          className="font-display font-black"
          style={{ fontSize: 42, letterSpacing: '-1.5px', fontFamily: "'Bricolage Grotesque', sans-serif", color: t.text }} />
      </div>
      <div className="flex-1 grid grid-cols-3" style={{ marginTop: 32 }}>
        {stats.map((s: { value: string; context: string }, i: number) => (
          <div key={i} className="flex flex-col justify-center px-16 py-10 relative"
            style={{ borderRight: i < 2 ? `1px solid ${t.border}` : 'none' }}>
            <div className="font-display font-black leading-none mb-5"
              style={{ fontSize: 80, letterSpacing: '-3px', color: RED,
                fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 0.9 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 20, color: t.textSub, lineHeight: 1.5 }}>{s.context}</div>
            <div className="absolute bottom-0 left-16 right-16 h-0.5 opacity-20" style={{ background: RED }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProblemSlide({ headline, pain_points = [], stat, imageUrl, layout = 'cards', slideIndex, deckStyle }: Props) {
  const { dispatch } = useDeck()
  const t = getTheme(deckStyle)
  const up = (k: string) => (v: string) => dispatch({ type: 'UPDATE_SLIDE_PROP', payload: { index: slideIndex, key: k, value: v } })
  const shared = { headline, pain_points, stat, imageUrl, up, slideIndex, dispatch, t }
  if (layout === 'statement') return <ProblemStatement {...shared} />
  if (layout === 'stats') return <ProblemStats {...shared} />
  return <ProblemCards {...shared} />
}
