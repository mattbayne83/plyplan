/**
 * Reset Safari's page-level pinch-zoom by momentarily re-asserting
 * `maximum-scale=1.0` on the viewport meta tag, then restoring it.
 *
 * WHY: iOS Safari applies page-level pinch-zoom on top of any in-page gestures,
 * which clips the fixed header and shifts the layout until the user manually
 * zooms back out. Rewriting the viewport meta forces the page zoom back to 1;
 * the change in the attribute is what makes Safari recompute. The 100ms restore
 * returns the tag to its baseline afterwards.
 */
export function resetPinchZoom(): void {
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return
  meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover')
  setTimeout(() => {
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
  }, 100)
}
