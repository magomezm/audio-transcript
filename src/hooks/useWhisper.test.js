import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWhisper } from './useWhisper'

// Capture the message handler so tests can simulate worker messages
let messageHandler = null
const mockWorkerInstance = {
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(function(event, handler) {
    if (event === 'message') messageHandler = handler
  }),
  removeEventListener: vi.fn(),
}

vi.mock('../workers/whisper.worker.js?worker', () => ({
  default: vi.fn(function() { return mockWorkerInstance }),
}))

// decodeAudioToFloat32 returns a fake buffer
vi.mock('../lib/decodeAudio', () => ({
  decodeAudioToFloat32: vi.fn(() =>
    Promise.resolve({
      float32: new Float32Array([0.1, 0.2]),
      duration: 10,
      sampleRate: 16000,
    })
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
  messageHandler = null
})

describe('useWhisper — initial state', () => {
  it('starts in idle status with empty segments', () => {
    const { result } = renderHook(() => useWhisper())
    expect(result.current.status).toBe('idle')
    expect(result.current.segments).toEqual([])
    expect(result.current.modelProgress).toBe(0)
    expect(result.current.transcriptProgress).toBe(0)
    expect(result.current.detectedLanguage).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('exposes setSourceLanguage, setTranslateToEnglish, and setGpuPreference', () => {
    const { result } = renderHook(() => useWhisper())
    expect(typeof result.current.setSourceLanguage).toBe('function')
    expect(typeof result.current.setTranslateToEnglish).toBe('function')
    expect(typeof result.current.setGpuPreference).toBe('function')
  })
})

describe('useWhisper — language state', () => {
  it('setSourceLanguage updates sourceLanguage', () => {
    const { result } = renderHook(() => useWhisper())
    act(() => result.current.setSourceLanguage('es'))
    expect(result.current.sourceLanguage).toBe('es')
  })

  it('setTranslateToEnglish updates translateToEnglish', () => {
    const { result } = renderHook(() => useWhisper())
    act(() => result.current.setTranslateToEnglish(true))
    expect(result.current.translateToEnglish).toBe(true)
  })
})

describe('useWhisper — GPU preference', () => {
  it('setGpuPreference updates gpuPreference', () => {
    const { result } = renderHook(() => useWhisper())
    act(() => result.current.setGpuPreference('high-performance'))
    expect(result.current.gpuPreference).toBe('high-performance')
  })
})

describe('useWhisper — worker message handling', () => {
  it('transcribing-start message sets status to transcribing', async () => {
    const { result } = renderHook(() => useWhisper())
    const fakeFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' })
    act(() => { result.current.start(fakeFile) })

    await vi.waitFor(() => messageHandler !== null)

    act(() => {
      messageHandler({ data: { type: 'transcribing-start' } })
    })
    expect(result.current.status).toBe('transcribing')
  })

  it('model-progress message updates modelProgress', async () => {
    const { result } = renderHook(() => useWhisper())
    const fakeFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' })
    act(() => { result.current.start(fakeFile) })

    await vi.waitFor(() => messageHandler !== null)

    act(() => {
      messageHandler({ data: { type: 'model-progress', value: 60 } })
    })
    expect(result.current.modelProgress).toBe(60)
    expect(result.current.status).toBe('loading-model')
  })

  it('segment message appends to segments', async () => {
    const { result } = renderHook(() => useWhisper())
    const fakeFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' })
    act(() => { result.current.start(fakeFile) })

    await vi.waitFor(() => messageHandler !== null)

    act(() => {
      messageHandler({ data: { type: 'segment', data: { start: 0, end: 5, text: 'Hello world.' } } })
    })
    expect(result.current.segments).toHaveLength(1)
    expect(result.current.segments[0].text).toBe('Hello world.')
    expect(result.current.status).toBe('transcribing')
  })

  it('done message sets status to done with detectedLanguage', async () => {
    const { result } = renderHook(() => useWhisper())
    const fakeFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' })
    act(() => { result.current.start(fakeFile) })

    await vi.waitFor(() => messageHandler !== null)

    act(() => {
      messageHandler({ data: { type: 'done', language: 'es' } })
    })
    expect(result.current.status).toBe('done')
    expect(result.current.detectedLanguage).toBe('es')
    expect(result.current.transcriptProgress).toBe(100)
  })

  it('error message sets status to error', async () => {
    const { result } = renderHook(() => useWhisper())
    const fakeFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' })
    act(() => { result.current.start(fakeFile) })

    await vi.waitFor(() => messageHandler !== null)

    act(() => {
      messageHandler({ data: { type: 'error', message: 'GPU crash' } })
    })
    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('GPU crash')
  })
})

describe('useWhisper — reset', () => {
  it('reset returns state to idle and terminates worker', async () => {
    const { result } = renderHook(() => useWhisper())
    const fakeFile = new File(['audio'], 'test.mp3', { type: 'audio/mp3' })
    act(() => { result.current.start(fakeFile) })

    await vi.waitFor(() => messageHandler !== null)

    act(() => { result.current.reset() })

    expect(result.current.status).toBe('idle')
    expect(result.current.segments).toEqual([])
    expect(mockWorkerInstance.terminate).toHaveBeenCalled()
  })
})
