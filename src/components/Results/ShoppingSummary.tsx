import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { formatDimension } from '../../utils/units'
import type { PackerResult } from '../../types/plyplan'

interface ShoppingSummaryProps {
  result: PackerResult
}

export function ShoppingSummary({ result }: ShoppingSummaryProps) {
  const sheetWidth = useAppStore((s) => s.sheetWidth)
  const sheetHeight = useAppStore((s) => s.sheetHeight)
  const sheetPrice = useAppStore((s) => s.sheetPricePerUnit)
  const setSheetPrice = useAppStore((s) => s.setSheetPrice)

  const [editingPrice, setEditingPrice] = useState(false)
  const [priceInput, setPriceInput] = useState(String(sheetPrice))

  // Offcuts are already in the shop — only new full sheets go on the shopping list
  const offcutsUsed = result.totalSheets - result.newSheets
  const total = result.newSheets * sheetPrice
  const utilization = (100 - result.totalWastePercent).toFixed(0)

  const commitPrice = () => {
    const val = parseFloat(priceInput)
    if (!isNaN(val) && val >= 0) {
      setSheetPrice(val)
    } else {
      setPriceInput(String(sheetPrice))
    }
    setEditingPrice(false)
  }

  const sheetDim = `${formatDimension(sheetWidth)} × ${formatDimension(sheetHeight)}`

  return (
    <div className="px-3 py-3">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[32px] font-bold text-text leading-none">
          {result.newSheets} sheet{result.newSheets !== 1 ? 's' : ''}
        </span>
        <span className="text-[22px] font-bold text-text leading-none">
          ${total.toFixed(0)}
        </span>
      </div>

      {offcutsUsed > 0 && (
        <p className="text-[13px] text-primary font-medium mb-1">
          {result.newSheets === 0
            ? `Cut entirely from ${offcutsUsed} offcut${offcutsUsed !== 1 ? 's' : ''} you already have`
            : `+ ${offcutsUsed} offcut${offcutsUsed !== 1 ? 's' : ''} you already have`}
        </p>
      )}

      <div className="flex items-center justify-between text-[13px] text-text-muted">
        <span>{sheetDim} · {utilization}% used</span>
        <span>
          {editingPrice ? (
            <span className="inline-flex items-center gap-0.5">
              $
              <input
                type="text"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onBlur={commitPrice}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitPrice()
                  if (e.key === 'Escape') {
                    setPriceInput(String(sheetPrice))
                    setEditingPrice(false)
                  }
                }}
                autoFocus
                className="w-12 text-center bg-surface-raised border border-border rounded px-1 py-0.5 text-[13px] text-text outline-none focus:ring-1 focus:ring-primary/30"
              />
              /ea
            </span>
          ) : (
            <button
              onClick={() => {
                setPriceInput(String(sheetPrice))
                setEditingPrice(true)
              }}
              className="underline decoration-dotted underline-offset-2 hover:text-text transition-colors"
              title="Tap to change price per sheet"
            >
              ${sheetPrice}/ea
            </button>
          )}
        </span>
      </div>
    </div>
  )
}
