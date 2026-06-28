import { describe, it, expect } from 'vitest'
import {
  clampScale,
  distance,
  midpoint,
  zoomAboutPoint,
  clampTranslate,
  doubleTapTarget,
  shouldCloseOnSwipe,
  MIN_SCALE,
  MAX_SCALE,
} from './zoomMath'

describe('clampScale', () => {
  it('floors at MIN_SCALE and ceils at MAX_SCALE', () => {
    expect(clampScale(0.2)).toBe(MIN_SCALE)
    expect(clampScale(999)).toBe(MAX_SCALE)
    expect(clampScale(2.5)).toBe(2.5)
  })
})

describe('distance / midpoint', () => {
  it('measures euclidean distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })

  it('finds the midpoint of two points', () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 4, y: 10 })).toEqual({ x: 2, y: 5 })
  })
})

describe('zoomAboutPoint', () => {
  it('keeps the focal point stationary as scale changes', () => {
    // Content point under the focal must not move when zooming about it.
    const t0 = 0
    const s0 = 1
    const s1 = 2
    const focal = 50
    const t1 = zoomAboutPoint(t0, s0, s1, focal)
    // contentPoint = (focal - t0) / s0 ; after: focal' = t1 + contentPoint * s1
    const contentPoint = (focal - t0) / s0
    expect(t1 + contentPoint * s1).toBeCloseTo(focal)
  })

  it('is a no-op translation when scale is unchanged', () => {
    expect(zoomAboutPoint(7, 2, 2, 30)).toBeCloseTo(7)
  })
})

describe('clampTranslate', () => {
  it('allows no offset at scale 1 (content fills the frame)', () => {
    expect(clampTranslate(100, 1, 400)).toBe(0)
    expect(clampTranslate(-100, 1, 400)).toBe(0)
  })

  it('limits offset to half the overflow at higher scale', () => {
    // overflow = (scale - 1) * size = 400 ; max offset = 200
    expect(clampTranslate(500, 2, 400)).toBe(200)
    expect(clampTranslate(-500, 2, 400)).toBe(-200)
    expect(clampTranslate(50, 2, 400)).toBe(50)
  })
})

describe('doubleTapTarget', () => {
  it('zooms in from 1x and back out when already zoomed', () => {
    expect(doubleTapTarget(1)).toBeGreaterThan(1)
    expect(doubleTapTarget(2.5)).toBe(1)
  })
})

describe('shouldCloseOnSwipe', () => {
  it('closes on a downward swipe only when not zoomed', () => {
    expect(shouldCloseOnSwipe(120, 1)).toBe(true)
    expect(shouldCloseOnSwipe(120, 2)).toBe(false) // zoomed → swipe pans instead
    expect(shouldCloseOnSwipe(20, 1)).toBe(false) // too short
    expect(shouldCloseOnSwipe(-120, 1)).toBe(false) // upward
  })
})
