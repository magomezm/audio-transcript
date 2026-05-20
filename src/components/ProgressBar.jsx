export function ProgressBar({ status, modelProgress }) {
  if (status === 'idle' || status === 'done' || status === 'error') return null

  if (status === 'transcribing') {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Transcribing…</span>
          <span className="text-slate-500 font-mono text-xs">running</span>
        </div>
        <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            data-testid="transcribing-bar"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40%',
              height: '100%',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, transparent, #7c3aed, #3b82f6, transparent)',
              animation: 'whisper-scan 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    )
  }

  // status === 'loading-model'
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-400">Loading model…</span>
        <span className="text-violet-400 font-mono font-medium">{modelProgress}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${modelProgress}%`,
            background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
          }}
        />
      </div>
    </div>
  )
}
