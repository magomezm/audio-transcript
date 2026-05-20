import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('shows model loading phase with correct percentage', () => {
    render(<ProgressBar status="loading-model" modelProgress={45} transcriptProgress={0} />)
    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText(/loading model/i)).toBeInTheDocument()
  })

  it('shows transcription phase with correct percentage', () => {
    render(<ProgressBar status="transcribing" modelProgress={100} transcriptProgress={62} />)
    expect(screen.getByText('62%')).toBeInTheDocument()
    expect(screen.getByText(/transcribing/i)).toBeInTheDocument()
  })

  it('renders nothing when status is idle', () => {
    const { container } = render(<ProgressBar status="idle" modelProgress={0} transcriptProgress={0} />)
    expect(container.firstChild).toBeNull()
  })
})
