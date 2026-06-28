import { resetPinchZoom } from './resetPinchZoom'

/**
 * Page-zoom guards for touch devices — make the app shell behave like a native
 * app: in-page UI never page-zooms (which would clip the fixed header and shift
 * the layout). Only elements that opt out with `touch-action: none` and handle
 * their own gestures (the fullscreen diagram viewer) respond to pinch.
 *
 * WHY the viewport meta tag is not enough: since iOS 10, Safari ignores
 * `maximum-scale` / `user-scalable=no` and always allows page pinch-zoom. These
 * guards close that gap:
 *
 *  1. `gesturestart`/`gesturechange` (iOS-proprietary events) — preventDefault
 *     blocks Safari's page zoom.
 *  2. Multi-touch `touchmove` — preventDefault for non-Safari touch browsers.
 *     Single-finger events are untouched, so page scrolling still works.
 *  3. Self-heal: if page zoom slips through anyway, snap back via
 *     resetPinchZoom() once the gesture settles.
 */

/** Multi-touch moves are page-zoom attempts; single-finger scroll is fine. */
export function shouldBlockTouchMove(e: { touches: { length: number }; cancelable: boolean }): boolean {
  return e.touches.length > 1 && e.cancelable
}

/** Page zoom is "stuck" when the visual viewport scale settles above 1. */
export function isPageZoomed(scale: number): boolean {
  return scale > 1.01
}

const HEAL_SETTLE_MS = 400

/**
 * Install the guards. Returns a cleanup function. No-ops (returns a dummy
 * cleanup) on non-touch devices so desktop browser zoom stays available.
 */
export function installPageZoomGuards(): () => void {
  if (typeof navigator === 'undefined' || navigator.maxTouchPoints === 0) {
    return () => {}
  }

  const onGesture = (e: Event) => e.preventDefault()
  const onTouchMove = (e: TouchEvent) => {
    if (shouldBlockTouchMove(e)) e.preventDefault()
  }

  // Must be non-passive to be allowed to preventDefault.
  document.addEventListener('gesturestart', onGesture, { passive: false })
  document.addEventListener('gesturechange', onGesture, { passive: false })
  document.addEventListener('touchmove', onTouchMove, { passive: false })

  // Self-heal: snap residual page zoom back to 1 once the gesture settles.
  // Scheduled from every signal that can follow a zoom: visual-viewport resize
  // AND scroll (panning while zoomed fires scroll, not resize), plus
  // gesture/touch end — so a zoom that slips through is corrected the moment
  // fingers lift.
  const vv = window.visualViewport
  let healTimer: ReturnType<typeof setTimeout> | undefined
  const scheduleHealCheck = () => {
    if (!vv) return
    clearTimeout(healTimer)
    healTimer = setTimeout(() => {
      if (isPageZoomed(vv.scale)) resetPinchZoom()
    }, HEAL_SETTLE_MS)
  }
  vv?.addEventListener('resize', scheduleHealCheck)
  vv?.addEventListener('scroll', scheduleHealCheck)
  document.addEventListener('gestureend', scheduleHealCheck)
  document.addEventListener('touchend', scheduleHealCheck, { passive: true })

  return () => {
    document.removeEventListener('gesturestart', onGesture)
    document.removeEventListener('gesturechange', onGesture)
    document.removeEventListener('touchmove', onTouchMove)
    vv?.removeEventListener('resize', scheduleHealCheck)
    vv?.removeEventListener('scroll', scheduleHealCheck)
    document.removeEventListener('gestureend', scheduleHealCheck)
    document.removeEventListener('touchend', scheduleHealCheck)
    clearTimeout(healTimer)
  }
}
