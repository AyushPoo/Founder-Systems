// src/api/client.ts
import { API_BASE } from '../constants'
import type { ChatApiResponse } from '../types'

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res
}

export async function uploadReference(file: File): Promise<{ ref_id: string; filename: string; preview: string; full_text: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Upload error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function sendMessage(
  message: string,
  history: { role: string; content: string }[],
  currentDimensions: Record<string, any>,
  activeSlideIndex?: number,
  activeSlideType?: string
): Promise<ChatApiResponse> {
  const res = await apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      history,
      current_dimensions: currentDimensions,
      active_slide_index: activeSlideIndex ?? null,
      active_slide_type: activeSlideType ?? null,
    }),
  })
  return res.json()
}

export async function buildDeck(dimensions: Record<string, any>) {
  const res = await apiFetch('/build', {
    method: 'POST',
    body: JSON.stringify({ dimensions }),
  })
  return res.json() as Promise<{ slides: any[] }>
}

export async function regenerateSlide(slideType: string, dimensions: Record<string, any>, prompt?: string) {
  const res = await apiFetch('/regenerate', {
    method: 'POST',
    body: JSON.stringify({ slide_type: slideType, dimensions, prompt }),
  })
  return res.json() as Promise<{ slide: any }>
}

export async function getCredits(orderId: string): Promise<number> {
  const res = await apiFetch(`/credits/${orderId}`)
  const data = await res.json()
  return data.remaining
}

export async function exportPdf(slides: any[], orderId: string): Promise<Blob> {
  const res = await apiFetch('/export', {
    method: 'POST',
    body: JSON.stringify({ slides, order_id: orderId }),
  })
  return res.blob()
}

export async function confirmPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  const res = await apiFetch('/payment/confirm', {
    method: 'POST',
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    }),
  })
  return res.json()
}
