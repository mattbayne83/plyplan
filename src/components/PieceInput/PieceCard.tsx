import { X, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import type { Piece } from '../../types/cutSheet'
import type { ValidationError } from '../../utils/validation'
import { useAppStore } from '../../store/useAppStore'
import { parseDimension, formatDimension } from '../../utils/units'

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
      updatePiece(piece.id, { [field]: parsed })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const isLast = index === pieces.length - 1
      if (isLast) onEnterOnLastRow()
    }
  }

  const hasErrors = errors.length > 0

  return (
    <div className={`bg-surface rounded-[var(--radius-input)] border p-3 space-y-2 ${hasErrors ? 'border-error/40' : 'border-border'}`}>
      {/* Row 1: Color + Label + Delete */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded flex-shrink-0"
          style={{ backgroundColor: piece.color }}
        />
        <input
          type="text"
          value={piece.label}
          onChange={(e) => updatePiece(piece.id, { label: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder={`Piece ${index + 1}`}
          className="flex-1 min-w-0 bg-transparent text-[15px] text-text outline-none placeholder:text-text-muted focus:bg-surface-raised focus:ring-1 focus:ring-primary/30 rounded-[var(--radius-input)] px-2 py-2"
        />
        <button
          onClick={() => removePiece(piece.id)}
          className="p-2.5 rounded-[var(--radius-input)] text-text-muted hover:bg-error-light hover:text-error transition-colors flex-shrink-0"
          title="Remove piece"
        >
          <X size={16} />
        </button>
      </div>

      {/* Row 2: Width x Height + Qty */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <input
            type="text"
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            onBlur={() => commitDimension('width', widthInput)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDimension('width', widthInput)
              handleKeyDown(e)
            }}
            placeholder="W"
            className="w-16 bg-surface-raised text-[15px] text-text text-center outline-none placeholder:text-text-muted focus:ring-1 focus:ring-primary/30 rounded-[var(--radius-input)] px-1 py-2.5 border border-border"
          />
          <span className="text-text-muted text-[13px] flex-shrink-0">×</span>
          <input
            type="text"
            value={heightInput}
            onChange={(e) => setHeightInput(e.target.value)}
            onBlur={() => commitDimension('height', heightInput)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDimension('height', heightInput)
              handleKeyDown(e)
            }}
            placeholder="H"
            className="w-16 bg-surface-raised text-[15px] text-text text-center outline-none placeholder:text-text-muted focus:ring-1 focus:ring-primary/30 rounded-[var(--radius-input)] px-1 py-2.5 border border-border"
          />
        </div>
        <div className="flex items-center flex-shrink-0 ml-auto mr-1">
          <span className="text-text-muted text-[13px] mr-2">qty</span>
          <div className="flex items-center items-stretch bg-surface-raised rounded-[var(--radius-input)] border border-border">
            <button
              type="button"
              onClick={() => updatePiece(piece.id, { quantity: Math.max(1, piece.quantity - 1) })}
              className="px-2.5 py-1.5 text-text-muted hover:bg-surface hover:text-text active:bg-primary-light transition-colors border-r border-border rounded-l-[var(--radius-input)] flex items-center justify-center p-2.5"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              min={1}
              value={piece.quantity}
              onChange={(e) =>
                updatePiece(piece.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
              }
              onKeyDown={handleKeyDown}
              className="w-12 bg-transparent text-[15px] font-medium text-text text-center outline-none placeholder:text-text-muted focus:ring-inset focus:ring-1 focus:ring-primary/30 py-1.5 appearance-none"
            />
            <button
              type="button"
              onClick={() => updatePiece(piece.id, { quantity: piece.quantity + 1 })}
              className="px-2.5 py-1.5 text-text-muted hover:bg-surface hover:text-text active:bg-primary-light transition-colors border-l border-border rounded-r-[var(--radius-input)] flex items-center justify-center p-2.5"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Validation errors */}
      {hasErrors && (
        <div className="text-[13px] text-error">
          {errors.map((err, i) => (
            <p key={i}>{err.message}</p>
          ))}
        </div>
      )}
    </div>
  )
}
