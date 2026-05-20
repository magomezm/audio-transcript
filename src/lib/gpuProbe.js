/**
 * Build a human-readable GPU name from a GPUAdapterInfo object.
 * Handles both new (adapter.info, Chrome/Edge 121+) and old (requestAdapterInfo) shapes.
 */
function buildGpuName(info) {
  if (!info) return null
  // Chrome 121+ populates description with the full GPU name
  const desc = info.description?.trim()
  if (desc) return desc
  // Fall back to vendor + device identifiers
  const vendor = (info.vendor || '').toLowerCase()
  let vendorName = 'GPU'
  if (vendor.includes('10de') || vendor === 'nvidia') vendorName = 'NVIDIA'
  else if (vendor.includes('8086') || vendor === 'intel') vendorName = 'Intel'
  else if (vendor.includes('1002') || vendor === 'amd') vendorName = 'AMD'
  else if (vendor) vendorName = vendor
  const device = info.device?.trim()
  return device ? `${vendorName} (${device})` : vendorName
}

async function getAdapterName(opts) {
  try {
    const adapter = await navigator.gpu.requestAdapter(opts)
    if (!adapter) return null
    // Try adapter.info (Chrome/Edge 121+ — synchronous property)
    // Fall back to requestAdapterInfo() for older browsers
    const info = adapter.info ?? (await adapter.requestAdapterInfo?.())
    return buildGpuName(info)
  } catch {
    return null
  }
}

/**
 * Probe WebGPU adapters at startup to get real GPU names for each preference level.
 * Returns null if WebGPU is not available.
 */
export async function probeGpuAdapters() {
  if (typeof navigator === 'undefined' || !navigator.gpu) return null

  const [highPerformance, lowPower] = await Promise.all([
    getAdapterName({ powerPreference: 'high-performance' }),
    getAdapterName({ powerPreference: 'low-power' }),
  ])

  return { highPerformance, lowPower }
}
