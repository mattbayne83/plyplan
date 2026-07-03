import { useAppStore } from '../../store/useAppStore'
import { DimensionInput } from '../common/DimensionInput'
import { X, Plus } from 'lucide-react'
import type { OptimizationMode } from '../../types/plyplan'

const SHEET_PRESETS = [
  { label: '4×8 ft', width: 96, height: 48 },
  { label: '4×10 ft', width: 120, height: 48 },
  { label: '5×5 ft', width: 60, height: 60 },
  { label: '4×4 ft', width: 48, height: 48 },
]

const KERF_PRESETS = [
  { label: '1/8"', value: 0.125 },
  { label: '3/32"', value: 0.09375 },
  { label: '1/16"', value: 0.0625 },
]

const MODES: Array<{ value: OptimizationMode; label: string; desc: string }> = [
  { value: 'minimize-waste', label: 'Less waste', desc: 'Best material usage' },
  { value: 'minimize-saw-changes', label: 'Fewer cuts', desc: 'Fewer fence changes' },
]

export function SettingsPanel() {
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const sheetWidth = useAppStore((s) => s.sheetWidth)
  const sheetHeight = useAppStore((s) => s.sheetHeight)
  const kerfWidth = useAppStore((s) => s.kerfWidth)
  const optimizationMode = useAppStore((s) => s.optimizationMode)
  const setOptimizationMode = useAppStore((s) => s.setOptimizationMode)
  const setSheetWidth = useAppStore((s) => s.setSheetWidth)
  const setSheetHeight = useAppStore((s) => s.setSheetHeight)
  const setKerfWidth = useAppStore((s) => s.setKerfWidth)
  const offcuts = useAppStore((s) => s.offcuts)
  const addOffcut = useAppStore((s) => s.addOffcut)
  const updateOffcut = useAppStore((s) => s.updateOffcut)
  const removeOffcut = useAppStore((s) => s.removeOffcut)

  if (!settingsOpen) return null

  const matchedPreset = SHEET_PRESETS.find(
    (p) => p.width === sheetWidth && p.height === sheetHeight
  )

  const chipClass = (active: boolean) =>
    `px-4 py-2.5 text-[13px] font-medium rounded-[var(--radius-button)] border transition-colors ${
      active
        ? 'bg-primary-light border-primary/30 text-primary'
        : 'border-border text-text-secondary hover:border-border-strong hover:text-text'
    }`

  return (
    <div className="bg-surface rounded-[var(--radius-card)] border border-border overflow-hidden">
      {/* Header with close */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide">Settings</h2>
        <button
          onClick={() => setSettingsOpen(false)}
          className="p-2 rounded-[var(--radius-input)] text-text-muted hover:bg-surface-raised hover:text-text-secondary transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Sheet Size */}
        <div>
          <label className="block text-[13px] font-medium text-text-secondary mb-2">Sheet Size</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SHEET_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setSheetWidth(preset.width)
                  setSheetHeight(preset.height)
                }}
                className={chipClass(matchedPreset === preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-text-muted">
            <DimensionInput
              value={sheetWidth}
              onCommit={setSheetWidth}
              placeholder="W"
              className="w-20 border border-border rounded-[var(--radius-input)] px-3 py-2.5 text-center text-text bg-surface-raised text-[15px] outline-none focus:ring-1 focus:ring-primary/30"
            />
            <span>×</span>
            <DimensionInput
              value={sheetHeight}
              onCommit={setSheetHeight}
              placeholder="H"
              className="w-20 border border-border rounded-[var(--radius-input)] px-3 py-2.5 text-center text-text bg-surface-raised text-[15px] outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Offcuts on hand */}
        <div>
          <label className="block text-[13px] font-medium text-text-secondary mb-1">Offcuts On Hand</label>
          <p className="text-[12px] text-text-muted mb-2">
            Leftover stock in your shop — pieces get cut from these before new sheets.
          </p>
          {offcuts.length > 0 && (
            <div className="space-y-2 mb-2">
              {offcuts.map((offcut, i) => (
                <div key={offcut.id} className="flex items-center gap-2 text-[13px] text-text-muted">
                  <DimensionInput
                    value={offcut.width}
                    onCommit={(v) => updateOffcut(offcut.id, { width: v })}
                    placeholder="W"
                    className="w-20 border border-border rounded-[var(--radius-input)] px-3 py-2.5 text-center text-text bg-surface-raised text-[15px] outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <span>×</span>
                  <DimensionInput
                    value={offcut.height}
                    onCommit={(v) => updateOffcut(offcut.id, { height: v })}
                    placeholder="H"
                    className="w-20 border border-border rounded-[var(--radius-input)] px-3 py-2.5 text-center text-text bg-surface-raised text-[15px] outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => removeOffcut(offcut.id)}
                    aria-label={`Remove offcut ${i + 1}`}
                    className="p-2.5 rounded-[var(--radius-input)] text-text-muted hover:bg-error-light hover:text-error transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={addOffcut}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium rounded-[var(--radius-button)] border border-dashed border-border text-text-secondary hover:border-border-strong hover:text-text transition-colors"
          >
            <Plus size={14} />
            Add offcut
          </button>
        </div>

        {/* Kerf Width */}
        <div>
          <label className="block text-[13px] font-medium text-text-secondary mb-2">Kerf Width</label>
          <div className="flex flex-wrap gap-2">
            {KERF_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setKerfWidth(preset.value)}
                className={chipClass(kerfWidth === preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optimization Mode */}
        <div>
          <label className="block text-[13px] font-medium text-text-secondary mb-2">Priority</label>
          <div className="flex flex-wrap gap-2">
            {MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setOptimizationMode(mode.value)}
                className={chipClass(optimizationMode === mode.value)}
                title={mode.desc}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
