# Audio Transcript Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React 19 + Vite 6 SPA that transcribes audio/video files entirely in the browser using Whisper via WebGPU (WASM fallback), with file upload, direct URL input, language selection, real-time streaming output, and TXT/SRT export.

**Architecture:** A Web Worker (`whisper.worker.js`) handles all ML inference using `@huggingface/transformers` v3 so the UI thread is never blocked. The main thread decodes audio to 16 kHz mono Float32Array via `OfflineAudioContext`, then transfers the buffer to the worker. The `useWhisper` hook manages all worker communication and exposes state + actions to the component tree.

**Tech Stack:** React 19, Vite 6, `@huggingface/transformers` v3 (WebGPU + WASM backends), Tailwind CSS v4, `lucide-react`, Vitest + @testing-library/react.

**Golden rules (apply after EVERY task):**
1. Update README if the task adds user-visible functionality
2. `git push origin master` after every commit

---

## File Map

| File | Responsibility |
|---|---|
| `vite.config.js` | Build config: React plugin, Tailwind plugin, COEP/COOP headers, worker ES modules |
| `src/index.css` | Global styles: Tailwind import, custom theme, glassmorphism base |
| `src/main.jsx` | React root mount |
| `src/App.jsx` | Root component: layout, header, WebGPU badge, state wiring |
| `src/lib/exporters.js` | Pure functions: `segmentsToTxt`, `segmentsToSrt`, `formatSrtTime` |
| `src/lib/decodeAudio.js` | Pure async: decodes ArrayBuffer → 16 kHz mono Float32Array |
| `src/lib/languages.js` | Static data: `LANGUAGES` array with code/name pairs |
| `src/workers/whisper.worker.js` | Web Worker: model load (WebGPU→WASM fallback), transcription, message protocol |
| `src/hooks/useWhisper.js` | Hook: worker lifecycle, audio decoding, state management |
| `src/components/InputPanel.jsx` | Drag-and-drop zone + direct URL input + size warning |
| `src/components/LanguageSelector.jsx` | Source language dropdown + translate-to-English toggle |
| `src/components/ProgressBar.jsx` | Dual progress bars (model load + transcription) |
| `src/components/TranscriptViewer.jsx` | Real-time streaming segments with timestamps |
| `src/components/ExportBar.jsx` | Copy to clipboard, download TXT, download SRT |
| `src/test/setup.js` | Vitest setup: `@testing-library/jest-dom` matchers |

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx` (skeleton)
- Create: `src/index.css`
- Create: `src/test/setup.js`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Initialise project and install dependencies**

```bash
cd "C:/D/OneDrive - SAP SE/SAP/SW/Claude/projects/audio-transcript"
npm create vite@latest . -- --template react
```

When prompted, choose **React** and **JavaScript**. Then install all dependencies:

```bash
npm install @huggingface/transformers lucide-react
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Write `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
```

> **Why these headers?** WebGPU and SharedArrayBuffer require the page to be cross-origin isolated. `credentialless` (vs `require-corp`) allows loading model files from the Hugging Face CDN without needing CORP headers on those responses.

- [ ] **Step 3: Write `src/test/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Write `src/index.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0f;
  --color-surface: rgba(255, 255, 255, 0.05);
  --color-border: rgba(255, 255, 255, 0.08);
  --color-accent: #7c3aed;
  --color-accent-blue: #3b82f6;
  --color-muted: rgba(255, 255, 255, 0.4);
}

* {
  box-sizing: border-box;
}

body {
  background-color: #0a0a0f;
  color: #f1f5f9;
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  background-image: radial-gradient(ellipse at 20% 20%, rgba(124, 58, 237, 0.08) 0%, transparent 60%),
                    radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 60%);
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
```

- [ ] **Step 5: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/mic.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AudioScribe</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Write skeleton `src/App.jsx`**

```jsx
export default function App() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold text-white">AudioScribe</h1>
      <p className="text-slate-400 mt-2">Scaffolding OK</p>
    </div>
  )
}
```

- [ ] **Step 8: Write `.gitignore`**

```
node_modules/
dist/
.env
.env.local
```

- [ ] **Step 9: Write `README.md`**

```markdown
# AudioScribe

Browser-based audio/video transcription using Whisper (WebGPU accelerated, WASM fallback).
No server. No data leaves your device.

## Features
- Drag & drop file or direct URL input (MP3, MP4, WAV, M4A, WebM, OGG, FLAC)
- WebGPU acceleration (Chrome 113+) with automatic WASM fallback
- Auto language detection or manual source language selection
- Translate to English (Whisper native translation)
- Real-time streaming transcript with timestamps
- Export as TXT or SRT, or copy to clipboard

## Dev

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest
npm run build     # production build
```

## Notes
- First load downloads the whisper-base model (~150 MB), cached in IndexedDB afterwards.
- Requires Chrome 113+ for WebGPU. All modern browsers work in WASM (CPU) mode.
```

- [ ] **Step 10: Verify dev server starts**

```bash
cd "C:/D/OneDrive - SAP SE/SAP/SW/Claude/projects/audio-transcript"
npm run dev
```

Expected: Vite starts at `http://localhost:5173`, page loads with "AudioScribe — Scaffolding OK" on dark background.

- [ ] **Step 11: Commit and push**

```bash
cd "C:/D/OneDrive - SAP SE/SAP/SW/Claude/projects/audio-transcript"
git add -A
git commit -m "feat: scaffold React+Vite+Tailwind v4 project with Vitest"
git push origin master
```

---

## Task 2: exporters.js (TDD)

**Files:**
- Create: `src/lib/exporters.js`
- Create: `src/lib/exporters.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/exporters.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { segmentsToTxt, segmentsToSrt } from './exporters'

const SEGMENTS = [
  { start: 0, end: 8.5, text: 'Hello, good morning everyone.' },
  { start: 8.5, end: 15.2, text: "Today we'll review Q3." },
  { start: 15.2, end: 23.0, text: 'First item on the agenda.' },
]

describe('segmentsToTxt', () => {
  it('joins segment texts with newlines', () => {
    const result = segmentsToTxt(SEGMENTS)
    expect(result).toBe(
      "Hello, good morning everyone.\nToday we'll review Q3.\nFirst item on the agenda."
    )
  })

  it('returns empty string for empty segments', () => {
    expect(segmentsToTxt([])).toBe('')
  })
})

describe('segmentsToSrt', () => {
  it('formats SRT with 1-based index, timestamps, and text', () => {
    const result = segmentsToSrt(SEGMENTS)
    const blocks = result.split('\n\n')
    expect(blocks).toHaveLength(3)
    expect(blocks[0]).toBe(
      '1\n00:00:00,000 --> 00:00:08,500\nHello, good morning everyone.'
    )
    expect(blocks[1]).toBe(
      "2\n00:00:08,500 --> 00:00:15,200\nToday we'll review Q3."
    )
  })

  it('formats hours correctly for long audio', () => {
    const seg = [{ start: 3661.5, end: 3670.0, text: 'Late segment.' }]
    const result = segmentsToSrt(seg)
    expect(result).toContain('01:01:01,500 --> 01:01:10,000')
  })

  it('returns empty string for empty segments', () => {
    expect(segmentsToSrt([])).toBe('')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd "C:/D/OneDrive - SAP SE/SAP/SW/Claude/projects/audio-transcript"
npx vitest run src/lib/exporters.test.js
```

Expected: FAIL — `Cannot find module './exporters'`

- [ ] **Step 3: Implement `src/lib/exporters.js`**

```js
function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':') + ',' + String(ms).padStart(3, '0')
}

export function segmentsToTxt(segments) {
  return segments.map(s => s.text).join('\n')
}

export function segmentsToSrt(segments) {
  if (segments.length === 0) return ''
  return segments
    .map((seg, i) =>
      `${i + 1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text}`
    )
    .join('\n\n')
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/lib/exporters.test.js
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit and push**

```bash
git add src/lib/exporters.js src/lib/exporters.test.js
git commit -m "feat: add TXT and SRT exporters with tests"
git push origin master
```

---

## Task 3: languages.js

**Files:**
- Create: `src/lib/languages.js`

No separate test needed — this is pure static data.

- [ ] **Step 1: Create `src/lib/languages.js`**

```js
export const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'es', name: 'Spanish' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'uk', name: 'Ukrainian' },
]

export const LANGUAGE_MAP = Object.fromEntries(LANGUAGES.map(l => [l.code, l.name]))
```

- [ ] **Step 2: Commit and push**

```bash
git add src/lib/languages.js
git commit -m "feat: add languages static data"
git push origin master
```

---

## Task 4: decodeAudio.js (TDD)

**Files:**
- Create: `src/lib/decodeAudio.js`
- Create: `src/lib/decodeAudio.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/decodeAudio.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { decodeAudioToFloat32 } from './decodeAudio'

// Minimal mocks for AudioContext and OfflineAudioContext (not in jsdom)
beforeEach(() => {
  const fakeFloat32 = new Float32Array([0.1, 0.2, 0.3])
  const fakeRendered = { getChannelData: () => fakeFloat32 }
  const fakeSource = { connect: vi.fn(), start: vi.fn() }

  global.AudioContext = vi.fn(() => ({
    decodeAudioData: vi.fn(() =>
      Promise.resolve({ duration: 5.0, numberOfChannels: 1 })
    ),
    close: vi.fn(() => Promise.resolve()),
  }))

  global.OfflineAudioContext = vi.fn(() => ({
    createBufferSource: vi.fn(() => fakeSource),
    destination: {},
    startRendering: vi.fn(() => Promise.resolve(fakeRendered)),
  }))
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/lib/decodeAudio.test.js
```

Expected: FAIL — `Cannot find module './decodeAudio'`

- [ ] **Step 3: Implement `src/lib/decodeAudio.js`**

```js
const TARGET_SR = 16000

export async function decodeAudioToFloat32(arrayBuffer) {
  const audioCtx = new AudioContext()
  // slice(0) prevents "buffer already detached" if caller reuses the buffer
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
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/lib/decodeAudio.test.js
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit and push**

```bash
git add src/lib/decodeAudio.js src/lib/decodeAudio.test.js
git commit -m "feat: add audio decoding helper with tests"
git push origin master
```

---

## Task 5: whisper.worker.js

**Files:**
- Create: `src/workers/whisper.worker.js`

The worker cannot be unit-tested without a real browser + WebGPU. We verify it in Task 9 (integration via the full UI). The code here is the complete production implementation.

- [ ] **Step 1: Create `src/workers/whisper.worker.js`**

```js
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
    let detectedLanguage = null

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

    // Try to extract detected language from full result chunks
    if (result?.chunks?.[0]?.language) {
      detectedLanguage = result.chunks[0].language
    }

    self.postMessage({ type: 'done', language: detectedLanguage })
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message ?? 'Unknown error' })
  }
})
```

- [ ] **Step 2: Commit and push**

```bash
git add src/workers/whisper.worker.js
git commit -m "feat: add Whisper Web Worker with WebGPU/WASM auto-detection"
git push origin master
```

---

## Task 6: useWhisper.js (TDD)

**Files:**
- Create: `src/hooks/useWhisper.js`
- Create: `src/hooks/useWhisper.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useWhisper.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWhisper } from './useWhisper'

// Capture the message handler so tests can simulate worker messages
let messageHandler = null
const mockWorkerInstance = {
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn((event, handler) => {
    if (event === 'message') messageHandler = handler
  }),
  removeEventListener: vi.fn(),
}

vi.mock('../workers/whisper.worker.js?worker', () => ({
  default: vi.fn(() => mockWorkerInstance),
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

  it('exposes setSourceLanguage and setTranslateToEnglish', () => {
    const { result } = renderHook(() => useWhisper())
    expect(typeof result.current.setSourceLanguage).toBe('function')
    expect(typeof result.current.setTranslateToEnglish).toBe('function')
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

describe('useWhisper — worker message handling', () => {
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/hooks/useWhisper.test.js
```

Expected: FAIL — `Cannot find module './useWhisper'`

- [ ] **Step 3: Implement `src/hooks/useWhisper.js`**

```js
import { useReducer, useRef, useCallback } from 'react'
import { decodeAudioToFloat32 } from '../lib/decodeAudio'
import WhisperWorker from '../workers/whisper.worker.js?worker'

const INITIAL_STATE = {
  status: 'idle',
  modelProgress: 0,
  transcriptProgress: 0,
  segments: [],
  detectedLanguage: null,
  sourceLanguage: 'auto',
  translateToEnglish: false,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_LOADING':
      return { ...INITIAL_STATE, status: 'loading-model', sourceLanguage: state.sourceLanguage, translateToEnglish: state.translateToEnglish, device: state.device }
    case 'MODEL_PROGRESS':
      return { ...state, status: 'loading-model', modelProgress: action.value }
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
    case 'SET_SOURCE_LANGUAGE':
      return { ...state, sourceLanguage: action.value }
    case 'SET_TRANSLATE':
      return { ...state, translateToEnglish: action.value }
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

      if (workerRef.current) workerRef.current.terminate()
      const worker = new WhisperWorker()
      workerRef.current = worker

      worker.addEventListener('message', (event) => {
        const msg = event.data
        switch (msg.type) {
          case 'model-progress':
            dispatch({ type: 'MODEL_PROGRESS', value: msg.value })
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
        }
      })

      const transferBuffer = float32.buffer.slice(0)
      worker.postMessage(
        {
          type: 'transcribe',
          audio: transferBuffer,
          language: state.sourceLanguage,
          translate: state.translateToEnglish,
          duration,
        },
        [transferBuffer]
      )
    } catch (err) {
      dispatch({ type: 'ERROR', message: err.message })
    }
  }, [state.sourceLanguage, state.translateToEnglish])

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

  return {
    ...state,
    start,
    reset,
    setSourceLanguage,
    setTranslateToEnglish,
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/hooks/useWhisper.test.js
```

Expected: PASS — all tests passing.

- [ ] **Step 5: Commit and push**

```bash
git add src/hooks/useWhisper.js src/hooks/useWhisper.test.js
git commit -m "feat: add useWhisper hook with worker communication and tests"
git push origin master
```

---

## Task 7: InputPanel.jsx (TDD)

**Files:**
- Create: `src/components/InputPanel.jsx`
- Create: `src/components/InputPanel.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/InputPanel.test.jsx`:

```jsx
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
    // 2.1 GB file
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/components/InputPanel.test.jsx
```

Expected: FAIL — `Cannot find module './InputPanel'`

- [ ] **Step 3: Implement `src/components/InputPanel.jsx`**

```jsx
import { useState, useRef } from 'react'
import { Upload, Link } from 'lucide-react'

const TWO_GB = 2 * 1024 ** 3
const ACCEPTED = '.mp3,.mp4,.wav,.m4a,.webm,.ogg,.flac'

export function InputPanel({ onSource, disabled }) {
  const [dragging, setDragging] = useState(false)
  const [url, setUrl] = useState('')
  const [sizeWarning, setSizeWarning] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const inputRef = useRef(null)

  function handleFile(file) {
    if (!file) return
    if (file.size > TWO_GB) {
      setSizeWarning(true)
      setPendingFile(file)
      return
    }
    onSource(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  function handleUrlSubmit(e) {
    e.preventDefault()
    if (!url.trim() || disabled) return
    onSource(url.trim())
    setUrl('')
  }

  function confirmLargeFile() {
    setSizeWarning(false)
    if (pendingFile) onSource(pendingFile)
    setPendingFile(null)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        data-testid="drop-zone"
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? '#7c3aed' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: '12px',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: dragging ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
          transition: 'all 0.2s ease',
          boxShadow: dragging ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
        }}
      >
        <Upload className="mx-auto mb-3 text-slate-400" size={32} />
        <p className="text-slate-200 font-medium">Drag & drop audio/video here</p>
        <p className="text-slate-500 text-sm mt-1">or click to browse</p>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-slate-500 text-sm">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* URL input row */}
        <form onSubmit={handleUrlSubmit} onClick={(e) => e.stopPropagation()} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://... direct audio/video URL"
            disabled={disabled}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={disabled || !url.trim()}
            className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
          >
            <Link size={16} />
          </button>
        </form>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      <p className="text-slate-500 text-xs text-center">
        MP3 · MP4 · WAV · M4A · WebM · OGG · FLAC
      </p>

      {/* Large file warning */}
      {sizeWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-amber-300 text-sm font-medium mb-3">
            Large file warning — this file is over 2 GB and may take a long time to process.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmLargeFile}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm transition-colors"
            >
              Continue anyway
            </button>
            <button
              onClick={() => { setSizeWarning(false); setPendingFile(null) }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/components/InputPanel.test.jsx
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit and push**

```bash
git add src/components/InputPanel.jsx src/components/InputPanel.test.jsx
git commit -m "feat: add InputPanel with drag-drop, URL input, and size warning"
git push origin master
```

---

## Task 8: LanguageSelector.jsx (TDD)

**Files:**
- Create: `src/components/LanguageSelector.jsx`
- Create: `src/components/LanguageSelector.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/LanguageSelector.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSelector } from './LanguageSelector'

describe('LanguageSelector', () => {
  it('renders language dropdown and translate toggle', () => {
    render(
      <LanguageSelector
        sourceLanguage="auto"
        translateToEnglish={false}
        onSourceLanguageChange={vi.fn()}
        onTranslateChange={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('calls onSourceLanguageChange when dropdown changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LanguageSelector
        sourceLanguage="auto"
        translateToEnglish={false}
        onSourceLanguageChange={onChange}
        onTranslateChange={vi.fn()}
        disabled={false}
      />
    )
    await user.selectOptions(screen.getByRole('combobox'), 'es')
    expect(onChange).toHaveBeenCalledWith('es')
  })

  it('calls onTranslateChange when toggle is clicked', async () => {
    const user = userEvent.setup()
    const onTranslate = vi.fn()
    render(
      <LanguageSelector
        sourceLanguage="auto"
        translateToEnglish={false}
        onSourceLanguageChange={vi.fn()}
        onTranslateChange={onTranslate}
        disabled={false}
      />
    )
    await user.click(screen.getByRole('checkbox'))
    expect(onTranslate).toHaveBeenCalledWith(true)
  })

  it('disables translate toggle when source language is English', () => {
    render(
      <LanguageSelector
        sourceLanguage="en"
        translateToEnglish={false}
        onSourceLanguageChange={vi.fn()}
        onTranslateChange={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('disables all controls when disabled=true', () => {
    render(
      <LanguageSelector
        sourceLanguage="auto"
        translateToEnglish={false}
        onSourceLanguageChange={vi.fn()}
        onTranslateChange={vi.fn()}
        disabled={true}
      />
    )
    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/components/LanguageSelector.test.jsx
```

Expected: FAIL — `Cannot find module './LanguageSelector'`

- [ ] **Step 3: Implement `src/components/LanguageSelector.jsx`**

```jsx
import { Globe, Languages } from 'lucide-react'
import { LANGUAGES } from '../lib/languages'

export function LanguageSelector({
  sourceLanguage,
  translateToEnglish,
  onSourceLanguageChange,
  onTranslateChange,
  disabled,
}) {
  const translateDisabled = disabled || sourceLanguage === 'en'

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Source language dropdown */}
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-slate-400 shrink-0" />
        <select
          value={sourceLanguage}
          onChange={(e) => onSourceLanguageChange(e.target.value)}
          disabled={disabled}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 disabled:opacity-40 cursor-pointer"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-slate-900">
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Translate to English toggle */}
      <label
        className={`flex items-center gap-2 cursor-pointer select-none ${translateDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <input
          type="checkbox"
          checked={translateToEnglish}
          onChange={(e) => onTranslateChange(e.target.checked)}
          disabled={translateDisabled}
          className="w-4 h-4 accent-violet-500"
        />
        <Languages size={16} className="text-slate-400" />
        <span className="text-sm text-slate-300">Translate to English</span>
      </label>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/components/LanguageSelector.test.jsx
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit and push**

```bash
git add src/components/LanguageSelector.jsx src/components/LanguageSelector.test.jsx
git commit -m "feat: add LanguageSelector with source language and translate toggle"
git push origin master
```

---

## Task 9: ProgressBar.jsx, TranscriptViewer.jsx, ExportBar.jsx (TDD)

**Files:**
- Create: `src/components/ProgressBar.jsx`
- Create: `src/components/ProgressBar.test.jsx`
- Create: `src/components/TranscriptViewer.jsx`
- Create: `src/components/TranscriptViewer.test.jsx`
- Create: `src/components/ExportBar.jsx`
- Create: `src/components/ExportBar.test.jsx`

- [ ] **Step 1: Write failing tests for ProgressBar**

Create `src/components/ProgressBar.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('shows model loading phase with correct percentage', () => {
    render(<ProgressBar status="loading-model" modelProgress={45} transcriptProgress={0} />)
    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText(/loading model/i)).toBeInTheDocument()
  })

  it('shows transcription phase with correct percentage', () => {
    render(<ProgressBar status="transcribing" modelProgress={100} transcriptProgress={62} />)
    expect(screen.getByText('62%')).toBeInTheDocument()
    expect(screen.getByText(/transcribing/i)).toBeInTheDocument()
  })

  it('renders nothing when status is idle', () => {
    const { container } = render(<ProgressBar status="idle" modelProgress={0} transcriptProgress={0} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Write failing tests for TranscriptViewer**

Create `src/components/TranscriptViewer.test.jsx`:

```jsx
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
```

- [ ] **Step 3: Write failing tests for ExportBar**

Create `src/components/ExportBar.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportBar } from './ExportBar'

const SEGMENTS = [
  { start: 0, end: 5, text: 'Hello world.' },
  { start: 5, end: 10, text: 'Second line.' },
]

describe('ExportBar', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    global.URL.createObjectURL = vi.fn(() => 'blob:fake')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('renders copy, TXT, and SRT buttons', () => {
    render(<ExportBar segments={SEGMENTS} />)
    expect(screen.getByText(/copy/i)).toBeInTheDocument()
    expect(screen.getByText('TXT')).toBeInTheDocument()
    expect(screen.getByText('SRT')).toBeInTheDocument()
  })

  it('calls clipboard.writeText with plain text on copy', async () => {
    const user = userEvent.setup()
    render(<ExportBar segments={SEGMENTS} />)
    await user.click(screen.getByText(/copy/i))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Hello world.\nSecond line.'
    )
  })
})
```

- [ ] **Step 4: Run all three failing test suites**

```bash
npx vitest run src/components/ProgressBar.test.jsx src/components/TranscriptViewer.test.jsx src/components/ExportBar.test.jsx
```

Expected: FAIL — all three, modules not found.

- [ ] **Step 5: Implement `src/components/ProgressBar.jsx`**

```jsx
export function ProgressBar({ status, modelProgress, transcriptProgress }) {
  if (status === 'idle' || status === 'done' || status === 'error') return null

  const isLoading = status === 'loading-model'
  const progress = isLoading ? modelProgress : transcriptProgress
  const label = isLoading ? 'Loading model' : 'Transcribing'

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-400">{label}…</span>
        <span className="text-violet-400 font-mono font-medium">{progress}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Implement `src/components/TranscriptViewer.jsx`**

```jsx
import { useEffect, useRef } from 'react'
import { LANGUAGE_MAP } from '../lib/languages'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function TranscriptViewer({ segments, detectedLanguage }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [segments.length])

  if (segments.length === 0) return null

  const langName = detectedLanguage ? LANGUAGE_MAP[detectedLanguage] || detectedLanguage : null

  return (
    <div className="space-y-3">
      {langName && (
        <p className="text-sm text-slate-400">
          🌍 Detected language: <span className="text-violet-400">{langName}</span>
        </p>
      )}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <div className="space-y-2 font-mono text-sm">
          {segments.map((seg, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-slate-500 shrink-0 w-10 text-right">
                {formatTime(seg.start)}
              </span>
              <span className="text-slate-200 leading-relaxed">{seg.text}</span>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Implement `src/components/ExportBar.jsx`**

```jsx
import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { segmentsToTxt, segmentsToSrt } from '../lib/exporters'

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportBar({ segments }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(segmentsToTxt(segments))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleTxt() {
    downloadBlob(segmentsToTxt(segments), 'transcript.txt', 'text/plain')
  }

  function handleSrt() {
    downloadBlob(segmentsToSrt(segments), 'transcript.srt', 'text/plain')
  }

  const btnBase =
    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors'

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleCopy}
        className={`${btnBase} bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10`}
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button
        onClick={handleTxt}
        className={`${btnBase} bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10`}
      >
        <Download size={14} />
        TXT
      </button>
      <button
        onClick={handleSrt}
        className={`${btnBase} bg-violet-600 hover:bg-violet-500 text-white`}
      >
        <Download size={14} />
        SRT
      </button>
    </div>
  )
}
```

- [ ] **Step 8: Run all three test suites — verify they pass**

```bash
npx vitest run src/components/ProgressBar.test.jsx src/components/TranscriptViewer.test.jsx src/components/ExportBar.test.jsx
```

Expected: PASS — all tests passing.

- [ ] **Step 9: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass (exporters, decodeAudio, useWhisper, InputPanel, LanguageSelector, ProgressBar, TranscriptViewer, ExportBar).

- [ ] **Step 10: Commit and push**

```bash
git add src/components/
git commit -m "feat: add ProgressBar, TranscriptViewer, and ExportBar with tests"
git push origin master
```

---

## Task 10: App.jsx — Wire everything + README update

**Files:**
- Modify: `src/App.jsx`
- Modify: `README.md`

- [ ] **Step 1: Implement `src/App.jsx`**

```jsx
import { Mic, Cpu, Zap } from 'lucide-react'
import { useWhisper } from './hooks/useWhisper'
import { InputPanel } from './components/InputPanel'
import { LanguageSelector } from './components/LanguageSelector'
import { ProgressBar } from './components/ProgressBar'
import { TranscriptViewer } from './components/TranscriptViewer'
import { ExportBar } from './components/ExportBar'

function WebGpuBadge({ device }) {
  if (!device) return null
  const isGpu = device === 'webgpu'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        background: isGpu ? 'rgba(124,58,237,0.15)' : 'rgba(245,158,11,0.15)',
        border: `1px solid ${isGpu ? 'rgba(124,58,237,0.4)' : 'rgba(245,158,11,0.4)'}`,
        color: isGpu ? '#a78bfa' : '#fbbf24',
      }}
    >
      {isGpu ? <Zap size={12} /> : <Cpu size={12} />}
      {isGpu ? 'WebGPU ✓' : 'CPU mode'}
    </span>
  )
}

export default function App() {
  const whisper = useWhisper()
  const isWorking = whisper.status === 'loading-model' || whisper.status === 'transcribing'
  const hasResults = whisper.segments.length > 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(10,10,15,0.8)',
        }}
      >
        <div className="flex items-center gap-2">
          <Mic size={20} className="text-violet-400" />
          <span className="text-white font-semibold text-lg tracking-tight">AudioScribe</span>
        </div>
        <WebGpuBadge device={whisper.device} />
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Error banner */}
        {whisper.status === 'error' && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p className="text-red-300 text-sm">{whisper.error}</p>
            <button
              onClick={whisper.reset}
              className="text-xs text-red-400 hover:text-red-200 underline ml-4"
            >
              Reset
            </button>
          </div>
        )}

        {/* Input section (hidden while working or done) */}
        {whisper.status === 'idle' || whisper.status === 'error' ? (
          <section className="space-y-5">
            <InputPanel onSource={whisper.start} disabled={isWorking} />
            <LanguageSelector
              sourceLanguage={whisper.sourceLanguage}
              translateToEnglish={whisper.translateToEnglish}
              onSourceLanguageChange={whisper.setSourceLanguage}
              onTranslateChange={whisper.setTranslateToEnglish}
              disabled={isWorking}
            />
          </section>
        ) : null}

        {/* Progress */}
        {isWorking && (
          <section
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <ProgressBar
              status={whisper.status}
              modelProgress={whisper.modelProgress}
              transcriptProgress={whisper.transcriptProgress}
            />
          </section>
        )}

        {/* Live transcript (shown during transcribing and after done) */}
        {(isWorking || whisper.status === 'done') && hasResults && (
          <section className="space-y-4">
            <TranscriptViewer
              segments={whisper.segments}
              detectedLanguage={whisper.detectedLanguage}
            />
          </section>
        )}

        {/* Export bar (only when done) */}
        {whisper.status === 'done' && hasResults && (
          <section className="space-y-4">
            <ExportBar segments={whisper.segments} />
            <button
              onClick={whisper.reset}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline"
            >
              Transcribe another file
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
```

> **Note:** `whisper.device` is set by the worker when it sends the `{ type: 'device', device }` message. Add it to the reducer and initial state:

- [ ] **Step 2: Add `device` to useWhisper state**

In `src/hooks/useWhisper.js`, update:

```js
// In INITIAL_STATE add:
const INITIAL_STATE = {
  status: 'idle',
  modelProgress: 0,
  transcriptProgress: 0,
  segments: [],
  detectedLanguage: null,
  device: null,           // ← add this
  sourceLanguage: 'auto',
  translateToEnglish: false,
  error: null,
}

// In reducer, add case:
case 'DEVICE':
  return { ...state, device: action.device }

// In the worker message handler switch, add:
case 'device':
  dispatch({ type: 'DEVICE', device: msg.device })
  break
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 4: Start dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:
- Dark background with purple/blue gradient
- Header shows "AudioScribe" with mic icon
- Drop zone with animated dashed border visible
- URL input inside the drop zone
- Language selector below drop zone
- "Translate to English" toggle disabled when English is selected
- Drop an audio file → progress bar appears → segments stream in → export buttons appear

- [ ] **Step 5: Update README.md**

Update the README to reflect the completed app state:

```markdown
# AudioScribe

Browser-based audio/video transcription using Whisper (WebGPU accelerated, WASM fallback).
No server. No data leaves your device.

## Features
- Drag & drop file or direct URL input (MP3, MP4, WAV, M4A, WebM, OGG, FLAC)
- WebGPU acceleration (Chrome 113+) with automatic WASM fallback
- Auto language detection or manual source language selection (20 languages)
- Translate to English using Whisper's native translation
- Real-time streaming transcript with segment-level timestamps
- Export as plain TXT or SRT subtitle file, or copy to clipboard

## Usage

1. Drop an audio/video file into the app (or paste a direct URL)
2. Optionally select the source language or enable "Translate to English"
3. Wait while the model loads (first time only, ~150 MB, cached in IndexedDB)
4. Transcript appears in real time as audio is processed
5. Copy, download as TXT, or download as SRT

## Dev

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest unit tests
npm run build     # Production build
```

## Requirements

- Chrome 113+ or Edge 113+ for WebGPU acceleration
- Any modern browser (Firefox, Safari) works in CPU/WASM mode, but is slower
- First load: ~150 MB model download (cached in IndexedDB for future use)

## Architecture

- **UI thread:** React 19 + Vite 6, Tailwind CSS v4
- **Web Worker:** `@huggingface/transformers` v3 runs Whisper inference off the main thread
- **Audio decoding:** OfflineAudioContext resamples to 16 kHz mono before passing to the worker
- **No backend:** 100% static SPA, deployable to any CDN
```

- [ ] **Step 6: Commit and push**

```bash
git add src/App.jsx src/hooks/useWhisper.js README.md
git commit -m "feat: wire all components into App — v1 complete"
git push origin master
```

---

## Test Summary

After all tasks complete, run the full suite one final time:

```bash
npx vitest run
```

Expected output (approximate):
```
 ✓ src/lib/exporters.test.js (5 tests)
 ✓ src/lib/decodeAudio.test.js (2 tests)
 ✓ src/hooks/useWhisper.test.js (8 tests)
 ✓ src/components/InputPanel.test.jsx (5 tests)
 ✓ src/components/LanguageSelector.test.jsx (5 tests)
 ✓ src/components/ProgressBar.test.jsx (3 tests)
 ✓ src/components/TranscriptViewer.test.jsx (3 tests)
 ✓ src/components/ExportBar.test.jsx (2 tests)

 Test Files  8 passed (8)
 Tests      33 passed (33)
```
