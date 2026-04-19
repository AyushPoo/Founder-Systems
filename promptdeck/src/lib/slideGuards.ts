/**
 * slideGuards.ts — Slide normalization & render guards
 * Formats raw AI output before rendering: money, percentages, headlines, labels.
 */

// ─── Money / Number Formatting ─────────────────────────────────────────────

export function formatMoney(raw: string | number | undefined, currency = '$'): string {
  if (raw === undefined || raw === null || raw === '') return ''
  const s = String(raw).replace(/[^0-9.\-kmb]/gi, '')
  const n = parseFloat(s)
  if (isNaN(n)) return String(raw)

  // Already formatted (has $, ₹, €, £, K, M, B suffix)
  const str = String(raw)
  if (/[KMB]/i.test(str) && /[$₹€£]/.test(str)) return str

  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${currency}${+(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}${currency}${+(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${currency}${+(abs / 1_000).toFixed(0)}K`
  return `${sign}${currency}${abs}`
}

export function formatCompact(raw: string | number | undefined): string {
  if (raw === undefined || raw === null || raw === '') return ''
  const s = String(raw).trim()
  // Already has suffix
  if (/^[\d,.]+[KMBkmb%]$/.test(s)) return s.toUpperCase()
  const n = parseFloat(s.replace(/,/g, ''))
  if (isNaN(n)) return s
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function formatPercent(raw: string | number | undefined): string {
  if (raw === undefined || raw === null || raw === '') return ''
  const s = String(raw).replace('%', '').trim()
  const n = parseFloat(s)
  if (isNaN(n)) return String(raw)
  const clamped = Math.min(100, Math.max(0, n))
  return `${clamped % 1 === 0 ? clamped : clamped.toFixed(1)}%`
}

// ─── Headline Guards ────────────────────────────────────────────────────────

const CHAR_LIMIT = 72

export function shortenHeadline(text: string | undefined, limit = CHAR_LIMIT): string {
  if (!text) return ''
  const cleaned = cleanWhitespace(text)
  if (cleaned.length <= limit) return cleaned

  // Try to split at a natural boundary before the limit
  const cut = cleaned.lastIndexOf(' ', limit)
  if (cut > limit * 0.6) return cleaned.slice(0, cut) + '…'
  return cleaned.slice(0, limit) + '…'
}

export function splitHeadlineSubheadline(text: string | undefined): { headline: string; sub: string } {
  if (!text) return { headline: '', sub: '' }
  const cleaned = cleanWhitespace(text)

  // Already short enough
  if (cleaned.length <= CHAR_LIMIT) return { headline: cleaned, sub: '' }

  // Split on em dash, colon, or mid-sentence period
  const dashIdx = cleaned.indexOf(' — ')
  if (dashIdx > 0 && dashIdx < CHAR_LIMIT) {
    return { headline: cleaned.slice(0, dashIdx), sub: cleaned.slice(dashIdx + 3) }
  }
  const colonIdx = cleaned.indexOf(': ')
  if (colonIdx > 0 && colonIdx < CHAR_LIMIT) {
    return { headline: cleaned.slice(0, colonIdx), sub: cleaned.slice(colonIdx + 2) }
  }

  // Split at word boundary
  const cut = cleaned.lastIndexOf(' ', CHAR_LIMIT)
  return {
    headline: cut > CHAR_LIMIT * 0.6 ? cleaned.slice(0, cut) : cleaned.slice(0, CHAR_LIMIT),
    sub: cut > CHAR_LIMIT * 0.6 ? cleaned.slice(cut + 1) : cleaned.slice(CHAR_LIMIT),
  }
}

// ─── Label / Copy Guards ────────────────────────────────────────────────────

const GENERIC_COMPETITOR_LABELS = [
  'existing tools', 'legacy systems', 'traditional solutions', 'old software',
  'manual process', 'spreadsheets', 'email', 'status quo', 'competitors',
  'current solutions', 'existing solutions', 'traditional approach',
]

export function repairCompetitorLabel(label: string | undefined): string {
  if (!label) return 'Incumbent'
  const lower = label.toLowerCase().trim()
  if (GENERIC_COMPETITOR_LABELS.some(g => lower === g || lower.startsWith(g))) {
    return 'Incumbent'
  }
  return label
}

const GENERIC_PHRASES = [
  'we help businesses grow', 'built for the modern world', 'transforming the industry',
  'innovative solution', 'cutting-edge technology', 'seamless experience',
  'best-in-class', 'game-changing', 'revolutionary platform',
]

export function isGenericCopy(text: string | undefined): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return GENERIC_PHRASES.some(p => lower.includes(p))
}

// ─── Whitespace / Cleanup ───────────────────────────────────────────────────

export function cleanWhitespace(text: string | undefined): string {
  if (!text) return ''
  return text.replace(/\s+/g, ' ').trim()
}

// ─── Number Extraction ──────────────────────────────────────────────────────

export function extractNumber(raw: string | undefined): number | null {
  if (!raw) return null
  const s = String(raw).replace(/[$₹€£,]/g, '').trim()
  const multipliers: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 }
  const match = s.match(/^([\d.]+)([kmb]?)$/i)
  if (!match) return null
  const base = parseFloat(match[1])
  const mult = match[2] ? multipliers[match[2].toLowerCase()] ?? 1 : 1
  return base * mult
}

// ─── Slide-level Guard ──────────────────────────────────────────────────────

export function guardSlideProps(type: string, props: Record<string, any>): Record<string, any> {
  const out = { ...props }

  // Headline shortening on all slides
  if (out.headline) out.headline = shortenHeadline(out.headline)
  if (out.tagline) out.tagline = shortenHeadline(out.tagline, 80)

  // AskSlide: format amount
  if (type === 'AskSlide' && out.amount) {
    const n = extractNumber(String(out.amount))
    if (n !== null) out.amount = formatMoney(n)
  }

  // MarketSlide: format TAM/SAM/SOM
  if (type === 'MarketSlide') {
    for (const k of ['tam', 'sam', 'som']) {
      if (out[k]?.value) out[k] = { ...out[k], value: formatCompact(out[k].value) }
    }
  }

  // FinancialsSlide: clamp revenue to positive
  if (type === 'FinancialsSlide' && Array.isArray(out.revenue)) {
    out.revenue = out.revenue.map((v: any) => Math.max(0, Number(v) || 0))
  }

  // CompetitorSlide: repair generic labels
  if (type === 'CompetitorSlide' && Array.isArray(out.competitors)) {
    out.competitors = out.competitors.map((c: any) => ({
      ...c,
      name: repairCompetitorLabel(c.name),
    }))
  }

  // AskSlide: clamp use_of_funds percentages to sum 100
  if (type === 'AskSlide' && Array.isArray(out.use_of_funds)) {
    const total = out.use_of_funds.reduce((s: number, f: any) => s + (Number(f.percentage) || 0), 0)
    if (total > 0 && Math.abs(total - 100) > 1) {
      out.use_of_funds = out.use_of_funds.map((f: any) => ({
        ...f,
        percentage: Math.round((Number(f.percentage) / total) * 100),
      }))
    }
  }

  return out
}
