import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { resetPinchZoom } from './resetPinchZoom'

describe('resetPinchZoom', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.head.innerHTML =
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />'
  })

  afterEach(() => {
    vi.useRealTimers()
    document.head.innerHTML = ''
  })

  it('re-asserts maximum-scale=1.0 immediately, then restores the baseline', () => {
    resetPinchZoom()
    const meta = document.querySelector('meta[name="viewport"]')!

    // Asserted state forces page zoom back to 1.
    expect(meta.getAttribute('content')).toContain('maximum-scale=1.0')

    // After the settle window, the maximum-scale assertion is dropped again.
    vi.advanceTimersByTime(100)
    expect(meta.getAttribute('content')).toBe(
      'width=device-width, initial-scale=1.0, viewport-fit=cover',
    )
  })

  it('no-ops when no viewport meta tag is present', () => {
    document.head.innerHTML = ''
    expect(() => resetPinchZoom()).not.toThrow()
  })
})
