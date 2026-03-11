import { X, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import type { Piece } from '../../types/plyplan'
import type { ValidationError } from '../../utils/validation'
import { useAppStore } from '../../store/useAppStore'
import { parseDimension, formatDimension } from '../../utils/units'
import { getPieceLabel } from '../../utils/labels'

interface PieceCardProps {
  piece: Piece
  index: number
  errors?: ValidationError[]
  onEnterOnLastRow: () => void
}

export function PieceCard({ piece, index, errors = [], onEnterOnLastRow }: PieceCardProps) {
  const updatePiece = useAppStore((s) => s.updatePiece)
  const removePiece = useAppStore((s) => s.removePiece)
  const unitSystem = useAppStore((s) => s.unitSystem)
  const pieces = useAppStore((s) => s.pieces)

  const [widthInput, setWidthInput] = useState(
    piece.width > 0 ? formatDimension(piece.width, unitSystem) : ''
  )
  const [heightInput, setHeightInput] = useState(
    piece.height > 0 ? formatDimension(piece.height, unitSystem) : ''
  )

  const commitDimension = (field: 'width' | 'height', value: string) => {
    const parsed = parseDimension(value.replace(/["']/g, ''))
    if (parsed !== null) {
      const rounded = Math.round(parsed * 1000) / 1000
      updatePiece(piece.id, { [field]: rounded })
    }
  }

  const handleDimensionChange = (value: string, setter: (v: string) => void) => {
    // For plain decimal input, cap at 3 decimal places
    if (value.includes('.') && !value.includes('/')) {
      const [, decimal] = value.split('.')
      if (decimal && decimal.length > 3) return
    }
    setter(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const isLast = index === pieces.length - 1
      if (isLast) onEnterOnLastRow()
    }
  }

  const hasErrors = errors.length > 0

  return (
    <div className="flex flex-col gap-1">
      <div className={`bg-surface rounded-[var(--radius-input)] border p-1.5 flex items-center justify-between gap-1.5 ${hasErrors ? 'border-error/40 bg-error/5' : 'border-border'}`}>
        
        {/* Delete button (Moved to Far Left) */}
        <button
          onClick={() => removePiece(piece.id)}
          className="p-1.5 rounded-[var(--radius-input)] text-text-muted hover:bg-error-light hover:text-error transition-colors flex-shrink-0"
          title="Remove piece"
        >
          <X size={16} />
        </button>

        {/* Color + Label */}
        <div className="flex items-center flex-shrink-0" title={piece.label || `Piece ${getPieceLabel(index)}`}>
          <div
            className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[12px] font-bold text-white shadow-sm"
            style={{ backgroundColor: piece.color, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            {getPieceLabel(index)}
          </div>
        </div>

        {/* W x H */}
        <div className="flex items-center gap-1 min-w-0">
          <input
            type="text"
            value={widthInput}
            onChange={(e) => handleDimensionChange(e.target.value, setWidthInput)}
            onBlur={() => commitDimension('width', widthInput)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDimension('width', widthInput)
              handleKeyDown(e)
            }}
            placeholder="W"
            inputMode="decimal"
            className="w-16 bg-surface-raised text-[15px] font-medium text-text text-center outline-none placeholder:text-text-muted focus:ring-1 focus:ring-primary/30 rounded-[var(--radius-input)] px-1 py-1.5 border border-border"
          />
          <span className="text-text-muted text-[13px] flex-shrink-0 font-medium">×</span>
          <input
            type="text"
            value={heightInput}
            onChange={(e) => handleDimensionChange(e.target.value, setHeightInput)}
            onBlur={() => commitDimension('height', heightInput)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDimension('height', heightInput)
              handleKeyDown(e)
            }}
            placeholder="H"
            inputMode="decimal"
            className="w-16 bg-surface-raised text-[15px] font-medium text-text text-center outline-none placeholder:text-text-muted focus:ring-1 focus:ring-primary/30 rounded-[var(--radius-input)] px-1 py-1.5 border border-border"
          />
        </div>

        {/* Quantity */}
        <div className="flex items-center flex-shrink-0 justify-end">
          <div className="flex items-center items-stretch bg-surface-raised rounded-[var(--radius-input)] border border-border">
            <button
              type="button"
              onClick={() => updatePiece(piece.id, { quantity: Math.max(1, piece.quantity - 1) })}
              className="px-1.5 py-1 text-text-muted hover:bg-surface hover:text-text active:bg-primary-light transition-colors border-r border-border rounded-l-[var(--radius-input)] flex items-center justify-center p-1.5"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min={1}
              value={piece.quantity}
              onChange={(e) =>
                updatePiece(piece.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
              }
              onKeyDown={handleKeyDown}
              className="w-8 bg-transparent text-[14px] font-medium text-text text-center outline-none placeholder:text-text-muted focus:ring-inset focus:ring-1 focus:ring-primary/30 appearance-none py-1"
            />
            <button
              type="button"
              onClick={() => updatePiece(piece.id, { quantity: piece.quantity + 1 })}
              className="px-1.5 py-1 text-text-muted hover:bg-surface hover:text-text active:bg-primary-light transition-colors border-l border-border rounded-r-[var(--radius-input)] flex items-center justify-center p-1.5"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Validation errors */}
      {hasErrors && (
        <div className="text-[12px] text-error px-1">
          {errors.map((err, i) => (
            <p key={i}>{err.message}</p>
          ))}
        </div>
      )}
    </div>
  )
}
