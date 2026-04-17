// src/types.ts
export interface SlideConfig {
  type: string
  props: Record<string, any>
}

export interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: number
}

export interface Dimensions {
  company: any
  problem: any
  solution: any
  market: any
  traction: any
  team: any
  business_model: any
  ask: any
}

export interface SlideDelta {
  action: 'update' | 'insert' | 'replace' | 'none'
  slide_index?: number
  slide_type?: string
  props?: Record<string, any>
}

export interface ConfirmationCardData {
  summary: Partial<Dimensions>
  ready: boolean
}

export interface ChatApiResponse {
  message: string
  slide_delta: SlideDelta
  confirmation_card: ConfirmationCardData | null
  dimensions: Dimensions
}

export interface DeckState {
  slides: SlideConfig[]
  activeSlideIndex: number
  dimensions: Partial<Dimensions>
  messages: Message[]
  confirmationCard: ConfirmationCardData | null
  deckBuilt: boolean
  credits: number | null
  orderId: string | null
}
