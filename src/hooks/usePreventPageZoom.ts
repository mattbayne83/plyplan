import { useEffect } from 'react'
import { installPageZoomGuards } from '../utils/pageZoomGuards'

/**
 * Blocks page-level pinch-zoom on touch devices for the lifetime of the
 * component, so the app shell never page-zooms and only the fullscreen diagram
 * viewer (which owns its own gestures) zooms. No-op on non-touch devices.
 */
export function usePreventPageZoom(): void {
  useEffect(() => installPageZoomGuards(), [])
}
