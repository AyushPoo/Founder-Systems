import { useRef } from 'react'
import type { ConfirmationCardData } from '../../types'
import { useChat } from '../../hooks/useChat'
import { useDeck } from '../../context/DeckContext'

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function UploadZone({ label, hint, preview, multiple, accept, onFiles, onRemove }: {
  label: string
  hint: string
  preview?: string | string[]
  multiple?: boolean
  accept?: string
  onFiles: (files: File[]) => void
  onRemove?: (index?: number) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const previews = Array.isArray(preview) ? preview : preview ? [preview] : []

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-primary uppercase tracking-wider">{label}</div>
      {previews.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative group">
              <img
                src={src}
                alt=""
                className="rounded-lg object-cover"
                style={{ width: multiple ? 56 : 80, height: multiple ? 56 : 56, border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button
                onClick={() => onRemove?.(multiple ? i : undefined)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                style={{ fontSize: 10 }}
              >×</button>
            </div>
          ))}
          {multiple && (
            <button
              onClick={() => ref.current?.click()}
              className="w-14 h-14 rounded-lg border border-dashed border-border flex items-center justify-center text-secondary hover:border-accent/60 transition-colors"
              style={{ fontSize: 22 }}
            >+</button>
          )}
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border hover:border-accent/50 transition-colors text-left w-full"
        >
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-secondary" style={{ fontSize: 18 }}>
            {label.includes('Logo') ? '🏷️' : label.includes('Photo') ? '🤳' : '📸'}
          </div>
          <div>
            <div className="text-sm text-secondary font-medium">Upload {label.toLowerCase()}</div>
            <div className="text-xs text-muted mt-0.5">{hint}</div>
          </div>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept || 'image/*'}
        multiple={multiple}
        className="hidden"
        onChange={async e => {
          const files = Array.from(e.target.files || [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export function ConfirmationCard({ card }: { card: ConfirmationCardData }) {
  const { confirmBuild } = useChat()
  const { state, dispatch } = useDeck()
  const s = card.summary
  const { assets } = state

  async function handleLogo(files: File[]) {
    const url = await readAsDataURL(files[0])
    dispatch({ type: 'SET_ASSET_LOGO', payload: url })
  }

  async function handlePhotos(files: File[]) {
    for (const file of files) {
      const url = await readAsDataURL(file)
      dispatch({ type: 'ADD_ASSET_PHOTO', payload: url })
    }
  }

  async function handleScreenshot(files: File[]) {
    const url = await readAsDataURL(files[0])
    dispatch({ type: 'SET_ASSET_SCREENSHOT', payload: url })
  }

  return (
    <div className="mx-2 mb-4 rounded-2xl border border-accent/40 bg-surface p-4 space-y-4">
      {/* Summary */}
      <div>
        <div className="text-xs font-semibold text-accent-light mb-3 uppercase tracking-wider">
          Here's what I've understood
        </div>
        <div className="space-y-1.5 text-sm text-secondary">
          {s.company && <div><span className="text-primary font-medium">Company:</span> {typeof s.company === 'object' ? s.company.name : s.company}</div>}
          {s.problem && <div><span className="text-primary font-medium">Problem:</span> {typeof s.problem === 'object' ? s.problem.statement : s.problem}</div>}
          {s.market && <div><span className="text-primary font-medium">Market:</span> {typeof s.market === 'object' ? `TAM: ${s.market.tam}` : s.market}</div>}
          {s.traction && <div><span className="text-primary font-medium">Traction:</span> {typeof s.traction === 'object' ? s.traction.users || s.traction.revenue : s.traction}</div>}
          {s.ask && <div><span className="text-primary font-medium">Ask:</span> {typeof s.ask === 'object' ? `${s.ask.amount} for ${s.ask.purpose}` : s.ask}</div>}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Asset uploads */}
      <div>
        <div className="text-xs font-semibold text-accent-light mb-3 uppercase tracking-wider">
          Make it personal <span className="text-muted normal-case font-normal tracking-normal ml-1">(optional)</span>
        </div>
        <div className="space-y-3">
          <UploadZone
            label="Company Logo"
            hint="PNG or SVG with transparent bg works best"
            preview={assets.logoDataUrl}
            onFiles={handleLogo}
            onRemove={() => dispatch({ type: 'SET_ASSET_LOGO', payload: '' })}
          />
          <UploadZone
            label="Founder Photos"
            hint="One per founder · will appear on the team slide"
            preview={assets.founderPhotos}
            multiple
            onFiles={handlePhotos}
            onRemove={(i) => i !== undefined && dispatch({ type: 'REMOVE_ASSET_PHOTO', payload: i })}
          />
          <UploadZone
            label="Product Screenshot"
            hint="App UI or dashboard · used on the solution slide"
            preview={assets.productScreenshot}
            onFiles={handleScreenshot}
            onRemove={() => dispatch({ type: 'SET_ASSET_SCREENSHOT', payload: '' })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={confirmBuild}
          className="flex-1 bg-accent hover:bg-accent/90 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          ✓ Build my deck
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_CONFIRMATION_CARD', payload: null })}
          className="flex-1 border border-border hover:border-secondary text-secondary rounded-xl py-2.5 text-sm transition-colors"
        >
          ✎ Edit this
        </button>
      </div>
    </div>
  )
}
