import { useReducer, useRef, useCallback } from 'react'
import { decodeAudioToFloat32 } from '../lib/decodeAudio'
import WhisperWorker from '../workers/whisper.worker.js?worker'

const INITIAL_STATE = {
  status: 'idle',
  modelProgress: 0,
  transcriptProgress: 0,
  segments: [],
  detectedLanguage: null,
  device: null,
  gpuName: null,
  sourceLanguage: 'auto',
  translateToEnglish: false,
  gpuPreference: 'high-performance',
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...INITIAL_STATE,
        status: 'loading-model',
        sourceLanguage: state.sourceLanguage,
        translateToEnglish: state.translateToEnglish,
        device: state.device,
        gpuPreference: state.gpuPreference,
      }
    case 'MODEL_PROGRESS':
      return { ...state, status: 'loading-model', modelProgress: action.value }
    case 'TRANSCRIBING_START':
      return { ...state, status: 'transcribing' }
    case 'TRANSCRIPT_PROGRESS':
      return { ...state, transcriptProgress: action.value }
    case 'SEGMENT':
      return { ...state, status: 'transcribing', segments: [...state.segments, action.data] }
    case 'DONE':
      return { ...state, status: 'done', detectedLanguage: action.language, transcriptProgress: 100 }
    case 'ERROR':
      return { ...state, status: 'error', error: action.message }
    case 'RESET':
      return { ...INITIAL_STATE }
    case 'DEVICE':
      return { ...state, device: action.device, gpuName: action.gpuName }
    case 'SET_SOURCE_LANGUAGE':
      return { ...state, sourceLanguage: action.value }
    case 'SET_TRANSLATE':
      return { ...state, translateToEnglish: action.value }
    case 'SET_GPU_PREFERENCE':
      return { ...state, gpuPreference: action.value }
    default:
      return state
  }
}

async function fetchUrlAsArrayBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.arrayBuffer()
}

export function useWhisper() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const workerRef = useRef(null)

  const start = useCallback(async (source) => {
    dispatch({ type: 'START_LOADING' })

    // Create worker and register message handler synchronously before any await,
    // so the handler is available immediately after start() is called.
    if (workerRef.current) workerRef.current.terminate()
    const worker = new WhisperWorker()
    workerRef.current = worker

    worker.addEventListener('message', (event) => {
      const msg = event.data
      switch (msg.type) {
        case 'model-progress':
          dispatch({ type: 'MODEL_PROGRESS', value: msg.value })
          break
        case 'transcribing-start':
          dispatch({ type: 'TRANSCRIBING_START' })
          break
        case 'transcript-progress':
          dispatch({ type: 'TRANSCRIPT_PROGRESS', value: msg.value })
          break
        case 'segment':
          dispatch({ type: 'SEGMENT', data: msg.data })
          break
        case 'done':
          dispatch({ type: 'DONE', language: msg.language })
          break
        case 'error':
          dispatch({ type: 'ERROR', message: msg.message })
          break
        case 'device':
          dispatch({ type: 'DEVICE', device: msg.device, gpuName: msg.gpuName })
          break
      }
    })

    try {
      let arrayBuffer
      if (source instanceof File) {
        arrayBuffer = await source.arrayBuffer()
      } else if (typeof source === 'string') {
        arrayBuffer = await fetchUrlAsArrayBuffer(source)
      } else {
        throw new Error('Invalid source: must be a File or URL string')
      }

      const { float32, duration } = await decodeAudioToFloat32(arrayBuffer)

      const transferBuffer = float32.buffer.slice(0)
      worker.postMessage(
        {
          type: 'transcribe',
          audio: transferBuffer,
          language: state.sourceLanguage,
          translate: state.translateToEnglish,
          gpuPreference: state.gpuPreference,
          duration,
        },
        [transferBuffer]
      )
    } catch (err) {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      dispatch({ type: 'ERROR', message: err.message })
    }
  }, [state.sourceLanguage, state.translateToEnglish, state.gpuPreference])

  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    dispatch({ type: 'RESET' })
  }, [])

  const setSourceLanguage = useCallback((value) => {
    dispatch({ type: 'SET_SOURCE_LANGUAGE', value })
  }, [])

  const setTranslateToEnglish = useCallback((value) => {
    dispatch({ type: 'SET_TRANSLATE', value })
  }, [])

  const setGpuPreference = useCallback((value) => {
    dispatch({ type: 'SET_GPU_PREFERENCE', value })
  }, [])

  return {
    ...state,
    start,
    reset,
    setSourceLanguage,
    setTranslateToEnglish,
    setGpuPreference,
  }
}
