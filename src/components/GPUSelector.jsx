const GPU_OPTIONS = [
  { value: 'auto',             label: 'Auto (browser default)' },
  { value: 'high-performance', label: 'High performance (Nvidia)' },
  { value: 'low-power',        label: 'Low power (integrated)' },
  { value: 'cpu',              label: 'CPU only (no GPU)' },
]

export function GPUSelector({ gpuPreference, onGpuPreferenceChange, disabled }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-500 shrink-0">GPU</span>
      <select
        value={gpuPreference}
        onChange={(e) => onGpuPreferenceChange(e.target.value)}
        disabled={disabled}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '5px 10px',
          color: '#cbd5e1',
          fontSize: '13px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
          width: '100%',
        }}
      >
        {GPU_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#13131a' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
