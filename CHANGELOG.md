# Changelog

All notable changes to plyplan are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); this project is pre-1.0 and not
yet formally versioned.

## [Unreleased]

### Added
- **Offcuts on hand** — Enter leftover stock (e.g. a 24×48 scrap in the garage)
  in Settings; the optimizer cuts from those before opening new sheets. The
  shopping summary now shows only the sheets you need to *buy*, with a note
  when offcuts cover part (or all) of the job. Sheet tabs and diagrams label
  offcuts and render at their true size.
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
- **Single-session storage** — App state (pieces, settings, offcuts, API key)
  now persists to `sessionStorage` instead of `localStorage`: an accidental
  refresh mid-job keeps your cut list, but every fresh visit starts blank.
  Legacy `localStorage` data from earlier builds is cleared on load.
- `SawView` no longer relies on `touch-action: manipulation` + a "rotate your
  phone" hint; it owns its gestures via `useZoomPan` (`touch-action: none`).

### Fixed
- Dimension fields (custom sheet size, photo-extraction review) could never be
  fully cleared — each keystroke that didn't parse snapped back to the old
  value, so you had to edit around one remaining digit. All dimension inputs
  now share a draft-buffered `DimensionInput` that commits on blur/Enter and
  reverts cleanly if left empty. *(Beta-tester feedback)*
- iOS Safari page pinch-zoom that clipped the fixed header and shifted the
  layout with no easy way back.
