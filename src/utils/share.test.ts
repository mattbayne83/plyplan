import { describe, it, expect } from 'vitest'
import { encodeShareState, decodeShareState, type SharedState } from './share'

const state: SharedState = {
  pieces: [
    { label: 'Side', width: 20.75, height: 24, quantity: 2 },
    { label: '', width: 47.875, height: 23.875, quantity: 1 },
  ],
  offcuts: [{ width: 24, height: 48 }],
  sheetWidth: 96,
  sheetHeight: 48,
  kerfWidth: 0.125,
  optimizationMode: 'minimize-saw-changes',
  sheetPricePerUnit: 55,
}

describe('share codec', () => {
  it('round-trips a full plan', () => {
    expect(decodeShareState(encodeShareState(state))).toEqual(state)
  })

  it('produces a URL-safe string', () => {
    const encoded = encodeShareState(state)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('never encodes an API key', () => {
    const encoded = encodeShareState({ ...state, geminiApiKey: 'sk-secret' } as SharedState)
    expect(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))).not.toContain('sk-secret')
  })

  it('rejects garbage', () => {
    expect(decodeShareState('not-base64!!!')).toBeNull()
    expect(decodeShareState('')).toBeNull()
    expect(decodeShareState(btoa('{"v":1'))).toBeNull()
  })

  it('rejects a tampered payload with invalid dimensions', () => {
    const wire = { v: 1, p: [['x', -5, 10, 1]], o: [], s: [96, 48, 0.125, 0, 55] }
    const encoded = btoa(JSON.stringify(wire)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeShareState(encoded)).toBeNull()
  })

  it('rejects unknown versions', () => {
    const wire = { v: 2, p: [], o: [], s: [96, 48, 0.125, 0, 55] }
    const encoded = btoa(JSON.stringify(wire))
    expect(decodeShareState(encoded)).toBeNull()
  })

  it('rejects absurd quantities', () => {
    const wire = { v: 1, p: [['x', 10, 10, 5000]], o: [], s: [96, 48, 0.125, 0, 55] }
    expect(decodeShareState(btoa(JSON.stringify(wire)))).toBeNull()
  })
})
