import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TranscriptViewer } from './TranscriptViewer'

const SEGMENTS = [
  { start: 0, end: 5, text: 'Hello everyone.' },
  { start: 5, end: 12.5, text: 'Welcome to the meeting.' },
]

describe('TranscriptViewer', () => {
  it('renders all segments with timestamps', () => {
    render(<TranscriptViewer segments={SEGMENTS} detectedLanguage="en" />)
    expect(screen.getByText('Hello everyone.')).toBeInTheDocument()
    expect(screen.getByText('Welcome to the meeting.')).toBeInTheDocument()
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('renders nothing when there are no segments', () => {
    const { container } = render(<TranscriptViewer segments={[]} detectedLanguage={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows detected language when provided', () => {
    render(<TranscriptViewer segments={SEGMENTS} detectedLanguage="es" />)
    expect(screen.getByText(/spanish/i)).toBeInTheDocument()
  })
})
