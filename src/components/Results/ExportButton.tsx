import { Download } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { SheetView } from './SheetView'
import { LeftoverReport } from './LeftoverReport'
import { UnplacedPieces } from './UnplacedPieces'
import { formatDimension } from '../../utils/units'
import { getSheetLabel } from '../../utils/labels'

/**
 * One-tap export of the WHOLE plan — shopping summary, every sheet diagram,
 * and the leftover report — as a single tall PNG. In a single-session app
 * this file is the plan's permanent record, so it has to be complete.
 *
 * The report renders off-screen only while exporting; html-to-image
 * rasterizes it, then it unmounts.
 */
export function ExportButton() {
  const result = useAppStore((s) => s.result)
  const sheetWidth = useAppStore((s) => s.sheetWidth)
  const sheetHeight = useAppStore((s) => s.sheetHeight)
  const sheetPrice = useAppStore((s) => s.sheetPricePerUnit)
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exporting) return
    let cancelled = false

    const run = async () => {
      // Two frames so the off-screen report is mounted and painted
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const node = reportRef.current
      if (!node || cancelled) return
      try {
        const dataUrl = await toPng(node, {
          backgroundColor: '#FAF8F5',
          pixelRatio: 2,
          fontEmbedCSS: '',
          // The live node hides off-screen via left: -10000px; the clone
          // inherits that inline style and would rasterize blank without
          // this override.
          style: { position: 'static', left: '0', top: '0' },
        })
        if (cancelled) return
        const link = document.createElement('a')
        link.download = 'plyplan-cut-plan.png'
        link.href = dataUrl
        link.click()
      } catch (err) {
        console.error('Export failed:', err)
      } finally {
        if (!cancelled) setExporting(false)
      }
    }
    void run()

    return () => {
      cancelled = true
    }
  }, [exporting])

  if (!result) return null

  const offcutsUsed = result.totalSheets - result.newSheets

  return (
    <>
      <button
        onClick={() => setExporting(true)}
        disabled={exporting}
        className="p-2.5 rounded-[var(--radius-input)] text-text-muted hover:bg-surface-raised hover:text-text-secondary transition-colors disabled:opacity-50"
        title="Export full plan as PNG"
        aria-label="Export full plan as PNG"
      >
        <Download size={16} className={exporting ? 'animate-pulse' : undefined} />
      </button>

      {exporting && (
        <div
          ref={reportRef}
          aria-hidden
          className="fixed top-0 bg-bg p-6 space-y-5"
          style={{ left: '-10000px', width: 640 }}
        >
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <span className="text-[20px] font-bold text-text">plyplan</span>
            <span className="text-[13px] text-text-muted">cut plan</span>
          </div>

          <div>
            <p className="text-[28px] font-bold text-text leading-none">
              {result.newSheets} sheet{result.newSheets !== 1 ? 's' : ''} to buy — $
              {(result.newSheets * sheetPrice).toFixed(0)}
            </p>
            <p className="text-[13px] text-text-muted mt-1.5">
              {formatDimension(sheetWidth)} × {formatDimension(sheetHeight)} at ${sheetPrice}/ea
              {offcutsUsed > 0 &&
                ` · plus ${offcutsUsed} offcut${offcutsUsed !== 1 ? 's' : ''} from your stock`}
            </p>
          </div>

          {result.unplacedPieces.length > 0 && <UnplacedPieces result={result} />}

          {result.sheets.map((sheet, i) => (
            <div key={sheet.id} className="space-y-1.5">
              <p className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide">
                {getSheetLabel(result.sheets, i)}
              </p>
              <SheetView sheet={sheet} />
            </div>
          ))}

          <LeftoverReport result={result} />
        </div>
      )}
    </>
  )
}
