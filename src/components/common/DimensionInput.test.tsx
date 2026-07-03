import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { DimensionInput } from './DimensionInput'

const setup = (value = 24) => {
  const onCommit = vi.fn()
  render(<DimensionInput value={value} onCommit={onCommit} placeholder="W" />)
  const input = screen.getByPlaceholderText('W') as HTMLInputElement
  return { input, onCommit }
}

describe('DimensionInput', () => {
  beforeEach(cleanup)

  it('shows the formatted committed value', () => {
    const { input } = setup(20.75)
    expect(input.value).toBe('20-3/4"')
  })

  it('renders empty for a zero value', () => {
    const { input } = setup(0)
    expect(input.value).toBe('')
  })

  it('lets the field be cleared completely while editing', () => {
    // Regression: the old Settings inputs snapped back on every keystroke
    // that did not parse, so the last digit could never be deleted.
    const { input } = setup(24)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
    fireEvent.change(input, { target: { value: '71' } })
    expect(input.value).toBe('71')
  })

  it('commits the parsed value on blur', () => {
    const { input, onCommit } = setup(24)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '71' } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith(71)
    expect(input.value).toBe('24"') // display reverts to prop until parent re-renders
  })

  it('commits fraction formats', () => {
    const { input, onCommit } = setup(24)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '20-3/4' } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith(20.75)
  })

  it('commits on Enter', () => {
    const { input, onCommit } = setup(24)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '38' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onCommit).toHaveBeenCalledWith(38)
  })

  it('reverts to the last committed value when blurred empty', () => {
    const { input, onCommit } = setup(24)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)
    expect(onCommit).not.toHaveBeenCalled()
    expect(input.value).toBe('24"')
  })

  it('ignores unparseable garbage instead of committing it', () => {
    const { input, onCommit } = setup(24)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.blur(input)
    expect(onCommit).not.toHaveBeenCalled()
    expect(input.value).toBe('24"')
  })
})
