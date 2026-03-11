import { Settings } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export function Header() {
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)

  return (
    <header className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-primary">
          <rect x="2" y="2" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2" />
          <line x1="10" y1="2" x2="10" y2="26" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="2" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
        <h1 className="text-[18px] font-semibold text-text">plyplan</h1>
      </div>
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className={`p-3 rounded-[var(--radius-button)] transition-colors ${
          settingsOpen
            ? 'bg-primary-light text-primary'
            : 'text-text-muted hover:bg-surface-raised hover:text-text-secondary'
        }`}
        title="Settings"
      >
        <Settings size={20} />
      </button>
    </header>
  )
}
