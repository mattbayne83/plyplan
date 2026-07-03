import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Piece,
  PieceId,
  OptimizationMode,
  PackerResult,
  ExtractionResult,
  ExtractedPiece,
  StockSheet,
} from '../types/plyplan'
import { generateId } from '../utils/id'
import { guillotinePack } from '../utils/packer'
import type { SharedState } from '../utils/share'
import { PIECE_COLORS } from '../styles/tokens'

interface AppState {
  // Pieces
  pieces: Piece[]
  colorIndex: number

  // Settings
  sheetWidth: number
  sheetHeight: number
  kerfWidth: number
  optimizationMode: OptimizationMode
  geminiApiKey: string
  sheetPricePerUnit: number

  // Offcuts — leftover stock in the shop, used before new sheets
  offcuts: StockSheet[]

  // Photo extraction (transient)
  uploadedPhotoUrl: string | null
  extractionStatus: 'idle' | 'extracting' | 'done' | 'error'
  extractionResult: ExtractionResult | null
  extractionError: string | null

  // Results (transient)
  result: PackerResult | null

  // UI
  activeSheetIndex: number
  settingsOpen: boolean
  sawViewOpen: boolean

  // Piece actions
  addPiece: () => void
  updatePiece: (id: PieceId, updates: Partial<Piece>) => void
  removePiece: (id: PieceId) => void
  clearPieces: () => void
  importExtractedPieces: (pieces: ExtractedPiece[]) => void
  importSharedState: (shared: SharedState) => void

  // Photo actions
  setUploadedPhoto: (url: string | null) => void
  setExtractionStatus: (status: AppState['extractionStatus']) => void
  setExtractionResult: (result: ExtractionResult | null) => void
  setExtractionError: (error: string | null) => void

  // Offcut actions
  addOffcut: () => void
  updateOffcut: (id: string, updates: Partial<Omit<StockSheet, 'id'>>) => void
  removeOffcut: (id: string) => void

  // Settings actions
  setSheetWidth: (w: number) => void
  setSheetHeight: (h: number) => void
  setKerfWidth: (k: number) => void
  setOptimizationMode: (m: OptimizationMode) => void
  setGeminiApiKey: (key: string) => void
  setSheetPrice: (price: number) => void
  setSettingsOpen: (open: boolean) => void
  setSawViewOpen: (open: boolean) => void

  // Results actions
  runOptimizer: () => void
  setActiveSheetIndex: (i: number) => void
  clearResults: () => void
}

// Plyplan is a single-session app: state lives in sessionStorage so an
// accidental refresh mid-job doesn't lose the cut list, but a fresh visit
// starts blank. Clean up data older builds left in localStorage.
if (typeof window !== 'undefined') {
  localStorage.removeItem('cut-sheet-storage')
  localStorage.removeItem('plyplan-storage')
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      pieces: [],
      colorIndex: 0,
      sheetWidth: 96,
      sheetHeight: 48,
      kerfWidth: 0.125,
      optimizationMode: 'minimize-waste' as OptimizationMode,
      geminiApiKey: '',
      sheetPricePerUnit: 55,
      offcuts: [],
      uploadedPhotoUrl: null,
      extractionStatus: 'idle' as const,
      extractionResult: null,
      extractionError: null,
      result: null,
      activeSheetIndex: 0,
      settingsOpen: false,
      sawViewOpen: false,

      addPiece: () =>
        set((s) => {
          const color = PIECE_COLORS[s.colorIndex % PIECE_COLORS.length]
          return {
            pieces: [
              ...s.pieces,
              {
                id: generateId(),
                label: '',
                width: 0,
                height: 0,
                quantity: 1,
                color,
              },
            ],
            colorIndex: s.colorIndex + 1,
            result: null,
          }
        }),

      updatePiece: (id, updates) =>
        set((s) => ({
          pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...updates } : p)),
          result: null,
        })),

      removePiece: (id) =>
        set((s) => ({
          pieces: s.pieces.filter((p) => p.id !== id),
          result: null,
        })),

      clearPieces: () => set({ pieces: [], colorIndex: 0, result: null }),

      importExtractedPieces: (extracted) =>
        set((s) => {
          let idx = s.colorIndex
          const newPieces: Piece[] = extracted.map((ep) => {
            const color = PIECE_COLORS[idx % PIECE_COLORS.length]
            idx++
            return {
              id: generateId(),
              label: ep.label,
              width: ep.width,
              height: ep.height,
              quantity: ep.quantity,
              color,
            }
          })
          return {
            pieces: [...s.pieces, ...newPieces],
            colorIndex: idx,
            result: null,
          }
        }),

      // Replace the whole plan with one decoded from a share link. The
      // recipient's API key is untouched — links never carry credentials.
      importSharedState: (shared) =>
        set(() => ({
          pieces: shared.pieces.map((p, i) => ({
            id: generateId(),
            label: p.label,
            width: p.width,
            height: p.height,
            quantity: p.quantity,
            color: PIECE_COLORS[i % PIECE_COLORS.length],
          })),
          colorIndex: shared.pieces.length,
          offcuts: shared.offcuts.map((o) => ({ id: generateId(), ...o })),
          sheetWidth: shared.sheetWidth,
          sheetHeight: shared.sheetHeight,
          kerfWidth: shared.kerfWidth,
          optimizationMode: shared.optimizationMode,
          sheetPricePerUnit: shared.sheetPricePerUnit,
          result: null,
          activeSheetIndex: 0,
        })),

      addOffcut: () =>
        set((s) => ({
          offcuts: [...s.offcuts, { id: generateId(), width: 0, height: 0 }],
          result: null,
        })),

      updateOffcut: (id, updates) =>
        set((s) => ({
          offcuts: s.offcuts.map((o) => (o.id === id ? { ...o, ...updates } : o)),
          result: null,
        })),

      removeOffcut: (id) =>
        set((s) => ({
          offcuts: s.offcuts.filter((o) => o.id !== id),
          result: null,
        })),

      setUploadedPhoto: (url) => set({ uploadedPhotoUrl: url }),
      setExtractionStatus: (status) => set({ extractionStatus: status }),
      setExtractionResult: (result) => set({ extractionResult: result }),
      setExtractionError: (error) => set({ extractionError: error }),

      setSheetWidth: (w) => set({ sheetWidth: w, result: null }),
      setSheetHeight: (h) => set({ sheetHeight: h, result: null }),
      setKerfWidth: (k) => set({ kerfWidth: k, result: null }),
      setOptimizationMode: (m) => set({ optimizationMode: m, result: null }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setSheetPrice: (price) => set({ sheetPricePerUnit: price }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setSawViewOpen: (open) => set({ sawViewOpen: open }),

      runOptimizer: () => {
        const { pieces, sheetWidth, sheetHeight, kerfWidth, optimizationMode, offcuts } = get()
        const validPieces = pieces.filter((p) => p.width > 0 && p.height > 0 && p.quantity > 0)
        if (validPieces.length === 0) return
        const validOffcuts = offcuts.filter((o) => o.width > 0 && o.height > 0)
        const result = guillotinePack(validPieces, {
          sheetWidth,
          sheetHeight,
          kerfWidth,
          mode: optimizationMode,
          offcuts: validOffcuts,
        })
        set({ result, activeSheetIndex: 0 })
      },

      setActiveSheetIndex: (i) => set({ activeSheetIndex: i }),
      clearResults: () => set({ result: null }),
    }),
    {
      name: 'plyplan-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        pieces: state.pieces,
        colorIndex: state.colorIndex,
        sheetWidth: state.sheetWidth,
        sheetHeight: state.sheetHeight,
        kerfWidth: state.kerfWidth,
        offcuts: state.offcuts,
        optimizationMode: state.optimizationMode,
        geminiApiKey: state.geminiApiKey,
        sheetPricePerUnit: state.sheetPricePerUnit,
      }),
    }
  )
)
