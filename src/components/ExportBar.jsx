import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { segmentsToTxt, segmentsToSrt } from '../lib/exporters'

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportBar({ segments }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(segmentsToTxt(segments))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleTxt() {
    downloadBlob(segmentsToTxt(segments), 'transcript.txt', 'text/plain')
  }

  function handleSrt() {
    downloadBlob(segmentsToSrt(segments), 'transcript.srt', 'text/plain')
  }

  const btnBase =
    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors'

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleCopy}
        className={`${btnBase} bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10`}
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button
        onClick={handleTxt}
        className={`${btnBase} bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10`}
      >
        <Download size={14} />
        TXT
      </button>
      <button
        onClick={handleSrt}
        className={`${btnBase} bg-violet-600 hover:bg-violet-500 text-white`}
      >
        <Download size={14} />
        SRT
      </button>
    </div>
  )
}
