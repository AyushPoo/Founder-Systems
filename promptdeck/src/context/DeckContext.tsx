import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { DeckState, SlideConfig, Message, Dimensions, ConfirmationCardData, SlideDelta } from '../types'
import { DEFAULT_DECK_STATE } from '../constants'

type Action =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_SLIDES'; payload: SlideConfig[] }
  | { type: 'UPDATE_SLIDE'; payload: { index: number; slide: SlideConfig } }
  | { type: 'INSERT_SLIDE'; payload: { index: number; slide: SlideConfig } }
  | { type: 'SET_ACTIVE_SLIDE'; payload: number }
  | { type: 'UPDATE_SLIDE_PROP'; payload: { index: number; key: string; value: any } }
  | { type: 'UPDATE_DIMENSIONS'; payload: Partial<Dimensions> }
  | { type: 'SET_CONFIRMATION_CARD'; payload: ConfirmationCardData | null }
  | { type: 'SET_DECK_BUILT'; payload: boolean }
  | { type: 'SET_CREDITS'; payload: number }
  | { type: 'SET_ORDER_ID'; payload: string }
  | { type: 'APPLY_SLIDE_DELTA'; payload: SlideDelta }
  | { type: 'REORDER_SLIDES'; payload: SlideConfig[] }

function reducer(state: DeckState, action: Action): DeckState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }

    case 'SET_SLIDES':
      return { ...state, slides: action.payload, deckBuilt: true }

    case 'UPDATE_SLIDE': {
      const slides = [...state.slides]
      slides[action.payload.index] = action.payload.slide
      return { ...state, slides }
    }

    case 'INSERT_SLIDE': {
      const slides = [...state.slides]
      slides.splice(action.payload.index, 0, action.payload.slide)
      return { ...state, slides }
    }

    case 'SET_ACTIVE_SLIDE':
      return { ...state, activeSlideIndex: action.payload }

    case 'UPDATE_SLIDE_PROP': {
      const slides = [...state.slides]
      slides[action.payload.index] = {
        ...slides[action.payload.index],
        props: { ...slides[action.payload.index].props, [action.payload.key]: action.payload.value }
      }
      return { ...state, slides }
    }

    case 'UPDATE_DIMENSIONS':
      return { ...state, dimensions: { ...state.dimensions, ...action.payload } }

    case 'SET_CONFIRMATION_CARD':
      return { ...state, confirmationCard: action.payload }

    case 'SET_DECK_BUILT':
      return { ...state, deckBuilt: action.payload }

    case 'SET_CREDITS':
      return { ...state, credits: action.payload }

    case 'SET_ORDER_ID':
      return { ...state, orderId: action.payload }

    case 'REORDER_SLIDES':
      return { ...state, slides: action.payload }

    case 'APPLY_SLIDE_DELTA': {
      const delta = action.payload
      if (delta.action === 'none' || !delta.slide_type) return state
      const newSlide: SlideConfig = { type: delta.slide_type, props: delta.props || {} }
      const slides = [...state.slides]
      if (delta.action === 'update' || delta.action === 'replace') {
        const idx = delta.slide_index ?? 0
        slides[idx] = newSlide
      } else if (delta.action === 'insert') {
        const idx = delta.slide_index ?? slides.length
        slides.splice(idx, 0, newSlide)
      }
      return { ...state, slides }
    }

    default:
      return state
  }
}

const DeckContext = createContext<{
  state: DeckState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function DeckProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_DECK_STATE as DeckState)
  return <DeckContext.Provider value={{ state, dispatch }}>{children}</DeckContext.Provider>
}

export function useDeck() {
  const ctx = useContext(DeckContext)
  if (!ctx) throw new Error('useDeck must be used within DeckProvider')
  return ctx
}
