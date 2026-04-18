import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { DeckState, SlideConfig, Message, Dimensions, ConfirmationCardData, SlideDelta } from '../types'
import { DEFAULT_DECK_STATE } from '../constants'

export interface Reference {
  ref_id: string
  filename: string
  preview: string
  full_text: string
}

export type DeckStyleType = 'dark' | 'light' | 'bold' | 'navy' | 'forest' | 'rose' | 'custom'

interface FullDeckState extends DeckState {
  references: Reference[]
  dragMode: boolean
  deckStyle: DeckStyleType
  prevSlideIndex: number
  customStyleUrl?: string
}

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
  | { type: 'ADD_REFERENCE'; payload: Reference }
  | { type: 'REMOVE_REFERENCE'; payload: string }
  | { type: 'CLEAR_REFERENCES' }
  | { type: 'SET_DRAG_MODE'; payload: boolean }
  | { type: 'SET_DECK_STYLE'; payload: DeckStyleType }
  | { type: 'SET_CUSTOM_STYLE'; payload: string }

function reducer(state: FullDeckState, action: Action): FullDeckState {
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
      return { ...state, prevSlideIndex: state.activeSlideIndex, activeSlideIndex: action.payload }
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
    case 'ADD_REFERENCE':
      return { ...state, references: [...state.references, action.payload] }
    case 'REMOVE_REFERENCE':
      return { ...state, references: state.references.filter(r => r.ref_id !== action.payload) }
    case 'CLEAR_REFERENCES':
      return { ...state, references: [] }
    case 'SET_DRAG_MODE':
      return { ...state, dragMode: action.payload }
    case 'SET_DECK_STYLE':
      return { ...state, deckStyle: action.payload }
    case 'SET_CUSTOM_STYLE':
      return { ...state, deckStyle: 'custom', customStyleUrl: action.payload }
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
  state: FullDeckState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function DeckProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...(DEFAULT_DECK_STATE as DeckState),
    references: [],
    dragMode: false,
    deckStyle: 'dark',
    prevSlideIndex: 0,
    customStyleUrl: undefined,
  } as FullDeckState)
  return <DeckContext.Provider value={{ state, dispatch }}>{children}</DeckContext.Provider>
}

export function useDeck() {
  const ctx = useContext(DeckContext)
  if (!ctx) throw new Error('useDeck must be used within DeckProvider')
  return ctx
}
