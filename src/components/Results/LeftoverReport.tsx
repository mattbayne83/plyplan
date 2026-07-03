import { useMemo } from 'react'
import { Recycle } from 'lucide-react'
import type { PackerResult } from '../../types/plyplan'
import { useAppStore } from '../../store/useAppStore'
import { computeLeftovers } from '../../utils/leftovers'
import { formatDimension } from '../../utils/units'
import { getSheetLabel } from '../../utils/labels'

interface LeftoverReportProps {
  result: PackerResult
}

/**
 * "What you'll have left" — usable offcuts this job produces. In a
 * single-session app this is the bridge between visits: jot them down (or
 * export the plan) and enter them as Offcuts On Hand next time.
 */
export function LeftoverReport({ result }: LeftoverReportProps) {
  const kerfWidth = useAppStore((s) => s.kerfWidth)

  const rows = useMemo(
    () =>
      result.sheets
        .map((sheet, i) => ({
          label: getSheetLabel(result.sheets, i),
          leftovers: computeLeftovers(sheet, kerfWidth).sort(
            (a, b) => b.width * b.height - a.width * a.height
          ),
        }))
        .filter((row) => row.leftovers.length > 0),
    [result, kerfWidth]
  )

  if (rows.length === 0) return null

  return (
    <div className="bg-success-light/60 rounded-[var(--radius-input)] border border-success/20 p-3">
      <div className="flex items-start gap-2">
        <Recycle size={16} className="text-success flex-shrink-0 mt-0.5" />
        <div className="text-[13px] min-w-0">
          <p className="font-medium text-text mb-1">Leftovers worth keeping</p>
          <div className="space-y-0.5 text-text-secondary">
            {rows.map((row) => (
              <p key={row.label}>
                <span className="text-text-muted">{row.label}:</span>{' '}
                {row.leftovers
                  .map((r) => `${formatDimension(r.width)} × ${formatDimension(r.height)}`)
                  .join(', ')}
              </p>
            ))}
          </div>
          <p className="text-text-muted mt-1.5">
            Next project, enter these under Offcuts On Hand in Settings.
          </p>
        </div>
      </div>
    </div>
  )
}
