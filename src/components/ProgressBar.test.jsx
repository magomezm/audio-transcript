import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('shows model loading phase with correct percentage', () => {
    render(<ProgressBar status="loading-model" modelProgress={45} />)
    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText(/loading model/i)).toBeInTheDocument()
  })

  it('shows animated bar when transcribing (no percentage)', () => {
    render(<ProgressBar status="transcribing" modelProgress={100} />)
    expect(screen.getByText(/transcribing/i)).toBeInTheDocument()
    expect(screen.getByTestId('transcribing-bar')).toBeInTheDocument()
    expect(screen.queryByText(/%/)).toBeNull()
  })

  it('renders nothing when status is idle', () => {
    const { container } = render(<ProgressBar status="idle" modelProgress={0} />)
    expect(container.firstChild).toBeNull()
  })
})
