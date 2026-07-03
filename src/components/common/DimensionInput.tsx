import { useState } from 'react'
import { parseDimension, formatDimension } from '../../utils/units'

interface DimensionInputProps {
  /** Current committed value in inches. 0 renders as an empty field. */
  value: number
  /** Called with the parsed value on blur or Enter. Never called for empty/unparseable input. */
  onCommit: (value: number) => void
  placeholder?: string
  className?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void
}

/**
 * Text input for a dimension in inches ("24", "3.5", "20-3/4").
 *
 * Keeps a local draft while focused so the field can be fully cleared and
 * retyped; the store only updates on blur/Enter. An empty or unparseable
 * draft reverts to the last committed value instead of blocking deletion.
 */
export function DimensionInput({ value, onCommit, placeholder, className, onKeyDown, onClick }: DimensionInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const formatted = value > 0 ? formatDimension(value) : ''
  const display = draft ?? formatted

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    // For plain decimal input, cap at 3 decimal places
    if (next.includes('.') && !next.includes('/')) {
      const [, decimal] = next.split('.')
      if (decimal && decimal.length > 3) return
    }
    setDraft(next)
  }

  const commit = () => {
    if (draft === null) return
    const parsed = parseDimension(draft.replace(/["']/g, ''))
    if (parsed !== null) {
      onCommit(Math.round(parsed * 1000) / 1000)
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      placeholder={placeholder}
      onFocus={() => setDraft(formatted)}
      onChange={handleChange}
      onBlur={() => {
        commit()
        setDraft(null)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        onKeyDown?.(e)
      }}
      onClick={onClick}
      className={className}
    />
  )
}
