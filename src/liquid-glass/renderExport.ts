import type { SourceSize } from './sourceLayout'

export type RenderExportSizePreset = '720p' | '1080p' | 'source'
export type Mp4RenderAvailability = 'needs-https' | 'ready' | 'unsupported'

export type RenderFrameTiming = {
  durationUs: number
  index: number
  timeSeconds: number
  timestampUs: number
}

const defaultRenderDuration = 6
const maxRenderDuration = 30
const minRenderDuration = 1
const defaultRenderFps = 30
const maxRenderFps = 60
const minRenderFps = 24

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function evenDimension(value: number) {
  return Math.max(2, Math.floor(value / 2) * 2)
}

function padTimestampPart(value: number) {
  return value.toString().padStart(2, '0')
}

export function normalizeRenderExportDuration(value: number) {
  if (!Number.isFinite(value)) {
    return defaultRenderDuration
  }

  return clamp(Number(value.toFixed(2)), minRenderDuration, maxRenderDuration)
}

export function normalizeRenderExportFps(value: number) {
  if (!Number.isFinite(value)) {
    return defaultRenderFps
  }

  return clamp(Math.round(value), minRenderFps, maxRenderFps)
}

export function resolveRenderExportSize(preset: RenderExportSizePreset, sourceSize: SourceSize): SourceSize {
  if (preset === '720p') {
    return { width: 1280, height: 720 }
  }

  if (preset === '1080p') {
    return { width: 1920, height: 1080 }
  }

  return {
    height: evenDimension(sourceSize.height),
    width: evenDimension(sourceSize.width),
  }
}

export function buildRenderFrameTimeline({
  durationSeconds,
  fps,
}: {
  durationSeconds: number
  fps: number
}): RenderFrameTiming[] {
  const safeDuration = normalizeRenderExportDuration(durationSeconds)
  const safeFps = normalizeRenderExportFps(fps)
  const frameCount = Math.ceil(safeDuration * safeFps)
  const totalDurationUs = Math.round(safeDuration * 1_000_000)

  return Array.from({ length: frameCount }, (_, index) => {
    const timestampUs = Math.round((index * 1_000_000) / safeFps)
    const nextTimestampUs =
      index === frameCount - 1 ? totalDurationUs : Math.round(((index + 1) * 1_000_000) / safeFps)

    return {
      durationUs: Math.max(1, nextTimestampUs - timestampUs),
      index,
      timeSeconds: timestampUs / 1_000_000,
      timestampUs,
    }
  })
}

export function resolveRenderExportBitrate({
  fps,
  height,
  width,
}: {
  fps: number
  height: number
  width: number
}) {
  const megapixels = (width * height) / 1_000_000
  const normalizedFps = normalizeRenderExportFps(fps)
  const targetBitrate = Math.round((megapixels * normalizedFps * 290_000) / 1_000_000) * 1_000_000

  return clamp(targetBitrate, 8_000_000, 45_000_000)
}

export function buildRenderMp4Filename(date: Date) {
  const stamp = [
    date.getFullYear(),
    padTimestampPart(date.getMonth() + 1),
    padTimestampPart(date.getDate()),
    padTimestampPart(date.getHours()),
    padTimestampPart(date.getMinutes()),
    padTimestampPart(date.getSeconds()),
  ].join('-')

  return `liquid-prnc-glass-render-${stamp}.mp4`
}

export function buildRenderImageFilename(date: Date) {
  const stamp = [
    date.getFullYear(),
    padTimestampPart(date.getMonth() + 1),
    padTimestampPart(date.getDate()),
    padTimestampPart(date.getHours()),
    padTimestampPart(date.getMinutes()),
    padTimestampPart(date.getSeconds()),
  ].join('-')

  return `liquid-prnc-glass-render-${stamp}.png`
}

export function getMp4RenderAvailability({
  hasVideoEncoder,
  isSecureContext,
}: {
  hasVideoEncoder: boolean
  isSecureContext: boolean
}): Mp4RenderAvailability {
  if (!isSecureContext) {
    return 'needs-https'
  }

  if (hasVideoEncoder) {
    return 'ready'
  }

  return 'unsupported'
}
