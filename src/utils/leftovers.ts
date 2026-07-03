export interface LeftoverRect {
  x: number
  y: number
  width: number
  height: number
}

interface SheetLike {
  width: number
  height: number
  placements: Array<{ x: number; y: number; width: number; height: number }>
}

// A leftover is only worth keeping if you'd actually store it: at least
// 4" on the short side and a square foot of material.
const MIN_SIDE = 4
const MIN_AREA = 144

const isUsable = (r: LeftoverRect) =>
  Math.min(r.width, r.height) >= MIN_SIDE && r.width * r.height >= MIN_AREA

const overlaps = (a: LeftoverRect, b: LeftoverRect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

/**
 * Compute the usable leftover rectangles a packed sheet produces.
 *
 * Runs the same maxrects decomposition as the packer (kerf on the right +
 * bottom of each placement), then greedily keeps the largest candidates,
 * clipping the remainder against everything already kept — the result is a
 * set of DISJOINT rectangles, so the report never counts material twice.
 */
export function computeLeftovers(sheet: SheetLike, kerfWidth: number): LeftoverRect[] {
  let free: LeftoverRect[] = [{ x: 0, y: 0, width: sheet.width, height: sheet.height }]
  for (const p of sheet.placements) {
    free = free.flatMap((rect) =>
      splitAround(rect, p.x, p.y, p.width + kerfWidth, p.height + kerfWidth)
    )
  }

  let candidates = free.filter(isUsable)
  const kept: LeftoverRect[] = []
  while (candidates.length > 0) {
    candidates.sort((a, b) => b.width * b.height - a.width * a.height)
    const best = candidates[0]
    kept.push(best)
    candidates = candidates
      .slice(1)
      .flatMap((c) => subtract(c, best))
      .filter(isUsable)
  }
  return kept
}

/** Maximal sub-rects of `rect` not covered by the placed area (may overlap). */
function splitAround(
  rect: LeftoverRect,
  px: number,
  py: number,
  pw: number,
  ph: number
): LeftoverRect[] {
  const placedRight = px + pw
  const placedBottom = py + ph
  const rectRight = rect.x + rect.width
  const rectBottom = rect.y + rect.height

  if (px >= rectRight || placedRight <= rect.x || py >= rectBottom || placedBottom <= rect.y) {
    return [rect]
  }

  const parts: LeftoverRect[] = []
  if (px > rect.x) parts.push({ x: rect.x, y: rect.y, width: px - rect.x, height: rect.height })
  if (placedRight < rectRight)
    parts.push({ x: placedRight, y: rect.y, width: rectRight - placedRight, height: rect.height })
  if (py > rect.y) parts.push({ x: rect.x, y: rect.y, width: rect.width, height: py - rect.y })
  if (placedBottom < rectBottom)
    parts.push({ x: rect.x, y: placedBottom, width: rect.width, height: rectBottom - placedBottom })
  return parts
}

/** Disjoint parts of `c` not covered by `k`. */
function subtract(c: LeftoverRect, k: LeftoverRect): LeftoverRect[] {
  if (!overlaps(c, k)) return [c]

  const parts: LeftoverRect[] = []
  const cRight = c.x + c.width
  const cBottom = c.y + c.height
  const kRight = k.x + k.width
  const kBottom = k.y + k.height

  if (k.x > c.x) parts.push({ x: c.x, y: c.y, width: k.x - c.x, height: c.height })
  if (kRight < cRight) parts.push({ x: kRight, y: c.y, width: cRight - kRight, height: c.height })

  const midX0 = Math.max(c.x, k.x)
  const midX1 = Math.min(cRight, kRight)
  if (k.y > c.y) parts.push({ x: midX0, y: c.y, width: midX1 - midX0, height: k.y - c.y })
  if (kBottom < cBottom)
    parts.push({ x: midX0, y: kBottom, width: midX1 - midX0, height: cBottom - kBottom })
  return parts
}
