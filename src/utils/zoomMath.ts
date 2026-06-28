/**
 * Pure geometry for the fullscreen diagram zoom/pan viewer. Kept separate from
 * the React hook so the gesture math is unit-testable in isolation.
 *
 * Coordinate model: translate values (tx, ty) and focal points are in screen
 * pixels measured from the viewer's center (transform-origin: center). A
 * transform of `translate(tx, ty) scale(s)` is applied to the content.
 */

export interface Point {
  x: number
  y: number
}

export const MIN_SCALE = 1
export const MAX_SCALE = 6
/** Scale a double-tap / double-click jumps to from 1x. */
export const DOUBLE_TAP_SCALE = 2.5
/** Downward swipe (px) that dismisses the viewer when not zoomed. */
export const SWIPE_CLOSE_THRESHOLD = 90

export function clampScale(scale: number, min = MIN_SCALE, max = MAX_SCALE): number {
  return Math.min(max, Math.max(min, scale))
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * New translate (one axis) so the content point currently under `focal` stays
 * under `focal` as scale goes s0 → s1. Derivation: contentPoint = (focal - t0)
 * / s0, and we want focal = t1 + contentPoint * s1.
 */
export function zoomAboutPoint(t0: number, s0: number, s1: number, focal: number): number {
  const contentPoint = (focal - t0) / s0
  return focal - contentPoint * s1
}

/**
 * Clamp a translate (one axis) so the scaled content can't be dragged past its
 * own edge. At scale 1 the content fills the frame exactly, so offset is 0;
 * above that, the content overflows by (scale - 1) * size and may shift by half
 * that in either direction (transform-origin is the center).
 */
export function clampTranslate(t: number, scale: number, size: number): number {
  const max = Math.max(0, ((scale - 1) * size) / 2)
  const clamped = Math.min(max, Math.max(-max, t))
  return clamped === 0 ? 0 : clamped // normalize -0 → 0
}

/** Toggle target for a double-tap: out to 1x if zoomed, otherwise in. */
export function doubleTapTarget(scale: number, zoomed = DOUBLE_TAP_SCALE): number {
  return scale > 1.01 ? 1 : zoomed
}

/** A downward swipe dismisses the viewer, but only when not zoomed in. */
export function shouldCloseOnSwipe(dy: number, scale: number, threshold = SWIPE_CLOSE_THRESHOLD): boolean {
  return scale <= 1.01 && dy > threshold
}
