# Changelog

All notable changes to plyplan are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); this project is pre-1.0 and not
yet formally versioned.

## [Unreleased]

### Added
- **Test suite (first in the project)** — Vitest 4 + jsdom + Testing Library,
  wired into CI (`lint` → `test` → `build` before the Pages deploy). Unit
  coverage for zoom geometry, page-zoom guards, and unit formatting; RTL
  coverage for the diagram tap-to-open and viewer open/close/reset.
- **Mobile diagram zoom** — The full-screen `SawView` is now a real gesture
  surface: pinch, one-finger pan, double-tap toggle, and swipe-down-to-close
  (wheel + double-click on desktop). Tap the inline result diagram to open it.
- **App-shell zoom lock** — Page-level pinch-zoom is blocked on touch devices
  (`pageZoomGuards` + viewport meta + `touch-action`/`overscroll` CSS) so only
  the diagram zooms; 16px inputs prevent iOS focus-zoom.

### Changed
- `SawView` no longer relies on `touch-action: manipulation` + a "rotate your
  phone" hint; it owns its gestures via `useZoomPan` (`touch-action: none`).

### Fixed
- iOS Safari page pinch-zoom that clipped the fixed header and shifted the
  layout with no easy way back.
