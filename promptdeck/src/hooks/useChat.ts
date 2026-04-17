import { useState } from 'react'
import { useDeck } from '../context/DeckContext'
import { sendMessage, buildDeck } from '../api/client'

export function useChat() {
  const { state, dispatch } = useDeck()
  const [loading, setLoading] = useState(false)

  async function send(text: string) {
    if (!text.trim() || loading) return
    setLoading(true)
    
    dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', content: text, timestamp: Date.now() } })
    
    const history = state.messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
    
    try {
      const activeSlide = state.slides[state.activeSlideIndex]
      const res = await sendMessage(
        text, history, state.dimensions,
        state.deckBuilt ? state.activeSlideIndex : undefined,
        state.deckBuilt ? activeSlide?.type : undefined
      )
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'ai', content: res.message, timestamp: Date.now() } })
      dispatch({ type: 'UPDATE_DIMENSIONS', payload: res.dimensions as any })
      
      if (res.slide_delta.action !== 'none') {
        dispatch({ type: 'APPLY_SLIDE_DELTA', payload: res.slide_delta })
      }
      
      if (res.confirmation_card) {
        dispatch({ type: 'SET_CONFIRMATION_CARD', payload: res.confirmation_card })
      }
    } catch (e: any) {
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'ai', content: `Error: ${e.message}`, timestamp: Date.now() } })
    } finally {
      setLoading(false)
    }
  }

  async function confirmBuild() {
    setLoading(true)
    dispatch({ type: 'SET_CONFIRMATION_CARD', payload: null })
    dispatch({ type: 'ADD_MESSAGE', payload: { role: 'ai', content: 'Building your deck now...', timestamp: Date.now() } })
    
    try {
      const { slides } = await buildDeck(state.dimensions)
      dispatch({ type: 'SET_SLIDES', payload: slides })
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'ai', content: `Your deck is ready! ${slides.length} slides built. Click any slide to edit, or keep chatting to refine it.`, timestamp: Date.now() } })
    } catch (e: any) {
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'ai', content: `Failed to build deck: ${e.message}`, timestamp: Date.now() } })
    } finally {
      setLoading(false)
    }
  }

  return { send, confirmBuild, loading }
}
