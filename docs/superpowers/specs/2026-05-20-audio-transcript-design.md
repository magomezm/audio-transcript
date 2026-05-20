# Audio Transcript — Design Spec
**Date:** 2026-05-20  
**Status:** Approved

## Overview

A client-side web application for transcribing audio and video files directly in the browser, using Whisper via WebGPU acceleration. No server required, no data leaves the user's device. Built with React 19 + Vite 6.

---

## 1. Architecture

```
React + Vite (SPA, static deploy)
│
├── UI Thread (React)
│   ├── InputPanel       — file drop zone + direct URL input
│   ├── LanguageSelector — source language + translate-to-English toggle
│   ├── ProgressBar      — model loading + transcription progress
│   ├── TranscriptViewer — real-time streaming segments with timestamps
│   └── ExportBar        — copy / download TXT / download SRT
│
└── Web Worker (whisper.worker.js)
    ├── @huggingface/transformers v3 (WebGPU backend, WASM fallback)
    ├── Model: whisper-base multilingual
    ├── Decodes audio via AudioContext → Float32Array
    └── Emits messages: progress, segment, done, error
```

**Stack:**
- React 19 + Vite 6
- `@huggingface/transformers` v3 (WebGPU + WASM backends)
- Tailwind CSS v4
- `lucide-react` for icons

---

## 2. Input

### File upload
- Drag & drop zone or click-to-browse
- Accepted formats: MP3, MP4, WAV, M4A, WebM, OGG, FLAC
- Size warning shown for files > 2 GB before processing starts

### URL input
- Direct audio/video URLs (ending in `.mp3`, `.mp4`, `.wav`, etc.)
- URLs subject to browser CORS — clear error shown if inaccessible
- YouTube and other streaming platforms: out of scope for v1

---

## 3. Language Options

Displayed between the input zone and the start button:

**Source language selector** (dropdown)
- Default: `Auto-detect`
- Options: Spanish, English, French, German, Italian, Portuguese, Dutch, Russian, Chinese (Simplified), Japanese, Korean, Arabic, Hindi, Turkish, Polish, Swedish, Danish, Norwegian, Finnish, Ukrainian
- Maps to Whisper's `language` parameter to override auto-detection
- Useful when auto-detection fails or is slow

**Translate to English** (toggle)
- Activates Whisper's `task="translate"` — native translation to English
- Disabled when source language is already set to English
- Note: Whisper only natively supports translation TO English; other target languages are out of scope for v1

---

## 4. Transcription Worker

**Messages from worker to UI:**
```js
{ type: 'model-progress', value: 0–100 }      // model download/load
{ type: 'transcript-progress', value: 0–100 } // transcription progress
{ type: 'segment', data: { start, end, text } } // real-time segment
{ type: 'done', language: 'es' }               // finished, detected language
{ type: 'error', message: string }             // error description
```

**Messages from UI to worker:**
```js
{ type: 'transcribe', audio: Float32Array, language: string|null, translate: boolean }
{ type: 'cancel' }
```

Model is cached in IndexedDB after first load — subsequent uses are fast.

---

## 5. UI/UX

**Theme:** Dark mode only. Background `#0a0a0f` with subtle radial gradient (purple/blue). Glassmorphism panels with `backdrop-filter: blur`.

**WebGPU badge** in header:
- Green "WebGPU ✓" if available
- Amber "CPU mode" if WebGPU unavailable (WASM fallback active)

**Layout (single page, vertical scroll):**
```
┌─────────────────────────────────────────────┐
│  🎙 AudioScribe              [WebGPU ✓]     │  ← minimal header
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │  Drag & drop audio/video here       │    │  ← animated dashed border
│  │  or click to browse                 │    │
│  │  ── or ──                           │    │
│  │  [ https://...  URL  ] [→]          │    │
│  └─────────────────────────────────────┘    │
│  Formatos: MP3 · MP4 · WAV · M4A · WebM    │
│                                             │
│  [🌍 Auto-detect ▾]  [🔄 Traducir a inglés]│  ← language controls
│                                             │
├─────────────────────────────────────────────┤
│  [██████████░░░░░░] 58%  Loading model...   │  ← progress bar
│  🌍 Detected language: Spanish              │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 00:00  Hola, buenos días a todos... │    │  ← streaming segments
│  │ 00:08  Hoy vamos a revisar el Q3... │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [📋 Copy]  [⬇ TXT]  [⬇ SRT]              │  ← export bar
└─────────────────────────────────────────────┘
```

**Visual details:**
- Drop zone: animated dashed border that glows on hover/drag
- Progress bar: gradient animation (purple → blue)
- Transcript: monospace font, smooth scroll, timestamps in muted gray
- Segments appear progressively as transcription runs

---

## 6. State Shape (`useWhisper` hook)

```js
{
  status: 'idle' | 'loading-model' | 'transcribing' | 'done' | 'error',
  modelProgress: 0–100,
  transcriptProgress: 0–100,
  segments: [{ start: number, end: number, text: string }],
  detectedLanguage: string | null,
  sourceLanguage: 'auto' | 'es' | 'en' | 'fr' | ..., // overrides Whisper auto-detect
  translateToEnglish: boolean,
  error: string | null
}
```

---

## 7. Export Formats

**TXT:** Plain text, one segment per line, no timestamps.

**SRT:**
```
1
00:00:00,000 --> 00:00:08,000
Hola, buenos días a todos.

2
00:00:08,000 --> 00:00:15,000
Hoy vamos a revisar el Q3.
```

**Copy to clipboard:** Full plain text via `navigator.clipboard.writeText`.

---

## 8. Error Handling

| Situation | Behavior |
|---|---|
| URL inaccessible / CORS | "URL not accessible from the browser — try a direct file link" |
| Unsupported format | "Unsupported format — try MP3, MP4, or WAV" |
| File > 2 GB | Warning shown before processing, user can proceed |
| Model load error | "Error loading model" + Retry button |
| WebGPU crash mid-process | Automatic fallback to CPU + amber warning banner |
| Worker error | Error message displayed inline, reset button shown |

---

## 9. File Structure

```
audio-transcript/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── workers/
│   │   └── whisper.worker.js
│   ├── components/
│   │   ├── InputPanel.jsx
│   │   ├── LanguageSelector.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── TranscriptViewer.jsx
│   │   └── ExportBar.jsx
│   ├── hooks/
│   │   └── useWhisper.js
│   └── lib/
│       └── exporters.js
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-20-audio-transcript-design.md
```

---

## 10. Out of Scope (v1)

- YouTube / streaming platform URLs (requires proxy)
- Translation to languages other than English
- Speaker diarization (who said what)
- Timestamps word-level (only segment-level)
- Mobile-optimized layout
- PWA / offline install
