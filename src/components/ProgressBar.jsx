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
