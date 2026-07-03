export type PieceId = string
export type SheetId = string
export type OptimizationMode = 'minimize-waste' | 'minimize-saw-changes'

export interface Piece {
  id: PieceId
  label: string
  width: number
  height: number
  quantity: number
  color: string
}

/** A leftover piece of stock already in the shop, usable before buying new sheets. */
export interface StockSheet {
  id: string
  width: number
  height: number
}

export interface Placement {
  pieceId: PieceId
  instanceIndex: number
  x: number
  y: number
  width: number
  height: number
  rotated: boolean
  label: string
  color: string
}

export interface SheetResult {
  id: SheetId
  sheetIndex: number
  width: number
  height: number
  isOffcut: boolean
  placements: Placement[]
  wastePercent: number
  usedArea: number
}

export interface PackerConfig {
  sheetWidth: number
  sheetHeight: number
  kerfWidth: number
  mode: OptimizationMode
  offcuts?: StockSheet[]
}

export interface PackerResult {
  sheets: SheetResult[]
  totalSheets: number
  /** Full-size sheets to buy — excludes offcuts already in the shop. */
  newSheets: number
  totalWastePercent: number
  unplacedPieces: Array<{ pieceId: PieceId; instanceIndex: number }>
}

export interface ExtractedPiece {
  label: string
  width: number
  height: number
  quantity: number
}

export interface ExtractionResult {
  pieces: ExtractedPiece[]
  confidence: 'high' | 'medium' | 'low'
  notes: string
}
