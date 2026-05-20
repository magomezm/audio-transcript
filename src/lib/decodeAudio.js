const TARGET_SR = 16000

export async function decodeAudioToFloat32(arrayBuffer) {
  let audioCtx
  try {
    audioCtx = new AudioContext()
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
    await audioCtx.close()

    const offlineCtx = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * TARGET_SR),
      TARGET_SR
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = decoded
    source.connect(offlineCtx.destination)
    source.start(0)

    const rendered = await offlineCtx.startRendering()
    return {
      float32: rendered.getChannelData(0),
      duration: decoded.duration,
      sampleRate: TARGET_SR,
    }
  } catch (err) {
    if (audioCtx) audioCtx.close().catch(() => {})
    throw new Error(`Could not decode audio: ${err.message}`)
  }
}
