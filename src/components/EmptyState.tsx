import { Plus } from 'lucide-react'

interface EmptyStateProps {
  onManual: () => void
}

export function EmptyState({ onManual }: EmptyStateProps) {
  return (
    <div className="bg-surface rounded-[var(--radius-card)] border border-border p-6 text-center space-y-5">
      {/* Simple plywood illustration */}
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="mx-auto text-border-strong">
        <rect x="4" y="4" width="72" height="52" rx="3" stroke="currentColor" strokeWidth="2" />
        <line x1="28" y1="4" x2="28" y2="56" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" />
        <line x1="52" y1="4" x2="52" y2="56" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" />
        <line x1="4" y1="28" x2="76" y2="28" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" />
      </svg>

      <div>
        <h2 className="text-[18px] font-semibold text-text mb-1">What are you building?</h2>
        <p className="text-[13px] text-text-muted">
          Add your pieces and we'll figure out how many sheets you need.
        </p>
      </div>

      <div>
        <button
          onClick={onManual}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white text-[15px] font-medium rounded-[var(--radius-button)] py-3 px-4 hover:bg-primary-hover transition-colors"
        >
          <Plus size={20} />
          Add Pieces
        </button>
      </div>
    </div>
  )
}
