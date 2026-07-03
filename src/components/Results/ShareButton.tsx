import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { encodeShareState } from '../../utils/share'

/**
 * Share the current plan as a URL — the link *is* the save file in this
 * single-session app. Uses the native share sheet on phones, clipboard
 * elsewhere.
 */
export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const buildUrl = () => {
    const s = useAppStore.getState()
    const encoded = encodeShareState({
      pieces: s.pieces
        .filter((p) => p.width > 0 && p.height > 0)
        .map((p) => ({ label: p.label, width: p.width, height: p.height, quantity: p.quantity })),
      offcuts: s.offcuts
        .filter((o) => o.width > 0 && o.height > 0)
        .map((o) => ({ width: o.width, height: o.height })),
      sheetWidth: s.sheetWidth,
      sheetHeight: s.sheetHeight,
      kerfWidth: s.kerfWidth,
      optimizationMode: s.optimizationMode,
      sheetPricePerUnit: s.sheetPricePerUnit,
    })
    return `${window.location.origin}${window.location.pathname}#s=${encoded}`
  }

  const handleShare = async () => {
    const url = buildUrl()

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Plyplan cut plan', url })
        return
      } catch (err) {
        // User dismissed the share sheet — not an error, and don't fall
        // through to clipboard, they chose not to share.
        if ((err as DOMException)?.name === 'AbortError') return
        // Share failed for another reason — fall back to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Last resort for old browsers / non-secure contexts
      window.prompt('Copy this link:', url)
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="p-2.5 rounded-[var(--radius-input)] text-text-muted hover:bg-surface-raised hover:text-text-secondary transition-colors"
      title={copied ? 'Link copied!' : 'Share link to this plan'}
      aria-label="Share link to this plan"
    >
      {copied ? <Check size={16} className="text-success" /> : <Share2 size={16} />}
    </button>
  )
}
