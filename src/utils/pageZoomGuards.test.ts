import { describe, it, expect, afterEach } from 'vitest'
import { shouldBlockTouchMove, isPageZoomed, installPageZoomGuards } from './pageZoomGuards'

const makeTouchMove = (touchCount: number, cancelable = true): Event => {
  const e = new Event('touchmove', { cancelable })
  Object.defineProperty(e, 'touches', { value: { length: touchCount } })
  return e
}

// jsdom's navigator has no maxTouchPoints — define it directly to simulate a touch device.
const stubTouchDevice = (maxTouchPoints: number) =>
  Object.defineProperty(navigator, 'maxTouchPoints', { value: maxTouchPoints, configurable: true })

describe('shouldBlockTouchMove', () => {
  it('blocks multi-touch (pinch) moves', () => {
    expect(shouldBlockTouchMove({ touches: { length: 2 }, cancelable: true })).toBe(true)
  })

  it('allows single-finger moves (page scrolling)', () => {
    expect(shouldBlockTouchMove({ touches: { length: 1 }, cancelable: true })).toBe(false)
  })

  it('skips non-cancelable events', () => {
    expect(shouldBlockTouchMove({ touches: { length: 2 }, cancelable: false })).toBe(false)
  })
})

describe('isPageZoomed', () => {
  it('treats scale 1 (and float noise) as not zoomed', () => {
    expect(isPageZoomed(1)).toBe(false)
    expect(isPageZoomed(1.005)).toBe(false)
  })

  it('detects real page zoom', () => {
    expect(isPageZoomed(1.5)).toBe(true)
  })
})

describe('installPageZoomGuards', () => {
  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>).maxTouchPoints
  })

  it('no-ops on non-touch devices (desktop browser zoom stays available)', () => {
    stubTouchDevice(0)
    const cleanup = installPageZoomGuards()
    const e = makeTouchMove(2)
    document.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(false)
    cleanup()
  })

  it('prevents multi-touch touchmove and gesture events on touch devices', () => {
    stubTouchDevice(5)
    const cleanup = installPageZoomGuards()

    const pinch = makeTouchMove(2)
    document.dispatchEvent(pinch)
    expect(pinch.defaultPrevented).toBe(true)

    const scroll = makeTouchMove(1)
    document.dispatchEvent(scroll)
    expect(scroll.defaultPrevented).toBe(false)

    const gesture = new Event('gesturestart', { cancelable: true })
    document.dispatchEvent(gesture)
    expect(gesture.defaultPrevented).toBe(true)

    cleanup()
  })

  it('cleanup removes all listeners', () => {
    stubTouchDevice(5)
    const cleanup = installPageZoomGuards()
    cleanup()
    const pinch = makeTouchMove(2)
    document.dispatchEvent(pinch)
    expect(pinch.defaultPrevented).toBe(false)
  })
})
