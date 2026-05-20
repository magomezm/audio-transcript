# AudioScribe

Browser-based audio/video transcription using Whisper (WebGPU accelerated, WASM fallback).
No server. No data leaves your device.

## Features

- Drag & drop file or direct URL input (MP3, MP4, WAV, M4A, WebM, OGG, FLAC)
- WebGPU acceleration (Chrome 113+) with automatic WASM fallback
- GPU selector: choose High Performance (discrete GPU), Low Power (integrated), or CPU-only
- Auto language detection or manual source language selection (21 languages)
- Translate to English using Whisper's native translation
- Transcript with segment-level timestamps
- Export as plain TXT or SRT subtitle file, or copy to clipboard

## Usage

1. Drop an audio/video file into the app (or paste a direct URL)
2. Optionally select the source language or enable "Translate to English"
3. Optionally choose which GPU to use (default: browser auto-selects)
4. Wait while the model loads (first time only, ~150 MB, cached in IndexedDB)
5. An animated progress bar shows when transcription is running
6. Once complete, copy, download as TXT, or download as SRT

## Dev

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest unit tests (39 tests)
npm run build     # Production build
```

## Requirements

- Chrome 113+ or Edge 113+ for WebGPU acceleration
- Any modern browser (Firefox, Safari) works in CPU/WASM mode, but is slower
- First load: ~150 MB model download (cached in IndexedDB for future use)

## Architecture

- **UI thread:** React 19 + Vite 8, Tailwind CSS v4
- **Web Worker:** `@huggingface/transformers` v4 runs Whisper inference off the main thread
- **Model:** `onnx-community/whisper-base` (encoder fp32, decoder q4)
- **Audio decoding:** OfflineAudioContext resamples to 16 kHz mono on the main thread before passing to the worker
- **No backend:** 100% static SPA, deployable to any CDN

> **Note on transcription timing:** `@huggingface/transformers` v4 does not expose per-chunk callbacks for the ASR pipeline. Segments arrive all at once after the full inference completes. The animated progress bar reflects this: it runs indeterminate while Whisper processes, then the full transcript appears when done.
