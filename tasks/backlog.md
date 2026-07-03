# Plyplan — Backlog

> Prioritized by impact on the two core moments:
> **Moment 1** — "How many sheets do I need?" (phone, garage, 60 seconds)
> **Moment 2** — "Where do I cut?" (print or phone at the saw)
>
> See `docs/VISION.md` for full product vision and phasing.

---

## P0 — Make It Work on a Phone (v1.0 release)

The current app was built desktop-first. These items flip it to phone-first — the primary use case.

### Moment 1: The Answer
- [x] **Hero sheet count** — After optimization, the #1 visual is the answer: **"2 sheets"** in large, bold type. Waste %, utilization, and diagram are secondary. (`HeroAnswer.tsx`)
- [x] **Shopping summary** — Below the sheet count: "2 sheets of 4'x8' at ~$55/sheet = ~$110." Editable price inline. (`ShoppingSummary.tsx`)
- [x] **Quick photo flow (mobile)** — `capture="environment"` opens camera directly on mobile. Snap → extract → review → optimize. (`PhotoUpload.tsx`)

### Moment 2: The Diagram
- [x] **Print-ready output** — PNG export via `html-to-image`. (`ExportButton.tsx`) *(PDF deferred to P2)*
- [x] **Phone-at-the-saw view** — Full-screen overlay with real gesture zoom: pinch, one-finger pan, double-tap toggle, swipe-down-to-close (wheel + double-click on desktop). The app shell is locked against page pinch-zoom so only the diagram zooms. Tap the inline diagram to open; reset-zoom control. (`SawView.tsx`, `useZoomPan.ts`, `pageZoomGuards.ts`)

### Mobile UX
- [x] **Mobile-first layout** — Card-based piece input (`PieceCard.tsx`), full-width photo capture, 44px touch targets, `max-w-lg` container. (`App.tsx`, `PieceTable.tsx`)
- [x] **Inline dimension correction** — Tap dimensions inline in `PhotoPreview.tsx` to fix AI misreads. Local state, no modal.
- [x] **Auto-optimize on change** — Debounced 300ms hook watches pieces + settings, re-runs when `result` is null. No manual button. (`useAutoOptimize.ts`)

### Polish
- [x] **Empty state** — "What are you building?" with camera button (primary) + manual entry (secondary) + SVG illustration. (`EmptyState.tsx`)
- [x] **Error handling** — Per-piece validation: zero dims, exceeds sheet, bad qty. Inline errors on cards. (`validation.ts`, `PieceCard.tsx`)
- [x] **Unplaced pieces UX** — Groups by piece, shows label + dimensions + reason. (`UnplacedPieces.tsx`)
- [x] **Loading states** — Staged: "Reading your sketch..." → cards appear with inline editing. (`PhotoPreview.tsx`)

---

## P1 — Trust & Accuracy (v1.x)

Features that make the sheet count answer trustworthy and the diagram useful.

### Algorithm Quality
- [ ] **Hybrid algorithm** — Run both guillotine and shelf, return the better result. Small compute cost, potentially 1 fewer sheet on edge cases. The sheet count must be right.
- [ ] **Benchmark suite** — Standard test sets (e.g., 77 pieces on 4x8 sheets). Compare against MaxCut results. Track regression. If we say "2 sheets" and MaxCut says "1," we've lost trust permanently. *(Vitest harness now in place to build this on — see CLAUDE.md "Testing".)*
- [ ] **Guillotine constraint enforcement** — Verify all cuts can be made with a panel saw (straight through). Non-guillotine-safe layouts look good on screen but can't be executed in a real shop.

### Grain Direction
- [ ] **Per-piece grain lock** — Toggle: "grain runs lengthwise." Optimizer won't rotate that piece. Critical for plywood with visible grain.
- [ ] **Visual grain indicator** — Arrow or line pattern on pieces in the diagram so you know orientation at the saw.

### Existing Stock
- [x] **Use partial sheets** — "I have a 24x48 offcut in the garage." Offcuts entered in Settings are packed before new sheets; shopping summary counts only sheets to buy. (`SettingsPanel.tsx`, `packer.ts`, `ShoppingSummary.tsx`) *(Shipped from beta-tester feedback)*

### Cost
- [x] **Material cost estimation** — User sets price per sheet → total cost calculated. Implemented in `ShoppingSummary.tsx` with inline editable price. *(Shipped in P0 sprint)*

---

## P2 — Make the Session Count (v2.x)

> **Direction (2026-07):** Plyplan is a single-session app — no cross-visit
> memory or persistence (store is sessionStorage-only). The plan leaves the
> app via export/share, not via saved state. Items assuming stored projects
> moved to Icebox.

### Session Output
- [ ] **Leftover report** — After optimization, list the usable offcuts this job produces ("you'll have a 24×36 and a 12×48 left"). User can jot them down or re-enter them as Offcuts On Hand next visit. Pairs with export.
- [ ] **Undo/redo** — History stack for piece edits and settings. Familiar pattern. (Within-session only.)

### Materials
- [ ] **Material library** — Saved sheet goods: name, size, thickness, price, grain. Pre-populated with common US sizes.
- [ ] **Multi-material projects** — Mix 3/4" ply + 1/4" MDF + hardwood backer in one project. Optimizer groups by material.

### Sharing
- [ ] **Shareable project link** — Encode pieces + settings + offcuts in the URL. Text your spouse "we need 2 sheets," or bookmark it — the URL *is* the save file, so this doubles as opt-in persistence without storing anything.

### Export
- [ ] **PDF export** — Multi-page: page 1 = shopping list + summary, page 2+ = cut diagrams. Print-ready for the shop wall.
- [ ] **Import/export formats** — CSV, JSON. Interop with OpenCutList and other tools.

### Manual Adjustment
- [ ] **Drag-and-drop post-optimization** — Move pieces after the algorithm runs. Sometimes you know your saw setup better.
- [ ] **Lock piece placement** — Pin a piece, re-optimize around it.

---

## P3 — Intelligence Layer (v3.x)

AI becomes a workflow partner, not just an input method.

- [ ] **Natural language edits** — "Make the top shelf 2 inches wider" → dimensions update, re-optimize.
- [ ] **Smart suggestions** — "This piece is 23.75" — round to 24" and save a sheet?"
- [ ] **Batch optimization** — "I have 3 projects this month. Combine to share sheets."
- [ ] **CAD file import** — Parse .skp (SketchUp) or .step exports to extract cut lists.
- [ ] **Linear material** — Board/lumber optimization (1D bin packing) for hardwood rails, trim, dimensional lumber.
- [ ] **Edge banding compensation** — Specify which edges get banding + thickness. Auto-adjust cut dimensions.

---

## Icebox (Good Ideas, No Timeline)

- [ ] **Project library** — Save, name, duplicate projects. *(Iceboxed: conflicts with single-session direction.)*
- [ ] **Cross-project offcut reuse** — "You have a 24x36 offcut from the bookshelf build." *(Iceboxed: needs cross-visit memory.)*
- [ ] **Cloud sync** — Work on laptop, reference on phone. *(Iceboxed: single-session direction; shareable link covers the hand-off.)*
- [ ] **Dark mode** — Respect `prefers-color-scheme`, manual toggle.
- [ ] **Metric-first locale** — Auto-detect locale, default to mm for non-US users.
- [ ] **PWA / offline mode** — Service worker for offline use in shops with poor connectivity. High-value for the phone-at-the-saw use case.
- [ ] **Nesting for irregular shapes** — True 2D nesting (not just rectangles). Different algorithm (NFP-based).
- [ ] **CNC integration** — Export G-code or DXF. Different audience than our primary.
- [ ] **Multi-language** — i18n for Spanish, German, Japanese (large woodworking communities).
- [ ] **Community templates** — Pre-built cut lists for common projects (bookshelf, workbench, drawer set).
- [ ] **AR overlay** — Camera overlay on physical sheets showing where to cut. Ambitious.

---

## Algorithm Improvements (Ongoing)

Cross-cutting — improve the core regardless of phase. The sheet count must be right.

- [ ] **Benchmark against MaxCut** — Standard test set, verify equal or fewer sheets. MaxCut is the accuracy benchmark.
- [ ] **Hybrid algorithm** — Try guillotine + shelf, take the better result.
- [ ] **Simulated annealing refinement** — Post-placement SA to swap/rotate for marginal improvement.
- [ ] **Multi-sheet global optimization** — Currently packs sheet-by-sheet greedily. Global redistribution could save a sheet.
- [ ] **Kerf modeling refinement** — Half-kerf per side instead of asymmetric right+bottom. More physically accurate.
