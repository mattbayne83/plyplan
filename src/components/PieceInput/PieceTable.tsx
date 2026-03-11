import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { PieceCard } from './PieceCard'
import { validatePieces, getErrorsForPiece } from '../../utils/validation'
import { useMemo } from 'react'

export function PieceTable() {
  const pieces = useAppStore((s) => s.pieces)
  const addPiece = useAppStore((s) => s.addPiece)
  const clearPieces = useAppStore((s) => s.clearPieces)
  const sheetWidth = useAppStore((s) => s.sheetWidth)
  const sheetHeight = useAppStore((s) => s.sheetHeight)

  const errors = useMemo(
    () => validatePieces(pieces, sheetWidth, sheetHeight),
    [pieces, sheetWidth, sheetHeight]
  )

  if (pieces.length === 0) return null

  return (
    <div className="bg-surface rounded-[var(--radius-card)] border border-border overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide">
          Pieces
          <span className="text-text-muted font-normal ml-1.5 normal-case">({pieces.length})</span>
        </h2>
        {pieces.length > 0 && (
          <button
            onClick={clearPieces}
            className="text-[13px] text-text-muted hover:text-error flex items-center gap-1.5 py-1 transition-colors"
          >
            <Trash2 size={14} />
            Clear all
          </button>
        )}
      </div>

      {/* Card-based layout */}
      <div className="px-3 py-2.5 space-y-1.5">
        {pieces.map((piece, i) => (
          <PieceCard
            key={piece.id}
            piece={piece}
            index={i}
            errors={getErrorsForPiece(errors, piece.id)}
            onEnterOnLastRow={addPiece}
          />
        ))}
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={addPiece}
          className="w-full flex items-center justify-center gap-2 text-[14px] text-primary font-medium rounded-[var(--radius-button)] py-2.5 px-3 border border-dashed border-primary/30 hover:bg-primary-light transition-colors"
        >
          <Plus size={16} />
          Add piece
        </button>
      </div>
    </div>
  )
}
