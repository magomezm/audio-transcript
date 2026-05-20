# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server at http://localhost:5173 (with live reload)
npm run build    # Production build → dist/
npm run preview  # Serve the production build locally
npm run lint     # ESLint
npm test         # Vitest (run once, no watch)
```

To run a single test file:
```bash
npx vitest run src/lib/exporters.test.js
```

To run tests in watch mode during development:
```bash
npx vitest
```

## Architecture

**No backend.** This is a 100% static SPA — audio never leaves the browser.

### Data flow

```
App.jsx
  └─ useWhisper (hook)          ← single source of state
       ├─ decodeAudio.js        ← main thread: File/URL → Float32Array @ 16kHz via OfflineAudioContext
       └─ whisper.worker.js     ← Web Worker: @huggingface/transformers v4, WebGPU → WASM fallback
```

1. User drops a file or submits a URL → `InputPanel` calls `useWhisper.start(source)`
2. Main thread decodes audio to 16 kHz mono Float32Array (`decodeAudio.js`) then transfers the buffer to the worker
3. Worker loads `onnx-community/whisper-base` on first use (cached in IndexedDB), runs inference, and sends messages back: `model-progress` → `transcribing-start` → `segment` (one per chunk) → `done`
4. `useWhisper` reducer applies each message to state; components re-render reactively

### Worker message protocol

Main → Worker: `{ type: 'transcribe', audio: ArrayBuffer, language: string|null, translate: boolean, duration: number, gpuPreference: 'auto'|'high-performance'|'low-power'|'cpu' }`

Worker → Main:
- `{ type: 'device', device: 'webgpu'|'wasm', gpuName: string|null }`
- `{ type: 'model-progress', value: 0–100 }`
- `{ type: 'transcribing-start' }` — fired immediately before `transcriber()` call; triggers indeterminate progress bar
- `{ type: 'segment', data: { start, end, text } }`
- `{ type: 'transcript-progress', value: 0–99 }` — emitted after each chunk in post-processing loop
- `{ type: 'done', language: string|null }`
- `{ type: 'error', message: string }`

### useWhisper state shape

```js
{
  status: 'idle'|'loading-model'|'transcribing'|'done'|'error',
  modelProgress: 0–100,
  transcriptProgress: 0–100,
  segments: [{ start, end, text }],
  detectedLanguage: string|null,
  device: 'webgpu'|'wasm'|null,
  gpuName: string|null,          // GPU name shown in header badge
  sourceLanguage: string,        // 'auto' or ISO code
  translateToEnglish: boolean,
  gpuPreference: 'high-performance'|'low-power'|'auto'|'cpu',  // default: 'high-performance'
  duration: number|null,         // seconds from start() to done, shown on completion
  error: string|null,
}
```

### Key constraints

**COEP/COOP headers are required.** `vite.config.js` sets `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` on both dev server and preview. These are needed for WebGPU/SharedArrayBuffer. `credentialless` (not `require-corp`) is used so the model can be fetched from the Hugging Face CDN without CORP headers.

**Worker must be imported with `?worker` suffix:**
```js
import WhisperWorker from '../workers/whisper.worker.js?worker'
```
`worker: { format: 'es' }` in `vite.config.js` makes this a module worker. `optimizeDeps.exclude: ['@huggingface/transformers']` prevents Vite from pre-bundling it (it must load as-is in the worker).

**Worker is a singleton:** `transcriber` is module-level in the worker — the model is loaded once and reused across calls in the same worker lifetime. However, `useWhisper.start()` terminates and recreates the worker on each call, so the singleton resets between transcriptions (model is reloaded from IndexedDB cache).

**Audio decoding is on the main thread** because `AudioContext` is not available in workers. `decodeAudio.js` uses `OfflineAudioContext` to resample to 16 kHz mono before transferring to the worker.

**transformers.js v4 API changes from v3:**
- Pass `Float32Array` directly to the pipeline — v3 used `{ array: Float32Array, sampling_rate: number }`, which v4 treats as an opaque object and fails with `aud.subarray is not a function`
- `chunk_callback` was removed in v4 — segments arrive all at once after full inference via `result.chunks`
- Progress during transcription is indeterminate; `transcript-progress` messages are only emitted in the post-processing loop after inference completes

**GPU name detection:** `adapter.info` is a synchronous property added in Chrome/Edge 121+ that replaced the async `requestAdapterInfo()` method (which was removed). Always try `adapter.info` first, fall back to `requestAdapterInfo?.()`. Fields: `description` (full name), `vendor` (company name or hex PCI ID like `0x10de`), `device` (hex device ID). Build a readable name from `description` first, then fall back to mapping vendor IDs (0x10de → NVIDIA, 0x8086 → Intel, 0x1002 → AMD).

**GPU selection limitation:** Chrome/Edge run a single GPU process per session; WebGPU can only use that process's GPU. The `powerPreference` hint in `requestAdapter()` may be ignored. If the probe shows the same GPU for all preferences, show a warning with Windows graphics settings instructions.

**Elapsed time:** `useWhisper` sets `startTimeRef.current = Date.now()` at the top of `start()` and computes `(Date.now() - startTimeRef.current) / 1000` when the `done` message arrives. Stored as `state.duration` (seconds, float). `formatDuration()` in `App.jsx` formats it as `"12.3 s"` or `"1 min 08 s"`.

### Styling

Tailwind CSS v4 — configured via `@tailwindcss/vite` plugin (no `tailwind.config.js`). Custom theme tokens in `src/index.css` under `@theme { ... }`. Glassmorphism panels use inline `style` props rather than Tailwind utilities because the opacity values need to be dynamic. The `@keyframes whisper-scan` animation in `index.css` drives the indeterminate transcription progress bar.

### Testing

Vitest + jsdom + @testing-library/react. The worker and WebGPU path cannot be unit-tested; `useWhisper.test.js` mocks the `?worker` import with `vi.mock`. Mock constructors must be regular functions (not arrow functions) because they are called with `new`.

`src/test/setup.js` imports `@testing-library/jest-dom` for DOM matchers. Vitest globals are enabled so `describe`/`it`/`expect` don't need importing in test files.

The worker mock in `useWhisper.test.js` captures the message handler via `addEventListener`. Tests simulate worker responses by calling `messageHandler({ data: { type: '...' } })` inside `act()`.

### Golden rules

After every iteration: update docs if user-visible functionality changed, then `git push origin master`.
