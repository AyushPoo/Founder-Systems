import { describe, it, expect } from 'vitest'
import {
  formatMoney,
  formatCompact,
  formatPercent,
  shortenHeadline,
  splitHeadlineSubheadline,
  repairCompetitorLabel,
  isGenericCopy,
  cleanWhitespace,
  extractNumber,
  guardSlideProps,
} from './slideGuards'

describe('formatMoney', () => {
  it('formats raw numbers to compact currency', () => {
    expect(formatMoney(750000)).toBe('$750K')
    expect(formatMoney(1500000)).toBe('$1.5M')
    expect(formatMoney(2000000000)).toBe('$2B')
    expect(formatMoney(500)).toBe('$500')
  })
  it('leaves already-formatted strings alone', () => {
    expect(formatMoney('$750K')).toBe('$750K')
    expect(formatMoney('$1.2M')).toBe('$1.2M')
  })
  it('handles rupee symbol', () => {
    expect(formatMoney(5000000, '₹')).toBe('₹5M')
  })
  it('handles undefined gracefully', () => {
    expect(formatMoney(undefined)).toBe('')
  })
})

describe('formatCompact', () => {
  it('converts large numbers to suffix format', () => {
    expect(formatCompact(12000)).toBe('12K')
    expect(formatCompact(2500000)).toBe('2.5M')
    expect(formatCompact('840')).toBe('840')
  })
  it('passes through already-suffixed strings', () => {
    expect(formatCompact('$3B')).toBe('$3B')
  })
})

describe('formatPercent', () => {
  it('formats percentage values', () => {
    expect(formatPercent(25)).toBe('25%')
    expect(formatPercent('33.3')).toBe('33.3%')
    expect(formatPercent(150)).toBe('100%')
    expect(formatPercent(-5)).toBe('0%')
  })
  it('handles undefined', () => {
    expect(formatPercent(undefined)).toBe('')
  })
})

describe('shortenHeadline', () => {
  it('leaves short headlines unchanged', () => {
    const short = 'AI grades exams in minutes'
    expect(shortenHeadline(short)).toBe(short)
  })
  it('shortens long headlines at word boundary', () => {
    const long = 'We help Indian educational institutions grade 50,000 handwritten exam papers per day with AI, reducing teacher workload by 80%'
    const result = shortenHeadline(long)
    expect(result.length).toBeLessThanOrEqual(73) // 72 + ellipsis
    expect(result.endsWith('…')).toBe(true)
  })
  it('handles undefined', () => {
    expect(shortenHeadline(undefined)).toBe('')
  })
})

describe('splitHeadlineSubheadline', () => {
  it('splits on em dash', () => {
    const { headline, sub } = splitHeadlineSubheadline('GradeSense — AI that grades exams so teachers don\'t have to work weekends')
    expect(headline).toBe('GradeSense')
    expect(sub).toContain('AI that grades')
  })
  it('splits on colon for long strings', () => {
    const { headline, sub } = splitHeadlineSubheadline('The Problem: Manual grading burns 20+ hours per teacher per week every single academic term without fail')
    expect(headline).toBe('The Problem')
    expect(sub).toContain('Manual grading')
  })
  it('returns full text as headline if short', () => {
    const { headline, sub } = splitHeadlineSubheadline('Short headline')
    expect(headline).toBe('Short headline')
    expect(sub).toBe('')
  })
})

describe('repairCompetitorLabel', () => {
  it('replaces generic labels', () => {
    expect(repairCompetitorLabel('Existing tools')).toBe('Incumbent')
    expect(repairCompetitorLabel('manual process')).toBe('Incumbent')
    expect(repairCompetitorLabel('Legacy Systems')).toBe('Incumbent')
  })
  it('preserves real company names', () => {
    expect(repairCompetitorLabel('Digimark')).toBe('Digimark')
    expect(repairCompetitorLabel('Turnitin')).toBe('Turnitin')
  })
  it('handles undefined', () => {
    expect(repairCompetitorLabel(undefined)).toBe('Incumbent')
  })
})

describe('isGenericCopy', () => {
  it('detects generic startup-speak', () => {
    expect(isGenericCopy('We help businesses grow')).toBe(true)
    expect(isGenericCopy('Built for the modern world')).toBe(true)
  })
  it('passes specific copy', () => {
    expect(isGenericCopy('Grades 840 exam papers in 4 minutes')).toBe(false)
  })
})

describe('cleanWhitespace', () => {
  it('normalizes multiple spaces and trims', () => {
    expect(cleanWhitespace('  hello   world  ')).toBe('hello world')
  })
  it('handles undefined', () => {
    expect(cleanWhitespace(undefined)).toBe('')
  })
})

describe('extractNumber', () => {
  it('extracts raw numbers', () => {
    expect(extractNumber('750000')).toBe(750000)
    expect(extractNumber('$1.5M')).toBe(1500000)
    expect(extractNumber('₹50K')).toBe(50000)
  })
  it('returns null for non-numeric', () => {
    expect(extractNumber('seed')).toBeNull()
    expect(extractNumber(undefined)).toBeNull()
  })
})

describe('guardSlideProps', () => {
  it('formats AskSlide amount', () => {
    const result = guardSlideProps('AskSlide', { amount: '750000', use_of_funds: [] })
    expect(result.amount).toBe('$750K')
  })
  it('repairs generic competitor labels', () => {
    const result = guardSlideProps('CompetitorSlide', {
      competitors: [{ name: 'existing tools', x: 3, y: 3 }, { name: 'Turnitin', x: 7, y: 4 }]
    })
    expect(result.competitors[0].name).toBe('Incumbent')
    expect(result.competitors[1].name).toBe('Turnitin')
  })
  it('shortens long headlines', () => {
    const long = 'This is an incredibly long headline that goes well beyond the seventy two character limit we have set for slide headings in the application'
    const result = guardSlideProps('HeroSlide', { headline: long })
    expect(result.headline.length).toBeLessThanOrEqual(73)
  })
  it('clamps use_of_funds to 100%', () => {
    const result = guardSlideProps('AskSlide', {
      amount: '$1M',
      use_of_funds: [
        { label: 'Engineering', percentage: 60 },
        { label: 'Sales', percentage: 30 },
        { label: 'Marketing', percentage: 30 },
      ]
    })
    const total = result.use_of_funds.reduce((s: number, f: any) => s + f.percentage, 0)
    expect(total).toBe(100)
  })
})
