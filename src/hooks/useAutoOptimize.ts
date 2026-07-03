import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

/**
 * Watches pieces + settings and auto-runs the optimizer (debounced 300ms)
 * when result is null and there are valid pieces.
 */
export function useAutoOptimize() {
  const pieces = useAppStore((s) => s.pieces)
  const sheetWidth = useAppStore((s) => s.sheetWidth)
  const sheetHeight = useAppStore((s) => s.sheetHeight)
  const kerfWidth = useAppStore((s) => s.kerfWidth)
  const optimizationMode = useAppStore((s) => s.optimizationMode)
  const offcuts = useAppStore((s) => s.offcuts)
  const result = useAppStore((s) => s.result)
  const runOptimizer = useAppStore((s) => s.runOptimizer)

  useEffect(() => {
    if (result !== null) return
    const valid = pieces.filter((p) => p.width > 0 && p.height > 0 && p.quantity > 0)
    if (valid.length === 0) return

    const timer = setTimeout(() => {
      runOptimizer()
    }, 300)
    return () => clearTimeout(timer)
  }, [pieces, sheetWidth, sheetHeight, kerfWidth, optimizationMode, offcuts, result, runOptimizer])
}
