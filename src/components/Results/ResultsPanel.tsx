import { useRef } from 'react'
import { Maximize2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
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
        <div className="flex gap-1 overflow-x-auto flex-1 min-w-0">
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
              Sheet {i + 1}
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

      {/* Sheet diagram */}
      {activeSheet && (
        <div className="p-3" ref={sheetRef}>
          <SheetView sheet={activeSheet} />
        </div>
      )}
    </div>
  )
}
