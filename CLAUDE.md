# Plyplan

**Know how many sheets to buy before you get in the truck.**

Plywood cut sheet optimizer for woodworkers. Snap a photo of a hand-drawn sketch or manually enter piece dimensions → get an instant sheet count + optimized cut layout on standard plywood sheets.

## Tech Stack
- React 19, TypeScript 5.9, Vite 7
- Tailwind CSS 4 (design tokens via `@theme` in `index.css`)
- Zustand 5 (with persist middleware)
- Lucide React (icons)
- Inter font (Google Fonts)
- `@google/genai` — Gemini Vision API for photo extraction (optional)
- `html-to-image` — PNG export
- Vitest 4 + jsdom + Testing Library (`react` / `jest-dom` / `user-event`) — unit + component tests; `npm test` runs `vitest run`

## Architecture
- Phone-first single-page vertical flow: Settings → Empty State / Photo + Pieces → Results
- No router — stacked sections, conditional rendering
- Auto-optimize: `useAutoOptimize` hook watches pieces + settings, debounces 300ms, re-runs packer when `result` is null. No manual "Optimize" button.
- State-driven: Zustand store with `persist` into **sessionStorage** (pieces, settings, offcuts, API key, sheet price only). Single-session app by design: a refresh mid-job is safe, a fresh visit starts blank — nothing outlives the tab
- Offcuts: user-entered leftover stock (`offcuts` in store, edited in Settings). Packer seeds them as bins and only opens new full sheets when nothing fits; `PackerResult.newSheets` is the buy count shown in `ShoppingSummary`
- Algorithm: Two modes in `packer.ts`, dispatched by `OptimizationMode`:
  - **minimize-waste** — Hybrid: runs BOTH best-area-fit maxrects and shelf packing, returns the better result (fewer unplaced → fewer newSheets → fewer bins → less waste)
  - **minimize-saw-changes** — Shelf packing only (a deliberate trade of material for simpler cuts; never overridden)
- Share links: plan state (pieces, settings, offcuts — never the API key) encodes into `#s=<base64url JSON>`; `useShareImport` decodes it on load and strips the hash. The URL is the save file — the single-session answer to persistence
- Visualization: SVG with responsive viewBox
- Mobile zoom: app shell is locked against page pinch-zoom (`usePreventPageZoom` → `pageZoomGuards`); the only zoomable element is the full-screen `SawView` diagram, which owns its own pinch/pan/double-tap gestures via `useZoomPan` (`touch-action: none`). Math lives in pure, unit-tested `utils/zoomMath.ts`.
- Design tokens: CSS variables in `index.css` `@theme` block + JS mirror in `src/styles/tokens.ts`

## Design System
- **Palette**: Warm workshop aesthetic — cream bg (#FAF8F5), walnut text (#2C1810), burnt orange primary (#C2410C)
- **Typography**: Inter, 15px body (mobile legibility), 48px hero number
- **Touch targets**: Min 44px height on all interactive elements
- **Radii**: Card 16px, button 12px, input 8px
- **Tokens**: CSS vars in `@theme` → Tailwind classes (`bg-surface`, `text-text-muted`, `border-border`)
- **JS tokens**: `src/styles/tokens.ts` mirrors CSS for SVG fills and programmatic use

## Key Files

### Core
- `src/types/plyplan.ts` — All type definitions (Piece, Placement, SheetResult, etc.)
- `src/store/useAppStore.ts` — Main Zustand store (persisted)
- `src/styles/tokens.ts` — JS-accessible design tokens + `PIECE_COLORS` array
- `src/hooks/useAutoOptimize.ts` — Debounced auto-optimize hook (consumed in App.tsx)
- `src/hooks/useShareImport.ts` — Imports a plan from a `#s=` share link on load, strips the hash
- `src/hooks/useZoomPan.ts` — Pinch/pan/double-tap/wheel gesture state for the SawView diagram
- `src/hooks/usePreventPageZoom.ts` — Installs the page-zoom guards for the app shell's lifetime

### Algorithm & Utils
- `src/utils/packer.ts` — Bin packing algorithms (maxrects + shelf, hybrid dispatch)
- `src/utils/leftovers.ts` — Post-hoc usable-leftover rects per sheet (disjoint, kerf-aware, ≥4" side & ≥1 sq ft)
- `src/utils/share.ts` — Share-link codec (versioned base64url JSON, validated on decode, no API key)
- `src/utils/units.ts` — Fraction parsing ("3-1/2" → 3.5) and display formatting
- `src/utils/validation.ts` — Per-piece validation (zero dims, exceeds sheet, bad qty)
- `src/utils/zoomMath.ts` — Pure zoom/pan geometry (clamp, focal-stable zoom, swipe-close); unit-tested
- `src/utils/pageZoomGuards.ts` — Document-level guards blocking iOS page pinch-zoom + self-heal
- `src/utils/resetPinchZoom.ts` — Viewport-meta snap-back to undo residual page zoom
- `src/services/gemini.ts` — Gemini Vision API integration

### Components — Input
- `src/components/common/DimensionInput.tsx` — Shared draft-buffered dimension input (commit on blur/Enter); used by PieceCard, SettingsPanel, PhotoPreview
- `src/components/EmptyState.tsx` — "What are you building?" with camera + manual CTAs
- `src/components/PieceInput/PieceCard.tsx` — Card-based piece input (mobile-optimized)
- `src/components/PieceInput/PieceTable.tsx` — Piece list container (renders PieceCards)
- `src/components/PieceInput/PhotoUpload.tsx` — Photo upload with `capture="environment"` for mobile camera
- `src/components/PieceInput/PhotoPreview.tsx` — Extracted pieces review with inline dimension editing

### Components — Results
- `src/components/Results/ShoppingSummary.tsx` — Hero sheet count + cost summary with editable price
- `src/components/Results/UnplacedPieces.tsx` — Explains unplaced pieces with reasons
- `src/components/Results/ResultsPanel.tsx` — Results container: Shopping → Unplaced → Sheet tabs → Diagram (tap diagram to open SawView)
- `src/components/Results/SheetView.tsx` — SVG cut sheet visualization
- `src/components/Results/SawView.tsx` — Full-screen zoomable diagram viewer (pinch/double-tap/drag via `useZoomPan`)
- `src/components/Results/LeftoverReport.tsx` — "Leftovers worth keeping" — usable offcuts this job produces
- `src/components/Results/ShareButton.tsx` — Share-link button (native share sheet on phones, clipboard fallback)
- `src/components/Results/ExportButton.tsx` — One-tap full-plan PNG export (off-screen report: summary + all sheets + leftovers)

### Layout
- `src/components/Header.tsx` — App header with settings toggle
- `src/components/Settings/SettingsPanel.tsx` — Sheet size, offcuts on hand, kerf, units, price, optimization mode, API key

### Testing
- `src/test/setup.ts` — jest-dom matchers + an in-memory `localStorage` polyfill for store-backed tests
- `*.test.ts(x)` colocated with source — `zoomMath`, `pageZoomGuards`, `resetPinchZoom`, `units`, `packer`, `leftovers`, `share` (unit); `SawView`, `ResultsPanel`, `SettingsPanel`, `DimensionInput` (RTL)

## Docs
- `docs/VISION.md` — Product vision, north star, "Two Moments" framework, competitive position
- `tasks/backlog.md` — Prioritized feature backlog (P0–P3 + Icebox + Algorithm)

## Gotchas
- **`@google/genai` not `@google/generative-ai`** — Use the newer SDK for Gemini 2.0+ features
- **Kerf is asymmetric** — Added to right + bottom of placed pieces only, not at sheet edges
- **Never bind dimension inputs straight to the store** — A controlled input with parse-or-ignore `onChange` snaps back on every invalid keystroke, so the field can never be emptied. Use `DimensionInput` (local draft while focused, commit on blur/Enter)
- **Sheets vary in size once offcuts exist** — Render from `SheetResult.width/height/isOffcut`, not the store's `sheetWidth/sheetHeight`. Offcut bins are pre-seeded in the packer; unused ones are dropped in `buildResults`, so never assume `sheets[i]` is a full sheet
- **`newSheets` vs `totalSheets`** — `newSheets` excludes offcuts and drives the shopping summary (count × price); `totalSheets` counts every bin used
- **Packer is pure** — `guillotinePack(pieces, config)` returns data, no store access. `config.mode` selects algorithm
- **Shelf packer normalizes orientation** — pieces are oriented so height <= width, reducing unique shelf heights
- **Fraction parsing handles multiple formats** — "3-1/2", "3 1/2", "3.5", "1/4"
- **Single-session by design** — The store persists to `sessionStorage`, never `localStorage`; the app must start blank on a new visit. Features that assume cross-visit memory (saved projects, offcut libraries) are out of scope unless the direction changes. The store module also clears legacy `localStorage` keys on load
- **Only persist user data** — Never persist results, photo data, or extraction state
- **Object URLs must be revoked** — `URL.revokeObjectURL()` on photo clear to prevent leaks
- **SVG export needs HTML wrapper** — `html-to-image` `toPng` targets the div containing the SVG, not the SVG directly
- **Export renders off-screen** — `ExportButton` mounts the full report at `left: -10000px` only while exporting (needs two rAFs before `toPng`; `display: none` won't rasterize)
- **Share links carry no secrets** — `encodeShareState` must never include `geminiApiKey`; decode validates every field and returns null on anything suspect (links are untrusted input)
- **PIECE_COLORS in tokens.ts** — Store imports from `styles/tokens.ts`, not inline. Keep them in sync.
- **Auto-optimize invalidation** — Changing pieces/settings sets `result` to null → hook detects and re-runs. Don't call `runOptimizer` directly from UI.
- **SawView is a full-screen overlay** — z-50, fixed, renders outside main layout. Toggled via `sawViewOpen` store flag. It's the *only* element allowed to pinch-zoom (its surface sets `touch-action: none`); the rest of the shell is locked.
- **Page zoom is globally blocked on touch** — `body` is `touch-action: pan-x pan-y` and `pageZoomGuards` preventDefaults iOS gestures. Any future "zoom this in place" UI must opt out with `touch-action: none` and handle its own gesture, or it won't zoom.
- **iOS focus-zoom needs 16px inputs** — Inputs/textareas/selects are forced to 16px on `max-width: 767px` (index.css); dropping below re-introduces the un-recoverable focus-zoom the guards can't catch.
- **Leftover rects must stay disjoint** — `computeLeftovers` clips each kept candidate against the rest; overlapping leftovers would double-count material in the report.
- **`useZoomPan` wheel listener is a callback ref** — React's synthetic `onWheel` is passive and can't `preventDefault`; the hook attaches a native non-passive listener via a callback ref instead.
- **Tests need a `localStorage` polyfill** — The persisted store touches `localStorage` at import; `src/test/setup.ts` provides an in-memory shim so jsdom component tests don't crash on import.
- **`capture="environment"` is inconsistent** — Gracefully falls back to file picker on unsupported browsers
- **ShoppingSummary inline edit** — Uses local component state for price editing, syncs to store on blur
