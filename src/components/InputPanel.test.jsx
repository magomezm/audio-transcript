import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputPanel } from './InputPanel'

describe('InputPanel', () => {
  it('renders drop zone and URL input', () => {
    render(<InputPanel onSource={vi.fn()} disabled={false} />)
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/https:\/\//i)).toBeInTheDocument()
  })

  it('calls onSource with File when file is dropped', () => {
    const onSource = vi.fn()
    render(<InputPanel onSource={onSource} disabled={false} />)
    const dropZone = screen.getByTestId('drop-zone')
    const file = new File(['audio data'], 'test.mp3', { type: 'audio/mp3' })

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file], types: ['Files'] },
    })

    expect(onSource).toHaveBeenCalledWith(file)
  })

  it('calls onSource with URL string when URL is submitted', async () => {
    const user = userEvent.setup()
    const onSource = vi.fn()
    render(<InputPanel onSource={onSource} disabled={false} />)

    const input = screen.getByPlaceholderText(/https:\/\//i)
    await user.type(input, 'https://example.com/audio.mp3')
    await user.keyboard('{Enter}')

    expect(onSource).toHaveBeenCalledWith('https://example.com/audio.mp3')
  })

  it('shows size warning for files over 2 GB', () => {
    const onSource = vi.fn()
    render(<InputPanel onSource={onSource} disabled={false} />)
    const dropZone = screen.getByTestId('drop-zone')
    const bigFile = new File(['x'], 'huge.mp4', { type: 'video/mp4' })
    Object.defineProperty(bigFile, 'size', { value: 2.1 * 1024 ** 3 })

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [bigFile], types: ['Files'] },
    })

    expect(screen.getByText(/large file/i)).toBeInTheDocument()
  })

  it('disables interaction when disabled=true', () => {
    render(<InputPanel onSource={vi.fn()} disabled={true} />)
    expect(screen.getByPlaceholderText(/https:\/\//i)).toBeDisabled()
  })
})
