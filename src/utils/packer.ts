import type { Piece, PackerConfig, PackerResult, Placement, SheetResult } from '../types/plyplan'
import { generateId } from './id'

interface FreeRect {
  x: number
  y: number
  w: number
  h: number
}

interface ExpandedItem {
  pieceId: string
  instanceIndex: number
  width: number
  height: number
  label: string
  color: string
}

interface PlacementCandidate {
  sheetIdx: number
  rectIdx: number
  x: number
  y: number
  w: number
  h: number
  rotated: boolean
  score: number
}

/**
 * Main entry point — dispatches by mode.
 *
 * minimize-saw-changes is a deliberate trade (simpler cuts over material),
 * so it always uses shelf packing. minimize-waste is hybrid: both algorithms
 * run and the better result wins — shelf occasionally beats maxrects on
 * uniform pieces, and the sheet count must be right.
 */
export function guillotinePack(pieces: Piece[], config: PackerConfig): PackerResult {
  if (config.mode === 'minimize-saw-changes') {
    return shelfPack(expandPieces(pieces), config)
  }
  // expandPieces is called per-algorithm: bestAreaPack sorts its items array
  // in place, so the two runs must not share it.
  const area = bestAreaPack(expandPieces(pieces), config)
  const shelf = shelfPack(expandPieces(pieces), config)
  return betterResult(area, shelf)
}

/** Fewer unplaced pieces → fewer sheets to buy → fewer bins → less waste. */
function betterResult(a: PackerResult, b: PackerResult): PackerResult {
  if (a.unplacedPieces.length !== b.unplacedPieces.length) {
    return a.unplacedPieces.length < b.unplacedPieces.length ? a : b
  }
  if (a.newSheets !== b.newSheets) return a.newSheets < b.newSheets ? a : b
  if (a.totalSheets !== b.totalSheets) return a.totalSheets < b.totalSheets ? a : b
  return a.totalWastePercent <= b.totalWastePercent ? a : b
}

function expandPieces(pieces: Piece[]): ExpandedItem[] {
  const items: ExpandedItem[] = []
  for (const piece of pieces) {
    for (let i = 0; i < piece.quantity; i++) {
      items.push({
        pieceId: piece.id,
        instanceIndex: i,
        width: piece.width,
        height: piece.height,
        label: piece.label,
        color: piece.color,
      })
    }
  }
  return items
}

function buildResults(
  sheets: Array<{ width: number; height: number; isOffcut: boolean; placements: Placement[] }>,
  unplacedPieces: PackerResult['unplacedPieces']
): PackerResult {
  // Offcuts are pre-seeded as candidate bins; drop any that ended up unused.
  const usedSheets = sheets.filter((s) => s.placements.length > 0)

  const sheetResults: SheetResult[] = usedSheets.map((sheet, i) => {
    const sheetArea = sheet.width * sheet.height
    const usedArea = sheet.placements.reduce((sum, p) => sum + p.width * p.height, 0)
    const wastePercent = ((sheetArea - usedArea) / sheetArea) * 100
    return {
      id: generateId(),
      sheetIndex: i,
      width: sheet.width,
      height: sheet.height,
      isOffcut: sheet.isOffcut,
      placements: sheet.placements,
      wastePercent,
      usedArea,
    }
  })

  const totalUsedArea = sheetResults.reduce((sum, s) => sum + s.usedArea, 0)
  const totalArea = sheetResults.reduce((sum, s) => sum + s.width * s.height, 0)
  const totalWastePercent = totalArea > 0 ? ((totalArea - totalUsedArea) / totalArea) * 100 : 0

  return {
    sheets: sheetResults,
    totalSheets: sheetResults.length,
    newSheets: sheetResults.filter((s) => !s.isOffcut).length,
    totalWastePercent,
    unplacedPieces,
  }
}

// ─── MINIMIZE WASTE: Maximal rectangles best-area-fit ───────────────────────
//
// Unlike guillotine splitting (which binary-partitions each rect into two
// non-overlapping children), maxrects maintains a list of *overlapping*
// maximal free rectangles. When a piece is placed, every free rect that
// overlaps the placed piece is split into up to 4 sub-rects (above, below,
// left, right of the piece). Then any rect fully contained within another
// is pruned. This preserves large contiguous free areas that guillotine
// splitting would fragment away.

function bestAreaPack(items: ExpandedItem[], config: PackerConfig): PackerResult {
  const { sheetWidth, sheetHeight, kerfWidth } = config
  const offcuts = config.offcuts ?? []

  // Sort by area descending, tie-break by max dimension
  items.sort((a, b) => {
    const areaA = a.width * a.height
    const areaB = b.width * b.height
    if (areaB !== areaA) return areaB - areaA
    return Math.max(b.width, b.height) - Math.max(a.width, a.height)
  })

  const sheets: Array<{ width: number; height: number; isOffcut: boolean; freeRects: FreeRect[]; placements: Placement[] }> = []
  const unplacedPieces: PackerResult['unplacedPieces'] = []

  // Seed offcuts as available bins. New full sheets are only opened when
  // nothing fits, so scrap stock is consumed first; unused offcuts are
  // dropped in buildResults.
  for (const offcut of offcuts) {
    sheets.push({
      width: offcut.width,
      height: offcut.height,
      isOffcut: true,
      freeRects: [{ x: 0, y: 0, w: offcut.width, h: offcut.height }],
      placements: [],
    })
  }

  function createSheet() {
    sheets.push({
      width: sheetWidth,
      height: sheetHeight,
      isOffcut: false,
      freeRects: [{ x: 0, y: 0, w: sheetWidth, h: sheetHeight }],
      placements: [],
    })
  }

  function tryFit(
    itemW: number,
    itemH: number,
    rect: FreeRect,
    rotated: boolean,
    sheetIdx: number,
    rectIdx: number
  ): PlacementCandidate | null {
    if (itemW > rect.w || itemH > rect.h) return null
    const leftover = rect.w * rect.h - itemW * itemH
    return { sheetIdx, rectIdx, x: rect.x, y: rect.y, w: itemW, h: itemH, rotated, score: leftover }
  }

  // Split all free rects that overlap the placed piece, then prune contained rects
  function splitFreeRects(freeRects: FreeRect[], px: number, py: number, pw: number, ph: number, kerf: number): FreeRect[] {
    const placedRight = px + pw + kerf
    const placedBottom = py + ph + kerf
    const newRects: FreeRect[] = []

    for (const rect of freeRects) {
      const rectRight = rect.x + rect.w
      const rectBottom = rect.y + rect.h

      // No overlap — keep as-is
      if (px >= rectRight || placedRight <= rect.x || py >= rectBottom || placedBottom <= rect.y) {
        newRects.push(rect)
        continue
      }

      // Overlaps — split into up to 4 sub-rects around the placed piece
      // Left strip
      if (px > rect.x) {
        newRects.push({ x: rect.x, y: rect.y, w: px - rect.x, h: rect.h })
      }
      // Right strip
      if (placedRight < rectRight) {
        newRects.push({ x: placedRight, y: rect.y, w: rectRight - placedRight, h: rect.h })
      }
      // Top strip
      if (py > rect.y) {
        newRects.push({ x: rect.x, y: rect.y, w: rect.w, h: py - rect.y })
      }
      // Bottom strip
      if (placedBottom < rectBottom) {
        newRects.push({ x: rect.x, y: placedBottom, w: rect.w, h: rectBottom - placedBottom })
      }
    }

    // Prune rects fully contained within another
    return pruneContained(newRects)
  }

  function pruneContained(rects: FreeRect[]): FreeRect[] {
    const result: FreeRect[] = []
    for (let i = 0; i < rects.length; i++) {
      let contained = false
      for (let j = 0; j < rects.length; j++) {
        if (i === j) continue
        if (
          rects[i].x >= rects[j].x &&
          rects[i].y >= rects[j].y &&
          rects[i].x + rects[i].w <= rects[j].x + rects[j].w &&
          rects[i].y + rects[i].h <= rects[j].y + rects[j].h
        ) {
          contained = true
          break
        }
      }
      if (!contained) result.push(rects[i])
    }
    return result
  }

  for (const item of items) {
    // Bins vary in size once offcuts exist — tryFit bounds-checks per rect,
    // so scan both orientations everywhere.
    let bestCandidate: PlacementCandidate | null = null

    for (let si = 0; si < sheets.length; si++) {
      const sheet = sheets[si]
      for (let ri = 0; ri < sheet.freeRects.length; ri++) {
        const rect = sheet.freeRects[ri]
        const c = tryFit(item.width, item.height, rect, false, si, ri)
        if (c && (bestCandidate === null || c.score < bestCandidate.score)) bestCandidate = c
        if (item.width !== item.height) {
          const cr = tryFit(item.height, item.width, rect, true, si, ri)
          if (cr && (bestCandidate === null || cr.score < bestCandidate.score)) bestCandidate = cr
        }
      }
    }

    if (!bestCandidate) {
      // Only open a new full sheet if the item can actually fit one —
      // otherwise we'd strand an empty sheet in the results.
      const fitsNormal = item.width <= sheetWidth && item.height <= sheetHeight
      const fitsRotated = item.height <= sheetWidth && item.width <= sheetHeight
      if (fitsNormal || fitsRotated) {
        createSheet()
        const si = sheets.length - 1
        const rect = sheets[si].freeRects[0]
        if (fitsNormal) bestCandidate = tryFit(item.width, item.height, rect, false, si, 0)
        if (!bestCandidate && fitsRotated) bestCandidate = tryFit(item.height, item.width, rect, true, si, 0)
      }
    }

    if (!bestCandidate) {
      unplacedPieces.push({ pieceId: item.pieceId, instanceIndex: item.instanceIndex })
      continue
    }

    const sheet = sheets[bestCandidate.sheetIdx]
    sheet.placements.push({
      pieceId: item.pieceId,
      instanceIndex: item.instanceIndex,
      x: bestCandidate.x,
      y: bestCandidate.y,
      width: bestCandidate.w,
      height: bestCandidate.h,
      rotated: bestCandidate.rotated,
      label: item.label,
      color: item.color,
    })

    // Update free rects using maxrects splitting
    sheet.freeRects = splitFreeRects(
      sheet.freeRects,
      bestCandidate.x, bestCandidate.y,
      bestCandidate.w, bestCandidate.h,
      kerfWidth
    )
  }

  return buildResults(sheets, unplacedPieces)
}

// ─── MINIMIZE SAW CHANGES: Shelf packing ──────────────────────────────────
//
// Strategy:
// 1. Group all pieces by height (the dimension that sets the crosscut).
//    If a piece fits better rotated to match an existing group, prefer that.
// 2. Sort groups by height descending (tallest shelves first).
// 3. Within each group, sort pieces by width descending.
// 4. Pack shelves top-to-bottom across sheets. Each shelf = one crosscut.
//    Within a shelf, pieces go left-to-right = same fence rip widths grouped.
// 5. No rotation within a shelf — all pieces share the shelf height.
//
// This produces: few unique crosscut positions (one per shelf height) and
// grouped rip widths within each shelf (fewer fence changes).

interface Shelf {
  y: number
  height: number
  cursorX: number
  placements: Placement[]
}

function shelfPack(items: ExpandedItem[], config: PackerConfig): PackerResult {
  const { sheetWidth, sheetHeight, kerfWidth } = config
  const offcuts = config.offcuts ?? []
  const unplacedPieces: PackerResult['unplacedPieces'] = []

  // Normalize items: for each item, pick an orientation where height is the
  // smaller dimension (so shelves are short horizontal strips). This reduces
  // the number of unique shelf heights.
  // Exception: if the piece only fits in one orientation, use that.
  // An orientation counts as fitting if any stock (full sheet or offcut)
  // can hold it.
  const normalized = items.map((item) => {
    const fitsNormal =
      (item.width <= sheetWidth && item.height <= sheetHeight) ||
      offcuts.some((o) => item.width <= o.width && item.height <= o.height)
    const fitsRotated =
      (item.height <= sheetWidth && item.width <= sheetHeight) ||
      offcuts.some((o) => item.height <= o.width && item.width <= o.height)

    if (!fitsNormal && !fitsRotated) return { ...item, placeable: false, rotated: false }

    // Prefer orientation where height <= width (short shelf strips)
    if (fitsNormal && item.height <= item.width) {
      return { ...item, placeable: true, rotated: false }
    }
    if (fitsRotated && item.width <= item.height) {
      return { ...item, width: item.height, height: item.width, placeable: true, rotated: true }
    }
    // Fall back to whichever fits
    if (fitsNormal) return { ...item, placeable: true, rotated: false }
    return { ...item, width: item.height, height: item.width, placeable: true, rotated: true }
  })

  // Group by shelf height (round to nearest 1/16" to merge near-matches)
  const heightKey = (h: number) => Math.round(h * 16) / 16

  // Sort: by height descending, then width descending within same height
  const placeable = normalized.filter((n) => n.placeable)
  const notPlaceable = normalized.filter((n) => !n.placeable)

  placeable.sort((a, b) => {
    const hDiff = heightKey(b.height) - heightKey(a.height)
    if (hDiff !== 0) return hDiff
    return b.width - a.width
  })

  for (const item of notPlaceable) {
    unplacedPieces.push({ pieceId: item.pieceId, instanceIndex: item.instanceIndex })
  }

  // Pack into sheets
  const sheets: Array<{ width: number; height: number; isOffcut: boolean; shelves: Shelf[]; cursorY: number; placements: Placement[] }> = []

  // Seed offcuts as available bins (used before new full sheets; unused
  // offcuts are dropped in buildResults).
  for (const offcut of offcuts) {
    sheets.push({ width: offcut.width, height: offcut.height, isOffcut: true, shelves: [], cursorY: 0, placements: [] })
  }

  function createSheet() {
    sheets.push({ width: sheetWidth, height: sheetHeight, isOffcut: false, shelves: [], cursorY: 0, placements: [] })
    return sheets.length - 1
  }

  function findOrCreateShelf(itemW: number, itemH: number): { sheetIdx: number; shelf: Shelf } | null {
    const hk = heightKey(itemH)
    const hasRoom = (shelf: Shelf, binWidth: number) =>
      shelf.cursorX + itemW + kerfWidth <= binWidth + kerfWidth

    // 1. Exact height match — ideal, no wasted vertical space
    for (let si = 0; si < sheets.length; si++) {
      for (const shelf of sheets[si].shelves) {
        if (heightKey(shelf.height) === hk && hasRoom(shelf, sheets[si].width)) {
          return { sheetIdx: si, shelf }
        }
      }
    }

    // 2. Taller shelf with horizontal room — piece fits vertically, some waste
    //    but no new crosscut. Pick the shelf with smallest height difference.
    let bestTaller: { sheetIdx: number; shelf: Shelf; gap: number } | null = null
    for (let si = 0; si < sheets.length; si++) {
      for (const shelf of sheets[si].shelves) {
        if (shelf.height >= itemH && hasRoom(shelf, sheets[si].width)) {
          const gap = shelf.height - itemH
          if (gap > 0 && (!bestTaller || gap < bestTaller.gap)) {
            bestTaller = { sheetIdx: si, shelf, gap }
          }
        }
      }
    }
    if (bestTaller) return { sheetIdx: bestTaller.sheetIdx, shelf: bestTaller.shelf }

    // 3. Open a new shelf on an existing sheet
    for (let si = 0; si < sheets.length; si++) {
      const sheet = sheets[si]
      const remainingH = sheet.height - sheet.cursorY
      if (remainingH >= itemH && sheet.width >= itemW) {
        const shelf: Shelf = {
          y: sheet.cursorY,
          height: itemH,
          cursorX: 0,
          placements: [],
        }
        sheet.shelves.push(shelf)
        sheet.cursorY += itemH + kerfWidth
        return { sheetIdx: si, shelf }
      }
    }

    // 4. New full sheet — but only if the item actually fits one (it may
    //    only fit an offcut that's already full).
    if (itemW > sheetWidth || itemH > sheetHeight) return null
    const si = createSheet()
    const shelf: Shelf = {
      y: 0,
      height: itemH,
      cursorX: 0,
      placements: [],
    }
    sheets[si].shelves.push(shelf)
    sheets[si].cursorY = itemH + kerfWidth
    return { sheetIdx: si, shelf }
  }

  for (const item of placeable) {
    const result = findOrCreateShelf(item.width, item.height)
    if (!result) {
      unplacedPieces.push({ pieceId: item.pieceId, instanceIndex: item.instanceIndex })
      continue
    }

    const { sheetIdx, shelf } = result
    const placement: Placement = {
      pieceId: item.pieceId,
      instanceIndex: item.instanceIndex,
      x: shelf.cursorX,
      y: shelf.y,
      width: item.width,
      height: item.height,
      rotated: item.rotated,
      label: item.label,
      color: item.color,
    }

    shelf.placements.push(placement)
    shelf.cursorX += item.width + kerfWidth
    sheets[sheetIdx].placements.push(placement)
  }

  return buildResults(sheets, unplacedPieces)
}
