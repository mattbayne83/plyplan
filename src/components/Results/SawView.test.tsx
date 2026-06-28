import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { SawView } from './SawView'
import { useAppStore } from '../../store/useAppStore'
import type { Piece } from '../../types/plyplan'

const piece: Piece = { id: 'p1', label: 'A', width: 24, height: 24, quantity: 2, color: '#C2410C' }

const openViewer = () => {
  useAppStore.setState({ pieces: [piece], result: null, activeSheetIndex: 0 })
  useAppStore.getState().runOptimizer()
  useAppStore.setState({ sawViewOpen: true })
}

describe('SawView', () => {
  beforeEach(() => {
    cleanup()
    useAppStore.setState({ sawViewOpen: false })
  })

  it('renders nothing while closed', () => {
    useAppStore.setState({ sawViewOpen: false, result: null })
    const { container } = render(<SawView />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the diagram and the zoom hint when open, with no Reset control yet', () => {
    openViewer()
    render(<SawView />)
    expect(document.querySelector('svg')).toBeInTheDocument()
    expect(screen.getAllByText(/to zoom/i).length).toBeGreaterThan(0)
    // Not zoomed yet, so the Reset control is absent.
    expect(screen.queryByRole('button', { name: /reset zoom/i })).not.toBeInTheDocument()
  })

  it('closes when the X is pressed', () => {
    openViewer()
    render(<SawView />)
    fireEvent.click(screen.getByRole('button', { name: /close full-screen view/i }))
    expect(useAppStore.getState().sawViewOpen).toBe(false)
  })
})
