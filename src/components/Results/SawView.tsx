import { useEffect } from 'react'
import { X, ZoomOut } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { SheetView } from './SheetView'
import { useZoomPan } from '../../hooks/useZoomPan'

export function SawView() {
  const result = useAppStore((s) => s.result)
  const sawViewOpen = useAppStore((s) => s.sawViewOpen)
  const setSawViewOpen = useAppStore((s) => s.setSawViewOpen)
  const activeSheetIndex = useAppStore((s) => s.activeSheetIndex)
  const setActiveSheetIndex = useAppStore((s) => s.setActiveSheetIndex)

  const close = () => setSawViewOpen(false)
  const { containerRef, transformStyle, transition, isZoomed, reset, handlers } = useZoomPan({ onClose: close })

  // Start each viewing session — and each sheet switch — at 1x, centered.
  useEffect(() => {
    reset()
  }, [activeSheetIndex, sawViewOpen, reset])

  if (!sawViewOpen || !result) return null

  const activeSheet = result.sheets[activeSheetIndex]

  return (
    <div className="fixed inset-0 z-50 bg-text/95 flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        {/* Sheet tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {result.sheets.map((sheet, i) => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheetIndex(i)}
              className={`px-4 py-2.5 text-[13px] font-medium rounded-[var(--radius-button)] transition-colors flex-shrink-0 ${
                i === activeSheetIndex
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              Sheet {i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={close}
          aria-label="Close full-screen view"
          className="p-3 text-white/70 hover:text-white transition-colors flex-shrink-0"
        >
          <X size={24} />
        </button>
      </div>

      {/* Zoom surface — touch-none hands us the raw multi-touch stream so the
          gesture hook owns pinch/pan/double-tap, while the app shell stays
          locked against page zoom (pageZoomGuards). */}
      <div
        ref={containerRef}
        {...handlers}
        className="flex-1 overflow-hidden flex items-center justify-center px-4 touch-none"
      >
        {activeSheet && (
          <div
            className="w-full max-w-4xl"
            style={{ transform: transformStyle, transition, transformOrigin: 'center' }}
          >
            <div className="bg-white rounded-[var(--radius-card)] p-4">
              <SheetView sheet={activeSheet} />
            </div>
          </div>
        )}
      </div>

      {/* Footer: reset control when zoomed, otherwise the gesture hint. */}
      <div className="flex items-center justify-center pb-4 pt-2 min-h-[44px] md:hidden">
        {isZoomed ? (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-white/15 px-4 py-2 text-[13px] font-medium text-white hover:bg-white/25 transition-colors"
          >
            <ZoomOut size={14} />
            Reset zoom
          </button>
        ) : (
          <span className="text-white/40 text-[11px]">Pinch or double-tap to zoom · swipe down to close</span>
        )}
      </div>

      {/* Desktop footer: reset control + wheel/dbl-click hint. */}
      <div className="hidden md:flex items-center justify-center pb-4 pt-2 min-h-[44px]">
        {isZoomed ? (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-white/15 px-4 py-2 text-[13px] font-medium text-white hover:bg-white/25 transition-colors"
          >
            <ZoomOut size={14} />
            Reset zoom
          </button>
        ) : (
          <span className="text-white/40 text-[11px]">Scroll or double-click to zoom</span>
        )}
      </div>
    </div>
  )
}
