import { describe, it, expect, vi, beforeEach } from 'vitest'
import { decodeAudioToFloat32 } from './decodeAudio'

beforeEach(() => {
  const fakeFloat32 = new Float32Array([0.1, 0.2, 0.3])
  const fakeRendered = { getChannelData: () => fakeFloat32 }
  const fakeSource = { connect: vi.fn(), start: vi.fn() }

  global.AudioContext = vi.fn(function () {
    return {
      decodeAudioData: vi.fn(() =>
        Promise.resolve({ duration: 5.0, numberOfChannels: 1 })
      ),
      close: vi.fn(() => Promise.resolve()),
    }
  })

  global.OfflineAudioContext = vi.fn(function () {
    return {
      createBufferSource: vi.fn(() => fakeSource),
      destination: {},
      startRendering: vi.fn(() => Promise.resolve(fakeRendered)),
    }
  })
})

describe('decodeAudioToFloat32', () => {
  it('returns a Float32Array and duration', async () => {
    const fakeBuffer = new ArrayBuffer(8)
    const result = await decodeAudioToFloat32(fakeBuffer)

    expect(result.float32).toBeInstanceOf(Float32Array)
    expect(result.duration).toBe(5.0)
    expect(result.sampleRate).toBe(16000)
  })

  it('creates OfflineAudioContext at 16 kHz mono', async () => {
    const fakeBuffer = new ArrayBuffer(8)
    await decodeAudioToFloat32(fakeBuffer)

    expect(global.OfflineAudioContext).toHaveBeenCalledWith(
      1,
      expect.any(Number),
      16000
    )
  })
})
