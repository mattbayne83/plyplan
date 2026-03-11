import { useAppStore } from '../../store/useAppStore'
import { parseDimension, formatDimension } from '../../utils/units'
import { X } from 'lucide-react'
import type { OptimizationMode } from '../../types/cutSheet'

const SHEET_PRESETS = [
  { label: '4×8 ft', width: 96, height: 48 },
  { label: '5×5 ft', width: 60, height: 60 },
  { label: '4×4 ft', width: 48, height: 48 },
  { label: '2×4 ft', width: 48, height: 24 },
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
  const unitSystem = useAppStore((s) => s.unitSystem)
  const optimizationMode = useAppStore((s) => s.optimizationMode)
  const setOptimizationMode = useAppStore((s) => s.setOptimizationMode)
  const sheetPrice = useAppStore((s) => s.sheetPricePerUnit)
  const setSheetWidth = useAppStore((s) => s.setSheetWidth)
  const setSheetHeight = useAppStore((s) => s.setSheetHeight)
  const setKerfWidth = useAppStore((s) => s.setKerfWidth)
  const setUnitSystem = useAppStore((s) => s.setUnitSystem)
  const setSheetPrice = useAppStore((s) => s.setSheetPrice)

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
            <input
              type="text"
              value={formatDimension(sheetWidth, unitSystem)}
              onChange={(e) => {
                const v = parseDimension(e.target.value.replace(/["']/g, ''))
                if (v !== null) setSheetWidth(v)
              }}
              className="w-20 border border-border rounded-[var(--radius-input)] px-3 py-2.5 text-center text-text bg-surface-raised text-[15px] outline-none focus:ring-1 focus:ring-primary/30"
            />
            <span>×</span>
            <input
              type="text"
              value={formatDimension(sheetHeight, unitSystem)}
              onChange={(e) => {
                const v = parseDimension(e.target.value.replace(/["']/g, ''))
                if (v !== null) setSheetHeight(v)
              }}
              className="w-20 border border-border rounded-[var(--radius-input)] px-3 py-2.5 text-center text-text bg-surface-raised text-[15px] outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
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

        {/* Units */}
        <div>
          <label className="block text-[13px] font-medium text-text-secondary mb-2">Units</label>
          <div className="flex gap-2">
            {(['inches', 'mm'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnitSystem(u)}
                className={chipClass(unitSystem === u)}
              >
                {u === 'inches' ? 'Inches' : 'Millimeters'}
              </button>
            ))}
          </div>
        </div>

        {/* Price per sheet */}
        <div>
          <label className="block text-[13px] font-medium text-text-secondary mb-2">Price per sheet</label>
          <div className="flex items-center gap-1">
            <span className="text-text-secondary text-[15px]">$</span>
            <input
              type="number"
              min={0}
              value={sheetPrice}
              onChange={(e) => setSheetPrice(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-20 border border-border rounded-[var(--radius-input)] px-3 py-2.5 text-center text-text bg-surface-raised text-[15px] outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
