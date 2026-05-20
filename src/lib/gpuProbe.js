/**
 * Probe WebGPU adapters at startup to get real GPU names for each preference level.
 * Returns null if WebGPU is not available.
 */
export async function probeGpuAdapters() {
  if (typeof navigator === 'undefined' || !navigator.gpu) return null

  const getName = async (opts) => {
    try {
      const adapter = await navigator.gpu.requestAdapter(opts)
      if (!adapter) return null
      const info = await adapter.requestAdapterInfo()
      return info.description || info.device || null
    } catch {
      return null
    }
  }

  const [highPerformance, lowPower] = await Promise.all([
    getName({ powerPreference: 'high-performance' }),
    getName({ powerPreference: 'low-power' }),
  ])

  return { highPerformance, lowPower }
}
