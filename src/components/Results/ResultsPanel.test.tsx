import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ResultsPanel } from './ResultsPanel'
import { useAppStore } from '../../store/useAppStore'
import type { Piece } from '../../types/plyplan'

const piece: Piece = { id: 'p1', label: 'A', width: 24, height: 24, quantity: 2, color: '#C2410C' }

const seedWithResult = () => {
  useAppStore.setState({ pieces: [piece], result: null, sawViewOpen: false, activeSheetIndex: 0 })
  useAppStore.getState().runOptimizer()
}

describe('ResultsPanel — tap to zoom', () => {
  beforeEach(() => {
    cleanup()
    seedWithResult()
  })

  it('renders a Tap to zoom affordance over the diagram', () => {
    render(<ResultsPanel />)
    expect(screen.getByText(/tap to zoom/i)).toBeInTheDocument()
  })

  it('opens the full-screen viewer when the diagram is tapped', () => {
    render(<ResultsPanel />)
    expect(useAppStore.getState().sawViewOpen).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: /open full-screen zoomable view/i }))
    expect(useAppStore.getState().sawViewOpen).toBe(true)
  })

  it('opens the viewer via keyboard (Enter) for accessibility', () => {
    render(<ResultsPanel />)
    fireEvent.keyDown(screen.getByRole('button', { name: /open full-screen zoomable view/i }), { key: 'Enter' })
    expect(useAppStore.getState().sawViewOpen).toBe(true)
  })
})
