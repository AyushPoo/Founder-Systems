// src/constants.ts
export const API_BASE = 'https://n8n.foundersystems.in/pd'

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || ''

export const DEFAULT_DECK_STATE = {
  slides: [],
  activeSlideIndex: 0,
  dimensions: {},
  messages: [],
  confirmationCard: null,
  deckBuilt: false,
  credits: null,
  orderId: null,
}

export const SLIDE_ORDER = [
  'HeroSlide', 'ProblemSlide', 'SolutionSlide', 'MarketSlide',
  'TractionSlide', 'BusinessModelSlide', 'TeamSlide', 'CompetitorSlide',
  'FinancialsSlide', 'AskSlide', 'TimelineSlide', 'QuoteSlide'
]
