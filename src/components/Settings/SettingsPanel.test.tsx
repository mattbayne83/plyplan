import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { SettingsPanel } from './SettingsPanel'
import { useAppStore } from '../../store/useAppStore'

const openSettings = () => {
  useAppStore.setState({
    settingsOpen: true,
    sheetWidth: 96,
    sheetHeight: 48,
    offcuts: [],
    result: null,
  })
}

describe('SettingsPanel — custom sheet size', () => {
  beforeEach(() => {
    cleanup()
    openSettings()
  })

  it('lets the sheet width be cleared and retyped (buddy-feedback regression)', () => {
    render(<SettingsPanel />)
    const width = screen.getByDisplayValue('96"') as HTMLInputElement

    fireEvent.focus(width)
    fireEvent.change(width, { target: { value: '' } })
    // The old controlled input snapped straight back to 96" here.
    expect(width.value).toBe('')

    fireEvent.change(width, { target: { value: '71' } })
    fireEvent.blur(width)
    expect(useAppStore.getState().sheetWidth).toBe(71)
  })

  it('reverts to the previous size when a field is left empty', () => {
    render(<SettingsPanel />)
    const height = screen.getByDisplayValue('48"') as HTMLInputElement

    fireEvent.focus(height)
    fireEvent.change(height, { target: { value: '' } })
    fireEvent.blur(height)

    expect(useAppStore.getState().sheetHeight).toBe(48)
    expect(height.value).toBe('48"')
  })
})

describe('SettingsPanel — offcuts on hand', () => {
  beforeEach(() => {
    cleanup()
    openSettings()
  })

  it('adds an offcut and stores its dimensions', () => {
    render(<SettingsPanel />)
    fireEvent.click(screen.getByRole('button', { name: /add offcut/i }))

    const offcuts = useAppStore.getState().offcuts
    expect(offcuts).toHaveLength(1)

    const [wInput] = screen.getAllByPlaceholderText('W').slice(-1)
    fireEvent.focus(wInput)
    fireEvent.change(wInput, { target: { value: '24' } })
    fireEvent.blur(wInput)

    const [hInput] = screen.getAllByPlaceholderText('H').slice(-1)
    fireEvent.focus(hInput)
    fireEvent.change(hInput, { target: { value: '48' } })
    fireEvent.blur(hInput)

    expect(useAppStore.getState().offcuts[0]).toMatchObject({ width: 24, height: 48 })
  })

  it('removes an offcut', () => {
    useAppStore.setState({ offcuts: [{ id: 'o1', width: 24, height: 24 }] })
    render(<SettingsPanel />)
    fireEvent.click(screen.getByRole('button', { name: /remove offcut 1/i }))
    expect(useAppStore.getState().offcuts).toHaveLength(0)
  })
})
