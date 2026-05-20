import { pipeline, env } from '@huggingface/transformers'

// Don't proxy WASM through a web worker (we ARE the worker)
env.backends.onnx.wasm.proxy = false

let transcriber = null

async function detectDevice() {
  try {
    if (navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter()
      if (adapter) return 'webgpu'
    }
  } catch {}
  return 'wasm'
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
  const { type, audio, language, translate, duration } = event.data

  if (type !== 'transcribe') return

  try {
    if (!transcriber) {
      const device = await detectDevice()
      self.postMessage({ type: 'device', device })
      await loadModel(device)
      self.postMessage({ type: 'model-progress', value: 100 })
    }

    const audioFloat32 = new Float32Array(audio)
    const totalChunks = duration ? Math.max(1, Math.ceil(duration / 25)) : null
    let chunksProcessed = 0

    const result = await transcriber(
      { array: audioFloat32, sampling_rate: 16000 },
      {
        language: language !== 'auto' ? language : null,
        task: translate ? 'translate' : 'transcribe',
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
        chunk_callback: (chunk) => {
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
          chunksProcessed++
          if (totalChunks) {
            self.postMessage({
              type: 'transcript-progress',
              value: Math.min(99, Math.round((chunksProcessed / totalChunks) * 100)),
            })
          }
        },
      }
    )

    // Try to extract detected language from result
    let detectedLanguage = null
    if (result?.chunks?.[0]?.language) {
      detectedLanguage = result.chunks[0].language
    }

    self.postMessage({ type: 'done', language: detectedLanguage })
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message ?? 'Unknown error' })
  }
})
