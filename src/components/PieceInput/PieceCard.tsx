import { X, Plus, Minus } from 'lucide-react'
import type { Piece } from '../../types/plyplan'
import type { ValidationError } from '../../utils/validation'
import { useAppStore } from '../../store/useAppStore'
import { DimensionInput } from '../common/DimensionInput'
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
  const pieces = useAppStore((s) => s.pieces)

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
          <DimensionInput
            value={piece.width}
            onCommit={(v) => updatePiece(piece.id, { width: v })}
            onKeyDown={handleKeyDown}
            placeholder="W"
            className="w-16 bg-surface-raised text-[15px] font-medium text-text text-center outline-none placeholder:text-text-muted focus:ring-1 focus:ring-primary/30 rounded-[var(--radius-input)] px-1 py-1.5 border border-border"
          />
          <span className="text-text-muted text-[13px] flex-shrink-0 font-medium">×</span>
          <DimensionInput
            value={piece.height}
            onCommit={(v) => updatePiece(piece.id, { height: v })}
            onKeyDown={handleKeyDown}
            placeholder="H"
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
