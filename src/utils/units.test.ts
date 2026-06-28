import { describe, it, expect } from 'vitest'
import { formatDimension, parseDimension } from './units'

// Sanity coverage that doubles as the harness smoke test (Phase 0).
describe('formatDimension', () => {
  it('renders whole inches without a fraction', () => {
    expect(formatDimension(24)).toBe('24"')
  })

  it('renders a mixed number with the nearest 1/16 fraction', () => {
    expect(formatDimension(3.5)).toBe('3-1/2"')
  })

  it('renders a bare fraction when there is no whole part', () => {
    expect(formatDimension(0.25)).toBe('1/4"')
  })
})

describe('parseDimension', () => {
  it('round-trips the fraction formats formatDimension emits', () => {
    expect(parseDimension('3-1/2')).toBe(3.5)
    expect(parseDimension('3 1/2')).toBe(3.5)
    expect(parseDimension('1/4')).toBe(0.25)
    expect(parseDimension('24')).toBe(24)
  })

  it('rejects empty and zero-denominator input', () => {
    expect(parseDimension('')).toBeNull()
    expect(parseDimension('1/0')).toBeNull()
  })
})
