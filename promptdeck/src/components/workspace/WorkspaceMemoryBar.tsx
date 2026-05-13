import { useEffect, useMemo, useState } from 'react'
import { useDeck } from '../../context/DeckContext'

const API_BASE = 'https://api.foundersystems.in'
const RELEVANT_TYPES = new Set([
  'venture_summary',
  'target_customer',
  'buyer_role',
  'problem_statement',
  'offer',
  'proof_point',
  'pricing_hypothesis',
  'brand_tone',
  'messaging_angle',
  'deck_narrative_seed',
])

type MemoryItem = {
  id?: string
  type?: string
  label?: string
  value_json?: { text?: string }
  summary_text?: string
  status?: string
}

async function fetchJson(path: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('Request failed')
  return response.json()
}

function buildPrompt(items: MemoryItem[]) {
  const lines = ['Founder Workspace context for this deck:']
  items.slice(0, 8).forEach((item) => {
    const type = String(item.type || item.label || 'memory').replace(/_/g, ' ')
    const text = String(item.value_json?.text || item.summary_text || '').trim()
    if (text) {
      lines.push(`- ${type}: ${text}`)
    }
  })
  return lines.join('\n')
}

export function WorkspaceMemoryBar() {
  const { dispatch } = useDeck()
  const [authenticated, setAuthenticated] = useState(false)
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([])
  const [imported, setImported] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      setLoading(true)
      try {
        const session = await fetchJson('/auth/session')
        if (!session?.authenticated) {
          if (!cancelled) {
            setAuthenticated(false)
            setMemoryItems([])
          }
          return
        }
        const memory = await fetchJson('/workspace/memory')
        if (!cancelled) {
          setAuthenticated(true)
          setMemoryItems(Array.isArray(memory?.items) ? memory.items.filter((item: MemoryItem) => item.status === 'active' && RELEVANT_TYPES.has(String(item.type || ''))) : [])
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false)
          setMemoryItems([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const chips = useMemo(
    () => memoryItems.slice(0, 4).map((item) => String(item.label || item.type || 'Memory').replace(/_/g, ' ')),
    [memoryItems]
  )

  if (loading || !authenticated || imported || memoryItems.length === 0) {
    return null
  }

  return (
    <div className="border-b border-border bg-surface px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">Founder workspace memory</div>
          <div className="mt-1 text-xs text-secondary">
            Reuse your shared company context before you ask PromptDeck to build the narrative.
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full border border-border bg-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">
                {chip}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            const prompt = buildPrompt(memoryItems)
            dispatch({ type: 'ADD_MESSAGE', payload: { role: 'ai', content: 'Founder Workspace context is ready. I will use it as background for the deck.', timestamp: Date.now() } })
            dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', content: prompt, timestamp: Date.now() } })
            setImported(true)
          }}
          className="rounded-xl border border-border bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Use workspace memory
        </button>
      </div>
    </div>
  )
}
