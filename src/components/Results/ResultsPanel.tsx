import { useRef } from 'react'
import { Maximize2, ZoomIn } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { getSheetLabel } from '../../utils/labels'
import { SheetView } from './SheetView'
import { ExportButton } from './ExportButton'
import { ShoppingSummary } from './ShoppingSummary'
import { UnplacedPieces } from './UnplacedPieces'

export function ResultsPanel() {
  const result = useAppStore((s) => s.result)
  const activeSheetIndex = useAppStore((s) => s.activeSheetIndex)
  const setActiveSheetIndex = useAppStore((s) => s.setActiveSheetIndex)
  const setSawViewOpen = useAppStore((s) => s.setSawViewOpen)
  const sheetRef = useRef<HTMLDivElement>(null)

  if (!result) return null

  const activeSheet = result.sheets[activeSheetIndex]

  return (
    <div className="bg-surface rounded-[var(--radius-card)] border border-border overflow-hidden">
      {/* Shopping summary */}
      <div className="border-b border-border bg-surface-raised/50">
        <ShoppingSummary result={result} />
      </div>

      {/* Unplaced pieces warning */}
      {result.unplacedPieces.length > 0 && (
        <div className="p-3 border-b border-border">
          <UnplacedPieces result={result} />
        </div>
      )}

      {/* Sheet tabs + actions */}
      <div className="px-3 pt-2.5 flex items-center justify-between border-b border-border">
        <div className="flex gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          {result.sheets.map((sheet, i) => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheetIndex(i)}
              className={`px-4 py-2.5 text-[13px] font-medium rounded-t-[var(--radius-input)] transition-colors flex-shrink-0 ${
                i === activeSheetIndex
                  ? 'bg-surface border border-b-surface border-border text-text -mb-px'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-raised'
              }`}
            >
              {getSheetLabel(result.sheets, i)}
              {result.sheets.length > 1 && (
                <span className="ml-1 text-text-muted">
                  ({sheet.placements.length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 pb-1 flex-shrink-0">
          <button
            onClick={() => setSawViewOpen(true)}
            className="p-2.5 rounded-[var(--radius-input)] text-text-muted hover:bg-surface-raised hover:text-text-secondary transition-colors"
            title="Full screen view"
          >
            <Maximize2 size={16} />
          </button>
          <ExportButton targetRef={sheetRef} sheetIndex={activeSheetIndex} />
        </div>
      </div>

      {/* Sheet diagram — tap to open the zoomable full-screen viewer.
          The export target (sheetRef) wraps only the diagram, so the
          "Tap to zoom" badge never lands in exported PNGs. */}
      {activeSheet && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Open full-screen zoomable view"
          onClick={() => setSawViewOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setSawViewOpen(true)
            }
          }}
          className="relative cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <div className="p-3" ref={sheetRef}>
            <SheetView sheet={activeSheet} />
          </div>
          <span className="pointer-events-none absolute top-4 right-4 flex items-center gap-1 rounded-full bg-text/70 px-2 py-1 text-[11px] font-medium text-white opacity-80 transition-opacity group-hover:opacity-100">
            <ZoomIn size={12} />
            Tap to zoom
          </span>
        </div>
      )}
    </div>
  )
}
