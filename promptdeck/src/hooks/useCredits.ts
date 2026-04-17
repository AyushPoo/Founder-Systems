import { useDeck } from '../context/DeckContext'
import { exportPdf, confirmPayment } from '../api/client'
import { API_BASE, RAZORPAY_KEY_ID } from '../constants'

declare global {
  interface Window { Razorpay: any }
}

export function useCredits() {
  const { state, dispatch } = useDeck()

  function loadRazorpay(): Promise<boolean> {
    return new Promise(resolve => {
      if (window.Razorpay) return resolve(true)
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload = () => resolve(true)
      s.onerror = () => resolve(false)
      document.body.appendChild(s)
    })
  }

  async function initiatePayment() {
    await loadRazorpay()
    const orderRes = await fetch(`${API_BASE}/payment/create-order`, { method: 'POST' })
    const { order_id } = await orderRes.json()
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      order_id,
      amount: 50000,
      currency: 'INR',
      name: 'PromptDeck AI',
      description: '3 PDF Deck Exports',
      handler: async (response: any) => {
        await confirmPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        )
        dispatch({ type: 'SET_ORDER_ID', payload: response.razorpay_order_id })
        dispatch({ type: 'SET_CREDITS', payload: 3 })
      },
    })
    rzp.open()
  }

  async function downloadPdf() {
    if (!state.orderId) return
    const blob = await exportPdf(state.slides, state.orderId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pitch-deck.pdf'
    a.click()
    URL.revokeObjectURL(url)
    dispatch({ type: 'SET_CREDITS', payload: (state.credits ?? 1) - 1 })
  }

  return { initiatePayment, downloadPdf }
}
