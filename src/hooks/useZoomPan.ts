import { useCallback, useRef, useState } from 'react'
import type { TouchEvent as ReactTouchEvent, MouseEvent as ReactMouseEvent } from 'react'
import {
  clampScale,
  clampTranslate,
  distance,
  doubleTapTarget,
  midpoint,
  shouldCloseOnSwipe,
  zoomAboutPoint,
  type Point,
} from '../utils/zoomMath'

interface Transform {
  scale: number
  x: number
  y: number
}

const IDENTITY: Transform = { scale: 1, x: 0, y: 0 }
const DOUBLE_TAP_MS = 300
const TAP_SLOP = 10 // px of movement still counted as a tap, not a drag

interface Gesture {
  mode: 'none' | 'pan' | 'pinch'
  startDist: number
  startMid: Point
  startTransform: Transform
  lastPoint: Point
  panStartY: number
  movedY: number
  tapPoint: Point
  lastTapTime: number
}

const freshGesture = (): Gesture => ({
  mode: 'none',
  startDist: 0,
  startMid: { x: 0, y: 0 },
  startTransform: IDENTITY,
  lastPoint: { x: 0, y: 0 },
  panStartY: 0,
  movedY: 0,
  tapPoint: { x: 0, y: 0 },
  lastTapTime: 0,
})

interface UseZoomPanOptions {
  /** Called when the user swipes the (un-zoomed) viewer down to dismiss it. */
  onClose?: () => void
}

/**
 * Pinch / double-tap / drag zoom for the fullscreen diagram viewer. All the
 * geometry lives in zoomMath.ts (unit-tested); this hook is just the stateful
 * event plumbing. The host element must set `touch-action: none` so the browser
 * hands us the raw multi-touch stream instead of scrolling/zooming itself.
 */
export function useZoomPan({ onClose }: UseZoomPanOptions = {}) {
  const [transform, setTransformState] = useState<Transform>(IDENTITY)
  const [animate, setAnimate] = useState(false)
  const transformRef = useRef<Transform>(IDENTITY)
  const elementRef = useRef<HTMLElement | null>(null)
  const wheelCleanup = useRef<(() => void) | null>(null)
  const gesture = useRef<Gesture>(freshGesture())

  const setTransform = useCallback((next: Transform, withAnimation = false) => {
    transformRef.current = next
    setAnimate(withAnimation)
    setTransformState(next)
  }, [])

  const reset = useCallback(() => setTransform(IDENTITY, true), [setTransform])

  const rect = () => elementRef.current?.getBoundingClientRect() ?? null

  // Pointer position relative to the element center (transform-origin).
  const toCenter = (clientX: number, clientY: number, r: DOMRect): Point => ({
    x: clientX - r.left - r.width / 2,
    y: clientY - r.top - r.height / 2,
  })

  const zoomTo = (target: number, focal: Point, r: DOMRect) => {
    const cur = transformRef.current
    if (target <= 1.01) {
      setTransform(IDENTITY, true)
      return
    }
    setTransform(
      {
        scale: target,
        x: clampTranslate(zoomAboutPoint(cur.x, cur.scale, target, focal.x), target, r.width),
        y: clampTranslate(zoomAboutPoint(cur.y, cur.scale, target, focal.y), target, r.height),
      },
      true,
    )
  }

  const onTouchStart = (e: ReactTouchEvent) => {
    const g = gesture.current
    if (e.touches.length === 2) {
      const p0 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const p1 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
      const r = rect()
      if (!r) return
      g.mode = 'pinch'
      g.startDist = distance(p0, p1)
      g.startMid = toCenter(midpoint(p0, p1).x, midpoint(p0, p1).y, r)
      g.startTransform = transformRef.current
    } else if (e.touches.length === 1) {
      const t = e.touches[0]
      g.mode = 'pan'
      g.lastPoint = { x: t.clientX, y: t.clientY }
      g.panStartY = t.clientY
      g.movedY = 0
      g.tapPoint = { x: t.clientX, y: t.clientY }
      g.startTransform = transformRef.current
    }
  }

  const onTouchMove = (e: ReactTouchEvent) => {
    const g = gesture.current
    const r = rect()
    if (!r) return

    if (g.mode === 'pinch' && e.touches.length >= 2) {
      const p0 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const p1 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
      const curDist = distance(p0, p1)
      if (g.startDist === 0) return
      const curMid = toCenter(midpoint(p0, p1).x, midpoint(p0, p1).y, r)
      const s0 = g.startTransform.scale
      const s1 = clampScale((s0 * curDist) / g.startDist)
      // Keep the content point that started under the pinch midpoint pinned to
      // the (moving) midpoint: contentPoint = (startMid - t0) / s0.
      const cpx = (g.startMid.x - g.startTransform.x) / s0
      const cpy = (g.startMid.y - g.startTransform.y) / s0
      setTransform({
        scale: s1,
        x: clampTranslate(curMid.x - cpx * s1, s1, r.width),
        y: clampTranslate(curMid.y - cpy * s1, s1, r.height),
      })
    } else if (g.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0]
      const cur = transformRef.current
      if (cur.scale > 1.01) {
        const dx = t.clientX - g.lastPoint.x
        const dy = t.clientY - g.lastPoint.y
        g.lastPoint = { x: t.clientX, y: t.clientY }
        setTransform({
          scale: cur.scale,
          x: clampTranslate(cur.x + dx, cur.scale, r.width),
          y: clampTranslate(cur.y + dy, cur.scale, r.height),
        })
      } else {
        // Not zoomed: track vertical travel for swipe-to-dismiss.
        g.movedY = t.clientY - g.panStartY
      }
    }
  }

  const onTouchEnd = (e: ReactTouchEvent) => {
    const g = gesture.current

    // One finger lifted from a pinch — continue as a single-finger pan.
    if (g.mode === 'pinch' && e.touches.length === 1) {
      const t = e.touches[0]
      g.mode = 'pan'
      g.lastPoint = { x: t.clientX, y: t.clientY }
      g.panStartY = t.clientY
      g.movedY = 0
      g.startTransform = transformRef.current
      return
    }

    if (e.touches.length > 0) return // fingers remain; gesture not over

    if (g.mode === 'pan') {
      if (onClose && shouldCloseOnSwipe(g.movedY, g.startTransform.scale)) {
        g.mode = 'none'
        g.lastTapTime = 0
        onClose()
        return
      }
      // A near-stationary touch is a tap; two in quick succession toggle zoom.
      if (Math.abs(g.movedY) < TAP_SLOP) {
        const now = Date.now()
        if (now - g.lastTapTime < DOUBLE_TAP_MS) {
          const r = rect()
          if (r) zoomTo(doubleTapTarget(transformRef.current.scale), toCenter(g.tapPoint.x, g.tapPoint.y, r), r)
          g.lastTapTime = 0
        } else {
          g.lastTapTime = now
        }
      }
    }
    g.mode = 'none'
  }

  const onDoubleClick = (e: ReactMouseEvent) => {
    const r = rect()
    if (!r) return
    zoomTo(doubleTapTarget(transformRef.current.scale), toCenter(e.clientX, e.clientY, r), r)
  }

  // Callback ref: attaches a non-passive wheel listener the moment the element
  // mounts (React's synthetic onWheel is passive and can't preventDefault).
  const containerRef = useCallback(
    (el: HTMLElement | null) => {
      wheelCleanup.current?.()
      wheelCleanup.current = null
      elementRef.current = el
      if (!el) return
      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const r = el.getBoundingClientRect()
        const cur = transformRef.current
        const target = clampScale(cur.scale * Math.exp(-e.deltaY * 0.0015))
        zoomTo(target, toCenter(e.clientX, e.clientY, r), r)
      }
      el.addEventListener('wheel', onWheel, { passive: false })
      wheelCleanup.current = () => el.removeEventListener('wheel', onWheel)
    },
    // zoomTo/toCenter are stable closures over refs; intentionally no deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const transformStyle = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`

  return {
    containerRef,
    transformStyle,
    transition: animate ? 'transform 0.2s ease-out' : 'none',
    isZoomed: transform.scale > 1.01,
    reset,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onDoubleClick },
  }
}
