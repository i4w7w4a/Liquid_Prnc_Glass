import { describe, expect, it } from 'vitest'
import {
  buildRecordingOptionCandidates,
  buildRecordingExportFilename,
  chooseSupportedRecordingMimeType,
  getRecordingExtension,
  normalizeRecordingFps,
} from './recordingExport'

describe('recording export helpers', () => {
  it('chooses the first supported recording mime type', () => {
    const mimeType = chooseSupportedRecordingMimeType((candidate) =>
      candidate === 'video/webm;codecs=vp9',
    )

    expect(mimeType).toBe('video/webm;codecs=vp9')
  })

  it('falls back to webm when the browser does not report support', () => {
    const mimeType = chooseSupportedRecordingMimeType(() => false)

    expect(mimeType).toBe('video/webm')
  })

  it('clamps recording fps to a practical browser range', () => {
    expect(normalizeRecordingFps(8)).toBe(12)
    expect(normalizeRecordingFps(72)).toBe(60)
    expect(normalizeRecordingFps(Number.NaN)).toBe(30)
  })

  it('keeps fallback recorder options after the preferred mime type', () => {
    expect(buildRecordingOptionCandidates('video/webm;codecs=vp9', 5_000_000)).toEqual([
      { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 5_000_000 },
      { videoBitsPerSecond: 5_000_000 },
      {},
    ])
  })

  it('maps recording mime types to download extensions', () => {
    expect(getRecordingExtension('video/mp4;codecs=h264')).toBe('mp4')
    expect(getRecordingExtension('video/webm;codecs=vp9')).toBe('webm')
  })

  it('builds a stable export filename', () => {
    const filename = buildRecordingExportFilename(new Date(2026, 5, 5, 2, 30, 45), 'video/webm')

    expect(filename).toBe('liquid-prnc-glass-2026-06-05-02-30-45.webm')
  })
})
