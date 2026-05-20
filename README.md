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

- **UI thread:** React 19 + Vite, Tailwind CSS v4
- **Web Worker:** `@huggingface/transformers` v3 runs Whisper inference off the main thread
- **Audio decoding:** OfflineAudioContext resamples to 16 kHz mono before passing to the worker
- **No backend:** 100% static SPA, deployable to any CDN
