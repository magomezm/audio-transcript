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
