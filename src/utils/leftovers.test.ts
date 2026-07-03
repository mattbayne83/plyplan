import { describe, it, expect } from 'vitest'
import { computeLeftovers, type LeftoverRect } from './leftovers'

const overlaps = (a: LeftoverRect, b: LeftoverRect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

describe('computeLeftovers', () => {
  it('reports an untouched sheet as one full leftover', () => {
    const result = computeLeftovers({ width: 96, height: 48, placements: [] }, 0.125)
    expect(result).toEqual([{ x: 0, y: 0, width: 96, height: 48 }])
  })

  it('reports both legs of an L-shaped leftover, disjoint', () => {
    // One 24×24 piece in the corner of a 4×8: the leftover is an L —
    // the full-height right region plus the strip under the piece.
    const result = computeLeftovers(
      { width: 96, height: 48, placements: [{ x: 0, y: 0, width: 24, height: 24 }] },
      0.125
    )
    expect(result).toHaveLength(2)
    const [big, small] = result
    expect(big).toMatchObject({ x: 24.125, y: 0, height: 48 })
    expect(big.width).toBeCloseTo(71.875)
    expect(small).toMatchObject({ x: 0, y: 24.125 })
    expect(small.width).toBeCloseTo(24.125)
    expect(small.height).toBeCloseTo(23.875)
    expect(overlaps(big, small)).toBe(false)
  })

  it('returns nothing for a fully covered sheet', () => {
    const result = computeLeftovers(
      { width: 48, height: 48, placements: [{ x: 0, y: 0, width: 48, height: 48 }] },
      0
    )
    expect(result).toEqual([])
  })

  it('filters strips too narrow to keep', () => {
    // 3" strip left over — below the 4" minimum side
    const result = computeLeftovers(
      { width: 96, height: 48, placements: [{ x: 0, y: 0, width: 96, height: 45 }] },
      0
    )
    expect(result).toEqual([])
  })

  it('filters scraps below one square foot', () => {
    // 10×10 corner = 100 in² < 144 in²
    const result = computeLeftovers(
      {
        width: 58,
        height: 10,
        placements: [{ x: 0, y: 0, width: 48, height: 10 }],
      },
      0
    )
    expect(result).toEqual([])
  })

  it('always returns disjoint rectangles within sheet bounds', () => {
    const placements = [
      { x: 0, y: 0, width: 30, height: 20 },
      { x: 30.125, y: 0, width: 30, height: 20 },
      { x: 0, y: 20.125, width: 47, height: 23 },
    ]
    const result = computeLeftovers({ width: 96, height: 48, placements }, 0.125)
    expect(result.length).toBeGreaterThan(0)
    for (let i = 0; i < result.length; i++) {
      const r = result[i]
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.width).toBeLessThanOrEqual(96)
      expect(r.y + r.height).toBeLessThanOrEqual(48)
      for (let j = i + 1; j < result.length; j++) {
        expect(overlaps(r, result[j])).toBe(false)
      }
    }
  })
})
