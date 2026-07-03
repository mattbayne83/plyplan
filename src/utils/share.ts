import type { OptimizationMode } from '../types/plyplan'

export interface SharedState {
  pieces: Array<{ label: string; width: number; height: number; quantity: number }>
  offcuts: Array<{ width: number; height: number }>
  sheetWidth: number
  sheetHeight: number
  kerfWidth: number
  optimizationMode: OptimizationMode
  sheetPricePerUnit: number
}

// Wire format v1 (kept terse — this travels in a URL):
//   { v: 1, p: [[label, w, h, qty]...], o: [[w, h]...], s: [sw, sh, kerf, mode, price] }
// mode: 0 = minimize-waste, 1 = minimize-saw-changes.
// The Gemini API key is deliberately never encoded.

const MAX_PIECES = 200
const MAX_OFFCUTS = 50

export function encodeShareState(state: SharedState): string {
  const wire = {
    v: 1,
    p: state.pieces.map((p) => [p.label, p.width, p.height, p.quantity]),
    o: state.offcuts.map((o) => [o.width, o.height]),
    s: [
      state.sheetWidth,
      state.sheetHeight,
      state.kerfWidth,
      state.optimizationMode === 'minimize-saw-changes' ? 1 : 0,
      state.sheetPricePerUnit,
    ],
  }
  return base64UrlEncode(JSON.stringify(wire))
}

export function decodeShareState(encoded: string): SharedState | null {
  try {
    const wire = JSON.parse(base64UrlDecode(encoded))
    if (wire?.v !== 1) return null
    if (!Array.isArray(wire.p) || !Array.isArray(wire.o) || !Array.isArray(wire.s)) return null
    if (wire.p.length > MAX_PIECES || wire.o.length > MAX_OFFCUTS) return null

    const [sw, sh, kerf, mode, price] = wire.s
    if (!isDim(sw) || !isDim(sh) || typeof kerf !== 'number' || kerf < 0 || kerf > 1) return null
    if (mode !== 0 && mode !== 1) return null
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) return null

    const pieces = wire.p.map((entry: unknown) => {
      if (!Array.isArray(entry) || entry.length !== 4) throw new Error('bad piece')
      const [label, w, h, q] = entry
      if (typeof label !== 'string' || label.length > 100) throw new Error('bad piece')
      if (!isDim(w) || !isDim(h)) throw new Error('bad piece')
      if (!Number.isInteger(q) || q < 1 || q > 100) throw new Error('bad piece')
      return { label, width: w, height: h, quantity: q }
    })

    const offcuts = wire.o.map((entry: unknown) => {
      if (!Array.isArray(entry) || entry.length !== 2) throw new Error('bad offcut')
      const [w, h] = entry
      if (!isDim(w) || !isDim(h)) throw new Error('bad offcut')
      return { width: w, height: h }
    })

    return {
      pieces,
      offcuts,
      sheetWidth: sw,
      sheetHeight: sh,
      kerfWidth: kerf,
      optimizationMode: mode === 1 ? 'minimize-saw-changes' : 'minimize-waste',
      sheetPricePerUnit: price,
    }
  } catch {
    return null
  }
}

const isDim = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 10000

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
