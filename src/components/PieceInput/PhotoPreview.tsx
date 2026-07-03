import { Check, X, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { DimensionInput } from '../common/DimensionInput'
import type { ExtractedPiece } from '../../types/plyplan'

export function PhotoPreview() {
  const uploadedPhotoUrl = useAppStore((s) => s.uploadedPhotoUrl)
  const extractionStatus = useAppStore((s) => s.extractionStatus)
  const extractionResult = useAppStore((s) => s.extractionResult)
  const extractionError = useAppStore((s) => s.extractionError)
  const setUploadedPhoto = useAppStore((s) => s.setUploadedPhoto)
  const setExtractionStatus = useAppStore((s) => s.setExtractionStatus)
  const setExtractionResult = useAppStore((s) => s.setExtractionResult)
  const setExtractionError = useAppStore((s) => s.setExtractionError)
  const importExtractedPieces = useAppStore((s) => s.importExtractedPieces)
  const geminiApiKey = useAppStore((s) => s.geminiApiKey)

  // Local editable copy of extracted pieces
  const [editablePieces, setEditablePieces] = useState<ExtractedPiece[]>(
    () => extractionResult?.pieces ? [...extractionResult.pieces.map(p => ({ ...p }))] : []
  )
  const [selected, setSelected] = useState<Set<number>>(() => {
    const all = new Set<number>()
    if (extractionResult) {
      extractionResult.pieces.forEach((_, i) => all.add(i))
    }
    return all
  })

  // Sync editablePieces when extractionResult changes
  if (extractionResult && editablePieces.length === 0 && extractionResult.pieces.length > 0) {
    setEditablePieces([...extractionResult.pieces.map(p => ({ ...p }))])
    const all = new Set<number>()
    extractionResult.pieces.forEach((_, i) => all.add(i))
    setSelected(all)
  }

  const clearPhoto = () => {
    if (uploadedPhotoUrl) URL.revokeObjectURL(uploadedPhotoUrl)
    setUploadedPhoto(null)
    setExtractionResult(null)
    setExtractionError(null)
    setExtractionStatus('idle')
  }

  const toggleSelection = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const updateEditablePiece = (index: number, field: keyof ExtractedPiece, value: string | number) => {
    setEditablePieces(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleImport = () => {
    const selectedPieces = editablePieces.filter((_, i) => selected.has(i))
    if (selectedPieces.length > 0) {
      importExtractedPieces(selectedPieces)
    }
    clearPhoto()
  }

  return (
    <div className="bg-surface rounded-[var(--radius-card)] border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide">
          Sketch Photo
        </h2>
        <button
          onClick={clearPhoto}
          className="text-[13px] text-text-muted hover:text-error flex items-center gap-1.5 py-1 transition-colors"
        >
          <X size={14} />
          Remove
        </button>
      </div>

      {/* Photo thumbnail */}
      {uploadedPhotoUrl && (
        <div className="p-3">
          <img
            src={uploadedPhotoUrl}
            alt="Uploaded sketch"
            className="w-full rounded-[var(--radius-input)] border border-border object-contain max-h-48"
          />
        </div>
      )}

      {/* Extraction states */}
      <div className="px-3 pb-3">
        {extractionStatus === 'extracting' && (
          <div className="flex flex-col items-center gap-2 py-6">
            <Loader2 size={24} className="text-primary animate-spin" />
            <p className="text-[15px] text-text-secondary">Reading your sketch...</p>
            <p className="text-[13px] text-text-muted">This usually takes a few seconds</p>
          </div>
        )}

        {extractionStatus === 'error' && (
          <div className="flex flex-col items-center gap-2 py-6">
            <AlertCircle size={24} className="text-error" />
            <p className="text-[13px] text-error">{extractionError}</p>
            {geminiApiKey && (
              <button
                onClick={clearPhoto}
                className="text-[13px] text-primary hover:underline flex items-center gap-1"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            )}
          </div>
        )}

        {extractionStatus === 'idle' && !geminiApiKey && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-[15px] text-text-secondary">
              Add a Gemini API key in settings to extract dimensions automatically.
            </p>
            <p className="text-[13px] text-text-muted">
              Or enter pieces manually below.
            </p>
          </div>
        )}

        {extractionStatus === 'done' && editablePieces.length > 0 && (
          <div className="space-y-3">
            {/* Confidence badge */}
            {extractionResult && (
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${
                    extractionResult.confidence === 'high'
                      ? 'bg-success-light text-success'
                      : extractionResult.confidence === 'medium'
                        ? 'bg-warning-light text-warning'
                        : 'bg-error-light text-error'
                  }`}
                >
                  {extractionResult.confidence} confidence
                </span>
                {extractionResult.notes && (
                  <span className="text-[11px] text-text-muted italic truncate">{extractionResult.notes}</span>
                )}
              </div>
            )}

            {/* Editable piece cards */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {editablePieces.map((piece, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-2.5 p-2.5 rounded-[var(--radius-input)] cursor-pointer transition-colors ${
                    selected.has(i) ? 'bg-primary-light/50' : 'hover:bg-surface-raised'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleSelection(i)}
                    className="rounded border-border-strong text-primary focus:ring-primary/30 flex-shrink-0"
                  />
                  <span className="text-[15px] text-text font-medium flex-1 min-w-0 truncate">
                    {piece.label}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <DimensionInput
                      value={piece.width}
                      onClick={(e) => e.stopPropagation()}
                      onCommit={(v) => updateEditablePiece(i, 'width', v)}
                      placeholder="W"
                      className="w-12 text-[13px] text-center bg-surface border border-border rounded px-1 py-1 outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <span className="text-text-muted text-[11px]">×</span>
                    <DimensionInput
                      value={piece.height}
                      onClick={(e) => e.stopPropagation()}
                      onCommit={(v) => updateEditablePiece(i, 'height', v)}
                      placeholder="H"
                      className="w-12 text-[13px] text-center bg-surface border border-border rounded px-1 py-1 outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <span className="text-text-muted text-[11px]">×</span>
                    <input
                      type="number"
                      min={1}
                      value={piece.quantity}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateEditablePiece(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 text-[13px] text-center bg-surface border border-border rounded px-1 py-1 outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </label>
              ))}
            </div>

            {/* Import button */}
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white text-[15px] font-medium rounded-[var(--radius-button)] py-3 px-4 hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={18} />
              Import {selected.size} piece{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
