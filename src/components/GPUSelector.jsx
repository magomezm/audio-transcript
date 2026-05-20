const BASE_OPTIONS = [
  { value: 'high-performance', label: 'High Performance' },
  { value: 'low-power',        label: 'Low Power (integrated)' },
  { value: 'auto',             label: 'Auto (browser default)' },
  { value: 'cpu',              label: 'CPU only (no GPU)' },
]

export function GPUSelector({ gpuPreference, onGpuPreferenceChange, disabled, gpuInfo }) {
  // Build labels enriched with real GPU names once probe completes
  const options = BASE_OPTIONS.map((opt) => {
    if (opt.value === 'high-performance' && gpuInfo?.highPerformance)
      return { ...opt, label: `High Performance · ${gpuInfo.highPerformance}` }
    if (opt.value === 'low-power' && gpuInfo?.lowPower)
      return { ...opt, label: `Low Power · ${gpuInfo.lowPower}` }
    return opt
  })

  // Chrome pins WebGPU to its GPU process — powerPreference hints may be ignored
  const sameGpu =
    gpuInfo?.highPerformance &&
    gpuInfo?.lowPower &&
    gpuInfo.highPerformance === gpuInfo.lowPower

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: '#13131a' }}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {sameGpu && (
        <p style={{ fontSize: '11px', color: 'rgba(251,191,36,0.6)', lineHeight: 1.5 }}>
          Chrome está usando <strong style={{ color: 'rgba(251,191,36,0.85)' }}>{gpuInfo.highPerformance}</strong> para
          todos los adaptadores WebGPU. Para usar tu Nvidia, abre{' '}
          <strong style={{ color: 'rgba(251,191,36,0.85)' }}>Configuración de Windows → Sistema → Pantalla → Configuración de gráficos</strong>,
          añade Chrome y selecciona «Alto rendimiento».
        </p>
      )}
    </div>
  )
}
