import { describe, it, expect } from 'vitest'
import { guillotinePack } from './packer'
import type { Piece, PackerConfig, OptimizationMode } from '../types/plyplan'

const makePiece = (over: Partial<Piece> = {}): Piece => ({
  id: over.id ?? 'p1',
  label: over.label ?? 'A',
  width: over.width ?? 24,
  height: over.height ?? 24,
  quantity: over.quantity ?? 1,
  color: over.color ?? '#C2410C',
})

const makeConfig = (over: Partial<PackerConfig> = {}): PackerConfig => ({
  sheetWidth: 96,
  sheetHeight: 48,
  kerfWidth: 0.125,
  mode: 'minimize-waste',
  ...over,
})

const MODES: OptimizationMode[] = ['minimize-waste', 'minimize-saw-changes']

describe('guillotinePack — hybrid minimize-waste', () => {
  // minimize-waste runs both algorithms and keeps the winner, so it can
  // never do worse than the pure shelf mode on the numbers that matter.
  const CASES: Piece[][] = [
    [makePiece({ id: 'a', width: 24, height: 24, quantity: 8 })],
    [
      makePiece({ id: 'a', width: 47, height: 23, quantity: 4 }),
      makePiece({ id: 'b', width: 30, height: 20, quantity: 6 }),
    ],
    [
      makePiece({ id: 'a', width: 90, height: 40, quantity: 2 }),
      makePiece({ id: 'b', width: 12, height: 12, quantity: 20 }),
      makePiece({ id: 'c', width: 36, height: 15, quantity: 5 }),
    ],
  ]

  it.each(CASES.map((pieces, i) => [i, pieces] as const))(
    'is never worse than shelf packing (case %i)',
    (_i, pieces) => {
      const offcuts = [{ id: 'o1', width: 48, height: 24 }]
      const hybrid = guillotinePack(pieces, makeConfig({ mode: 'minimize-waste', offcuts }))
      const shelf = guillotinePack(pieces, makeConfig({ mode: 'minimize-saw-changes', offcuts }))
      expect(hybrid.unplacedPieces.length).toBeLessThanOrEqual(shelf.unplacedPieces.length)
      expect(hybrid.newSheets).toBeLessThanOrEqual(shelf.newSheets)
    }
  )
})

describe.each(MODES)('guillotinePack (%s)', (mode) => {
  it('packs pieces onto full sheets when no offcuts exist', () => {
    const result = guillotinePack([makePiece({ quantity: 2 })], makeConfig({ mode }))
    expect(result.totalSheets).toBe(1)
    expect(result.newSheets).toBe(1)
    expect(result.sheets[0].isOffcut).toBe(false)
    expect(result.sheets[0].width).toBe(96)
    expect(result.sheets[0].height).toBe(48)
    expect(result.unplacedPieces).toHaveLength(0)
  })

  it('uses an offcut instead of buying a new sheet when everything fits', () => {
    const result = guillotinePack(
      [makePiece({ width: 20, height: 20 })],
      makeConfig({ mode, offcuts: [{ id: 'o1', width: 24, height: 24 }] })
    )
    expect(result.totalSheets).toBe(1)
    expect(result.newSheets).toBe(0)
    expect(result.sheets[0].isOffcut).toBe(true)
    expect(result.sheets[0].width).toBe(24)
    expect(result.sheets[0].height).toBe(24)
    expect(result.unplacedPieces).toHaveLength(0)
  })

  it('overflows to a new full sheet once offcuts are full', () => {
    // Two 40x40 pieces: one fills the 42x42 offcut, the other needs a new sheet
    const result = guillotinePack(
      [makePiece({ width: 40, height: 40, quantity: 2 })],
      makeConfig({ mode, offcuts: [{ id: 'o1', width: 42, height: 42 }] })
    )
    expect(result.totalSheets).toBe(2)
    expect(result.newSheets).toBe(1)
    expect(result.sheets.filter((s) => s.isOffcut)).toHaveLength(1)
    expect(result.unplacedPieces).toHaveLength(0)
  })

  it('drops offcuts that end up unused from the results', () => {
    // Piece is too big for the 10x10 offcut — only a full sheet appears
    const result = guillotinePack(
      [makePiece({ width: 48, height: 40 })],
      makeConfig({ mode, offcuts: [{ id: 'o1', width: 10, height: 10 }] })
    )
    expect(result.totalSheets).toBe(1)
    expect(result.newSheets).toBe(1)
    expect(result.sheets[0].isOffcut).toBe(false)
    expect(result.sheets.every((s) => s.placements.length > 0)).toBe(true)
  })

  it('keeps every placement inside its sheet bounds', () => {
    const result = guillotinePack(
      [makePiece({ width: 20, height: 12, quantity: 6 })],
      makeConfig({ mode, offcuts: [{ id: 'o1', width: 30, height: 26 }] })
    )
    for (const sheet of result.sheets) {
      for (const p of sheet.placements) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.x + p.width).toBeLessThanOrEqual(sheet.width)
        expect(p.y + p.height).toBeLessThanOrEqual(sheet.height)
      }
    }
    const placed = result.sheets.reduce((sum, s) => sum + s.placements.length, 0)
    expect(placed + result.unplacedPieces.length).toBe(6)
  })

  it('marks pieces that fit nothing as unplaced without stranding empty sheets', () => {
    const result = guillotinePack(
      [makePiece({ width: 200, height: 200 })],
      makeConfig({ mode, offcuts: [{ id: 'o1', width: 24, height: 24 }] })
    )
    expect(result.unplacedPieces).toHaveLength(1)
    expect(result.totalSheets).toBe(0)
    expect(result.newSheets).toBe(0)
  })

  it('never returns an out-of-bounds or overlapping placement', () => {
    const result = guillotinePack(
      [
        makePiece({ id: 'a', width: 30, height: 20, quantity: 3 }),
        makePiece({ id: 'b', width: 47, height: 23, quantity: 2 }),
        makePiece({ id: 'c', width: 12, height: 12, quantity: 5 }),
      ],
      makeConfig({ mode, offcuts: [{ id: 'o1', width: 48, height: 24 }] })
    )
    for (const sheet of result.sheets) {
      const ps = sheet.placements
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i]
          const b = ps[j]
          const overlap =
            a.x < b.x + b.width && b.x < a.x + a.width &&
            a.y < b.y + b.height && b.y < a.y + a.height
          expect(overlap).toBe(false)
        }
      }
    }
  })

  it('unplaces a piece that only fits an offcut once that offcut is full', () => {
    // 100" wide exceeds the 96x48 full sheet but fits the oversized offcut.
    // The second instance has nowhere to go — and must not open an empty
    // full sheet it can't actually fit on.
    const result = guillotinePack(
      [makePiece({ width: 100, height: 30, quantity: 2 })],
      makeConfig({ mode, offcuts: [{ id: 'o1', width: 110, height: 32 }] })
    )
    expect(result.totalSheets).toBe(1)
    expect(result.sheets[0].isOffcut).toBe(true)
    expect(result.newSheets).toBe(0)
    expect(result.unplacedPieces).toHaveLength(1)
    expect(result.sheets.every((s) => s.placements.length > 0)).toBe(true)
  })
})
