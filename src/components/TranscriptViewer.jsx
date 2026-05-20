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
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [segments.length])

  if (segments.length === 0) return null

  const langName = detectedLanguage ? LANGUAGE_MAP[detectedLanguage] || detectedLanguage : null

  return (
    <div className="space-y-3">
      {langName && (
        <p className="text-sm text-slate-400">
          Detected language: <span className="text-violet-400">{langName}</span>
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
