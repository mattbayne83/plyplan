import { useState, useMemo } from 'react'
import type { SheetResult, Piece } from '../../types/plyplan'
import { useAppStore } from '../../store/useAppStore'
import { formatDimension } from '../../utils/units'
import { colors } from '../../styles/tokens'
import { getPieceLabel } from '../../utils/labels'

interface SheetViewProps {
  sheet: SheetResult
}

const PADDING = 4
const LABEL_FONT_SIZE = 3.5
const DIM_FONT_SIZE = 2.8

export function SheetView({ sheet }: SheetViewProps) {
  const sheetWidth = useAppStore((s) => s.sheetWidth)
  const sheetHeight = useAppStore((s) => s.sheetHeight)
  const unitSystem = useAppStore((s) => s.unitSystem)
  const pieces = useAppStore((s) => s.pieces)
  const [hoveredPieceIdx, setHoveredPieceIdx] = useState<number | null>(null)

  const viewW = sheetWidth + PADDING * 2
  const viewH = sheetHeight + PADDING * 2

  // Derive the unique pieces and counts used specifically on this sheet
  const sheetLegendItems = useMemo(() => {
    const counts = new Map<string, number>()
    sheet.placements.forEach((p) => {
      counts.set(p.pieceId, (counts.get(p.pieceId) || 0) + 1)
    })
    
    const items: Array<{
      piece: Piece;
      index: number;
      sheetCount: number;
    }> = []

    // Preserve the original ordering from the user's input list
    pieces.forEach((piece, index) => {
      if (counts.has(piece.id)) {
        items.push({
          piece,
          index,
          sheetCount: counts.get(piece.id)!
        })
      }
    })

    return items
  }, [pieces, sheet.placements])

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full border border-border rounded-[var(--radius-input)] bg-surface"
      >
        <defs>
          <pattern id={`hatch-${sheet.id}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={colors.border} strokeWidth="0.5" />
          </pattern>
        </defs>

        <g transform={`translate(${PADDING}, ${PADDING})`}>
          {/* Sheet background (waste) */}
          <rect
            x={0} y={0}
            width={sheetWidth} height={sheetHeight}
            fill={`url(#hatch-${sheet.id})`}
            stroke={colors.textMuted}
            strokeWidth="0.5"
          />

          {/* Placed pieces */}
          {sheet.placements.map((p, i) => {
            const isHovered = hoveredPieceIdx === i
            // Find alpha index of this placement's related piece from the store array for label.
            const pieceIndex = pieces.findIndex(item => item.id === p.pieceId)
            const alphaLabel = pieceIndex >= 0 ? getPieceLabel(pieceIndex) : p.label || 'Piece'
            
            const dimText = `${formatDimension(p.rotated ? p.height : p.width, unitSystem)} × ${formatDimension(p.rotated ? p.width : p.height, unitSystem)}`
            const centerX = p.x + p.width / 2
            const centerY = p.y + p.height / 2
            const hasRoomForLabel = p.width >= 8 && p.height >= 6
            const hasRoomForDim = p.width >= 8 && p.height >= 10

            return (
              <g
                key={`${p.pieceId}-${p.instanceIndex}`}
                onMouseEnter={() => setHoveredPieceIdx(i)}
                onMouseLeave={() => setHoveredPieceIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={p.x} y={p.y} width={p.width} height={p.height}
                  fill={p.color}
                  fillOpacity={isHovered ? 0.7 : 0.5}
                  stroke={isHovered ? colors.text : p.color}
                  strokeWidth={isHovered ? 0.8 : 0.5}
                  rx={0.5}
                />
                {hasRoomForLabel && (
                  <text
                    x={centerX} y={centerY - (hasRoomForDim ? 1.2 : 0)}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={LABEL_FONT_SIZE} fontWeight={600}
                    fill={colors.text}
                    className="pointer-events-none select-none"
                  >
                    {alphaLabel}
                  </text>
                )}
                {hasRoomForDim && (
                  <text
                    x={centerX} y={centerY + LABEL_FONT_SIZE - 0.5}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={DIM_FONT_SIZE}
                    fill={colors.textSecondary}
                    className="pointer-events-none select-none"
                  >
                    {dimText}
                  </text>
                )}
              </g>
            )
          })}

          {/* Sheet border */}
          <rect x={0} y={0} width={sheetWidth} height={sheetHeight}
            fill="none" stroke={colors.text} strokeWidth="0.8" />

        </g>
      </svg>

      {/* Piece Legend (Included in Export) */}
      {sheetLegendItems.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-muted px-1">
          {sheetLegendItems.map((item) => (
            <div key={item.piece.id} className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-[3px] flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: item.piece.color, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
              >
                {getPieceLabel(item.index)}
              </div>
              <span className="text-text-secondary">
                {formatDimension(item.piece.width, unitSystem)} × {formatDimension(item.piece.height, unitSystem)}
              </span>
              <span className="text-text-muted">×{item.sheetCount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

