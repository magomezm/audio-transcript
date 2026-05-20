function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.min(999, Math.round((seconds % 1) * 1000))
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':') + ',' + String(ms).padStart(3, '0')
}

export function segmentsToTxt(segments) {
  return segments.map(s => s.text).join('\n')
}

export function segmentsToSrt(segments) {
  if (segments.length === 0) return ''
  return segments
    .map((seg, i) =>
      `${i + 1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text}`
    )
    .join('\n\n')
}
