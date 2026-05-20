import { describe, it, expect } from 'vitest'
import { segmentsToTxt, segmentsToSrt } from './exporters'

const SEGMENTS = [
  { start: 0, end: 8.5, text: 'Hello, good morning everyone.' },
  { start: 8.5, end: 15.2, text: "Today we'll review Q3." },
  { start: 15.2, end: 23.0, text: 'First item on the agenda.' },
]

describe('segmentsToTxt', () => {
  it('joins segment texts with newlines', () => {
    const result = segmentsToTxt(SEGMENTS)
    expect(result).toBe(
      "Hello, good morning everyone.\nToday we'll review Q3.\nFirst item on the agenda."
    )
  })

  it('returns empty string for empty segments', () => {
    expect(segmentsToTxt([])).toBe('')
  })
})

describe('segmentsToSrt', () => {
  it('formats SRT with 1-based index, timestamps, and text', () => {
    const result = segmentsToSrt(SEGMENTS)
    const blocks = result.split('\n\n')
    expect(blocks).toHaveLength(3)
    expect(blocks[0]).toBe(
      '1\n00:00:00,000 --> 00:00:08,500\nHello, good morning everyone.'
    )
    expect(blocks[1]).toBe(
      "2\n00:00:08,500 --> 00:00:15,200\nToday we'll review Q3."
    )
  })

  it('formats hours correctly for long audio', () => {
    const seg = [{ start: 3661.5, end: 3670.0, text: 'Late segment.' }]
    const result = segmentsToSrt(seg)
    expect(result).toContain('01:01:01,500 --> 01:01:10,000')
  })

  it('returns empty string for empty segments', () => {
    expect(segmentsToSrt([])).toBe('')
  })
})
