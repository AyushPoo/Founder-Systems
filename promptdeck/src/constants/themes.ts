export type ThemeKey = 'dark' | 'light' | 'bold' | 'navy' | 'forest' | 'rose' | 'custom'

export interface Theme {
  bg: string
  surface: string
  surfaceAlt: string
  border: string
  text: string
  textSub: string
  textMuted: string
  accent: string
  accentLight: string
  accentBg: string
  accentBorder: string
  isDark: boolean
}

export const THEMES: Record<string, Theme> = {
  dark: {
    bg: '#000000',
    surface: '#0D0D14',
    surfaceAlt: '#08001a',
    border: 'rgba(255,255,255,0.06)',
    text: '#ffffff',
    textSub: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.22)',
    accent: '#7C3AED',
    accentLight: '#A78BFA',
    accentBg: 'rgba(124,58,237,0.1)',
    accentBorder: 'rgba(124,58,237,0.3)',
    isDark: true,
  },
  light: {
    bg: '#FFFFFF',
    surface: '#F5F4FF',
    surfaceAlt: '#EDE9FE',
    border: 'rgba(0,0,0,0.07)',
    text: '#09090B',
    textSub: 'rgba(9,9,11,0.5)',
    textMuted: 'rgba(9,9,11,0.28)',
    accent: '#5B21B6',
    accentLight: '#7C3AED',
    accentBg: 'rgba(91,33,182,0.07)',
    accentBorder: 'rgba(91,33,182,0.2)',
    isDark: false,
  },
  navy: {
    bg: '#060E1E',
    surface: '#0D1B35',
    surfaceAlt: '#0a1628',
    border: 'rgba(59,130,246,0.12)',
    text: '#ffffff',
    textSub: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.22)',
    accent: '#3B82F6',
    accentLight: '#93C5FD',
    accentBg: 'rgba(59,130,246,0.1)',
    accentBorder: 'rgba(59,130,246,0.3)',
    isDark: true,
  },
  bold: {
    bg: '#0F0505',
    surface: '#1F0A0A',
    surfaceAlt: '#2D0E0E',
    border: 'rgba(239,68,68,0.15)',
    text: '#ffffff',
    textSub: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.22)',
    accent: '#EF4444',
    accentLight: '#FCA5A5',
    accentBg: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.3)',
    isDark: true,
  },
  forest: {
    bg: '#030D06',
    surface: '#071A0D',
    surfaceAlt: '#0a2412',
    border: 'rgba(34,197,94,0.12)',
    text: '#ffffff',
    textSub: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.22)',
    accent: '#22C55E',
    accentLight: '#86EFAC',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.3)',
    isDark: true,
  },
  rose: {
    bg: '#0F0308',
    surface: '#1F0712',
    surfaceAlt: '#2d0a1a',
    border: 'rgba(236,72,153,0.12)',
    text: '#ffffff',
    textSub: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.22)',
    accent: '#EC4899',
    accentLight: '#F9A8D4',
    accentBg: 'rgba(236,72,153,0.08)',
    accentBorder: 'rgba(236,72,153,0.3)',
    isDark: true,
  },
}

export function getTheme(deckStyle?: string): Theme {
  return THEMES[deckStyle || 'dark'] || THEMES.dark
}
