import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportBar } from './ExportBar'

const SEGMENTS = [
  { start: 0, end: 5, text: 'Hello world.' },
  { start: 5, end: 10, text: 'Second line.' },
]

describe('ExportBar', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:fake')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('renders copy, TXT, and SRT buttons', () => {
    render(<ExportBar segments={SEGMENTS} />)
    expect(screen.getByText(/copy/i)).toBeInTheDocument()
    expect(screen.getByText('TXT')).toBeInTheDocument()
    expect(screen.getByText('SRT')).toBeInTheDocument()
  })

  it('calls clipboard.writeText with plain text on copy', async () => {
    const user = userEvent.setup()
    // Mock clipboard after userEvent.setup() — it installs a getter-only stub via
    // Object.defineProperty, so we must also use defineProperty to override it.
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    })
    render(<ExportBar segments={SEGMENTS} />)
    await user.click(screen.getByText(/copy/i))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Hello world.\nSecond line.'
    )
  })
})
