import { useState } from 'react'
import { useDeck } from '../context/DeckContext'
import type { DeckStyleType } from '../context/DeckContext'
import { sendMessage, buildDeck, buildFromDescription, analyzeReferenceApi } from '../api/client'
import type { Reference } from '../context/DeckContext'

function addMsg(dispatch: any, content: string) {
  dispatch({ type: 'ADD_MESSAGE', payload: { role: 'ai', content, timestamp: Date.now() } })
}

export function useChat() {
  const { state, dispatch } = useDeck()
  const [loading, setLoading] = useState(false)

  async function send(text: string, references: Reference[] = []) {
    const hasContent = text.trim() || references.length > 0
    if (!hasContent || loading) return
    setLoading(true)

    let fullMessage = text
    if (references.length > 0) {
      const refBlock = references.map(r => `[Reference: ${r.filename}]\n${r.full_text}`).join('\n\n---\n\n')
      fullMessage = `${refBlock}\n\n---\n\nUser message: ${text || '(see references above)'}`
    }

    const displayContent = text || `📎 ${references.map(r => r.filename).join(', ')}`
    dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', content: displayContent, timestamp: Date.now() } })

    const history = state.messages.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }))

    try {
      const activeSlide = state.slides[state.activeSlideIndex]
      const res = await sendMessage(
        fullMessage, history, state.dimensions,
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
      addMsg(dispatch, `Something went wrong — ${e.message}. Try again.`)
    } finally {
      setLoading(false)
    }
  }

  async function analyzeReference(ref: Reference) {
    setLoading(true)
    try {
      const result = await analyzeReferenceApi(ref.filename, ref.full_text, state.dimensions)
      addMsg(dispatch, result.message)
      if (result.dimensions && Object.keys(result.dimensions).length > 0) {
        dispatch({ type: 'UPDATE_DIMENSIONS', payload: result.dimensions })
      }
      // Apply brand style inferred from uploaded reference
      const brand = result.brand
      if (brand) {
        const notes = (brand.style_notes || '').toLowerCase()
        const color = (brand.primary_color || '').toLowerCase()
        let detectedStyle: DeckStyleType | null = null
        if (notes.includes('light') || notes.includes('white') || notes.includes('minimal clean') || notes.includes('clean white')) {
          detectedStyle = 'light'
        } else if (notes.includes('navy') || notes.includes('blue') || color.includes('1e3') || color.includes('0d1')) {
          detectedStyle = 'navy'
        } else if (notes.includes('green') || color.includes('10b') || color.includes('22c')) {
          detectedStyle = 'forest'
        } else if (notes.includes('red') || notes.includes('coral') || color.includes('ef4') || color.includes('f43')) {
          detectedStyle = 'bold'
        } else if (notes.includes('pink') || notes.includes('rose') || color.includes('ec4')) {
          detectedStyle = 'rose'
        }
        if (detectedStyle) {
          dispatch({ type: 'SET_DECK_STYLE', payload: detectedStyle })
          addMsg(dispatch, `I matched your brand to the **${detectedStyle}** theme — you can change it anytime with the style picker.`)
        }
      }
    } catch {
      addMsg(dispatch, `I've read **${ref.filename}** and will use it as context for your deck.`)
    } finally {
      setLoading(false)
    }
  }

  async function confirmBuild() {
    setLoading(true)
    dispatch({ type: 'SET_CONFIRMATION_CARD', payload: null })
    addMsg(dispatch, '✨ Perfect — building your 10-slide deck now. This takes about 20–30 seconds...')

    try {
      const { slides } = await buildDeck(state.dimensions)
      dispatch({ type: 'SET_SLIDES', payload: slides })
      addMsg(dispatch, `Your deck is ready — ${slides.length} slides, investor-grade. Use ← → to navigate, click any text to edit.`)
    } catch (e: any) {
      addMsg(dispatch, `Deck generation failed: ${e.message}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  async function buildDirect(description: string) {
    if (!description.trim() || loading) return
    setLoading(true)
    dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', content: description, timestamp: Date.now() } })
    addMsg(dispatch, '⚡ Got it — extracting your startup details and building the deck. Give me 30 seconds...')
    try {
      const { slides } = await buildFromDescription(description)
      dispatch({ type: 'SET_SLIDES', payload: slides })
      addMsg(dispatch, `Your deck is ready — ${slides.length} slides built from your description. Chat to refine any slide.`)
    } catch (e: any) {
      addMsg(dispatch, `Build failed: ${e.message}. Try again or chat to give me more details.`)
    } finally {
      setLoading(false)
    }
  }

  return { send, analyzeReference, confirmBuild, buildDirect, loading }
}
