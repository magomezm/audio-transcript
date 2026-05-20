import { pipeline, env } from '@huggingface/transformers'

// Don't proxy WASM through a web worker (we ARE the worker)
env.backends.onnx.wasm.proxy = false

let transcriber = null

async function detectDevice(gpuPreference) {
  if (gpuPreference === 'cpu') return { device: 'wasm', gpuName: null }
  try {
    if (navigator.gpu) {
      const opts = {}
      if (gpuPreference === 'high-performance') opts.powerPreference = 'high-performance'
      else if (gpuPreference === 'low-power') opts.powerPreference = 'low-power'
      const adapter = await navigator.gpu.requestAdapter(opts)
      if (adapter) {
        let gpuName = null
        try {
          // adapter.info is synchronous (Chrome/Edge 121+); fall back to async method
          const info = adapter.info ?? (await adapter.requestAdapterInfo?.())
          if (info) {
            const desc = info.description?.trim()
            if (desc) {
              gpuName = desc
            } else {
              const vendor = (info.vendor || '').toLowerCase()
              let v = 'GPU'
              if (vendor.includes('10de') || vendor === 'nvidia') v = 'NVIDIA'
              else if (vendor.includes('8086') || vendor === 'intel') v = 'Intel'
              else if (vendor.includes('1002') || vendor === 'amd') v = 'AMD'
              else if (vendor) v = vendor
              const device = info.device?.trim()
              gpuName = device ? `${v} (${device})` : v
            }
          }
        } catch {}
        return { device: 'webgpu', gpuName }
      }
    }
  } catch {}
  return { device: 'wasm', gpuName: null }
}

async function loadModel(device) {
  transcriber = await pipeline(
    'automatic-speech-recognition',
    'onnx-community/whisper-base',
    {
      dtype: {
        encoder_model: 'fp32',
        decoder_model_merged: 'q4',
      },
      device,
      progress_callback: (info) => {
        if (info.status === 'progress') {
          self.postMessage({
            type: 'model-progress',
            value: Math.round(info.progress ?? 0),
          })
        }
      },
    }
  )
}

self.addEventListener('message', async (event) => {
  const { type, audio, language, translate, gpuPreference = 'auto' } = event.data

  if (type !== 'transcribe') return

  try {
    if (!transcriber) {
      const { device, gpuName } = await detectDevice(gpuPreference)
      self.postMessage({ type: 'device', device, gpuName })
      await loadModel(device)
      self.postMessage({ type: 'model-progress', value: 100 })
    }

    self.postMessage({ type: 'transcribing-start' })

    const audioFloat32 = new Float32Array(audio)
    // v4 API: pass Float32Array directly (v3 used {array, sampling_rate} object)
    const result = await transcriber(audioFloat32, {
      language: language !== 'auto' ? language : null,
      task: translate ? 'translate' : 'transcribe',
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    })

    // v4 returns all chunks after processing; emit each as a segment
    const chunks = result?.chunks ?? []
    chunks.forEach((chunk, i) => {
      if (chunk.text?.trim()) {
        self.postMessage({
          type: 'segment',
          data: {
            start: chunk.timestamp?.[0] ?? 0,
            end: chunk.timestamp?.[1] ?? 0,
            text: chunk.text.trim(),
          },
        })
      }
      self.postMessage({
        type: 'transcript-progress',
        value: Math.min(99, Math.round(((i + 1) / Math.max(chunks.length, 1)) * 100)),
      })
    })

    const detectedLanguage = chunks[0]?.language ?? null
    self.postMessage({ type: 'done', language: detectedLanguage })
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message ?? 'Unknown error' })
  }
})
