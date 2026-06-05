import { describe, expect, it } from 'vitest'
import {
  buildRenderFrameTimeline,
  buildRenderImageFilename,
  buildRenderMp4Filename,
  getMp4RenderAvailability,
  normalizeRenderExportDuration,
  normalizeRenderExportFps,
  resolveRenderExportBitrate,
  resolveRenderExportSize,
} from './renderExport'

describe('render export helpers', () => {
  it('normalizes export duration and fps to deliberate render bounds', () => {
    expect(normalizeRenderExportDuration(0.2)).toBe(1)
    expect(normalizeRenderExportDuration(90)).toBe(30)
    expect(normalizeRenderExportDuration(Number.NaN)).toBe(6)
    expect(normalizeRenderExportFps(12)).toBe(24)
    expect(normalizeRenderExportFps(72)).toBe(60)
  })

  it('resolves even output sizes for encoder-safe renders', () => {
    expect(resolveRenderExportSize('720p', { height: 1081, width: 1919 })).toEqual({
      height: 720,
      width: 1280,
    })
    expect(resolveRenderExportSize('1080p', { height: 720, width: 1280 })).toEqual({
      height: 1080,
      width: 1920,
    })
    expect(resolveRenderExportSize('source', { height: 719, width: 1279 })).toEqual({
      height: 718,
      width: 1278,
    })
  })

  it('builds exact frame timestamps for deterministic offline render', () => {
    const timeline = buildRenderFrameTimeline({ durationSeconds: 1, fps: 24 })

    expect(timeline).toHaveLength(24)
    expect(timeline[0]).toEqual({
      durationUs: 41667,
      index: 0,
      timeSeconds: 0,
      timestampUs: 0,
    })
    expect(timeline[23]?.timestampUs).toBe(958333)
  })

  it('resolves high-quality bitrate by render size and fps', () => {
    expect(resolveRenderExportBitrate({ fps: 30, height: 1080, width: 1920 })).toBe(18_000_000)
    expect(resolveRenderExportBitrate({ fps: 24, height: 720, width: 1280 })).toBe(8_000_000)
  })

  it('builds an mp4 filename for render exports', () => {
    expect(buildRenderMp4Filename(new Date(2026, 5, 5, 2, 30, 45))).toBe(
      'liquid-prnc-glass-render-2026-06-05-02-30-45.mp4',
    )
  })

  it('builds a png filename for still image render exports', () => {
    expect(buildRenderImageFilename(new Date(2026, 5, 5, 2, 30, 45))).toBe(
      'liquid-prnc-glass-render-2026-06-05-02-30-45.png',
    )
  })

  it('explains when MP4 render needs HTTPS instead of reporting a generic failure', () => {
    expect(getMp4RenderAvailability({ hasVideoEncoder: false, isSecureContext: false })).toBe(
      'needs-https',
    )
    expect(getMp4RenderAvailability({ hasVideoEncoder: true, isSecureContext: false })).toBe(
      'needs-https',
    )
    expect(getMp4RenderAvailability({ hasVideoEncoder: false, isSecureContext: true })).toBe(
      'unsupported',
    )
    expect(getMp4RenderAvailability({ hasVideoEncoder: true, isSecureContext: true })).toBe('ready')
  })
})
