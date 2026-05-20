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
