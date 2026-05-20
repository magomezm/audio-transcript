import { Mic, Cpu, Zap } from 'lucide-react'
import { useWhisper } from './hooks/useWhisper'
import { InputPanel } from './components/InputPanel'
import { LanguageSelector } from './components/LanguageSelector'
import { ProgressBar } from './components/ProgressBar'
import { TranscriptViewer } from './components/TranscriptViewer'
import { ExportBar } from './components/ExportBar'

function WebGpuBadge({ device }) {
  if (!device) return null
  const isGpu = device === 'webgpu'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        background: isGpu ? 'rgba(124,58,237,0.15)' : 'rgba(245,158,11,0.15)',
        border: `1px solid ${isGpu ? 'rgba(124,58,237,0.4)' : 'rgba(245,158,11,0.4)'}`,
        color: isGpu ? '#a78bfa' : '#fbbf24',
      }}
    >
      {isGpu ? <Zap size={12} /> : <Cpu size={12} />}
      {isGpu ? 'WebGPU ✓' : 'CPU mode'}
    </span>
  )
}

export default function App() {
  const whisper = useWhisper()
  const isWorking = whisper.status === 'loading-model' || whisper.status === 'transcribing'
  const hasResults = whisper.segments.length > 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(10,10,15,0.8)',
        }}
      >
        <div className="flex items-center gap-2">
          <Mic size={20} className="text-violet-400" />
          <span className="text-white font-semibold text-lg tracking-tight">AudioScribe</span>
        </div>
        <WebGpuBadge device={whisper.device} />
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Error banner */}
        {whisper.status === 'error' && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p className="text-red-300 text-sm">{whisper.error}</p>
            <button
              onClick={whisper.reset}
              className="text-xs text-red-400 hover:text-red-200 underline ml-4"
            >
              Reset
            </button>
          </div>
        )}

        {/* Input + language controls (hidden while working or done) */}
        {(whisper.status === 'idle' || whisper.status === 'error') && (
          <section className="space-y-5">
            <InputPanel onSource={whisper.start} disabled={isWorking} />
            <LanguageSelector
              sourceLanguage={whisper.sourceLanguage}
              translateToEnglish={whisper.translateToEnglish}
              onSourceLanguageChange={whisper.setSourceLanguage}
              onTranslateChange={whisper.setTranslateToEnglish}
              disabled={isWorking}
            />
          </section>
        )}

        {/* Progress bar */}
        {isWorking && (
          <section
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <ProgressBar
              status={whisper.status}
              modelProgress={whisper.modelProgress}
              transcriptProgress={whisper.transcriptProgress}
            />
          </section>
        )}

        {/* Live transcript (visible during transcription and after done) */}
        {(isWorking || whisper.status === 'done') && hasResults && (
          <section className="space-y-4">
            <TranscriptViewer
              segments={whisper.segments}
              detectedLanguage={whisper.detectedLanguage}
            />
          </section>
        )}

        {/* Export controls (only when done) */}
        {whisper.status === 'done' && hasResults && (
          <section className="space-y-4">
            <ExportBar segments={whisper.segments} />
            <button
              onClick={whisper.reset}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline"
            >
              Transcribe another file
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
