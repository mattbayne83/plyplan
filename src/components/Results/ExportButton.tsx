import { Download } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useCallback, useState } from 'react'

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLDivElement | null>
  sheetIndex: number
}

export function ExportButton({ targetRef, sheetIndex }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (!targetRef.current) return
    setExporting(true)
    try {
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        fontEmbedCSS: '',
      })
      const link = document.createElement('a')
      link.download = `cut-sheet-${sheetIndex + 1}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [targetRef, sheetIndex])

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="p-2.5 rounded-[var(--radius-input)] text-text-muted hover:bg-surface-raised hover:text-text-secondary transition-colors disabled:opacity-50"
      title="Export PNG"
    >
      <Download size={16} />
    </button>
  )
}
