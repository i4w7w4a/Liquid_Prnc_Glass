import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
} from 'mediabunny'
import type { LiquidGlassSource } from './WebGLVideoEdgeGlass'
import { WebGLVideoEdgeGlassRenderer } from './WebGLVideoEdgeGlassRenderer'
import type { LiquidGlassSettings } from './settings'
import type { SourceSize } from './sourceLayout'
import {
  buildRenderFrameTimeline,
  normalizeRenderExportDuration,
  normalizeRenderExportFps,
  resolveRenderExportBitrate,
  resolveRenderExportSize,
} from './renderExport'
import type { RenderExportSizePreset } from './renderExport'

type RenderMp4ExportOptions = {
  durationSeconds: number
  fps: number
  onProgress?: (progress: number) => void
  settings: LiquidGlassSettings
  sizePreset: RenderExportSizePreset
  source: LiquidGlassSource
  sourceNaturalSize: SourceSize
}

type RenderSourceElement = HTMLImageElement | HTMLVideoElement

function assertRenderSupport() {
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('WebCodecs VideoEncoder is not available in this browser')
  }
}

function waitForImageLoad(image: HTMLImageElement) {
  if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image source failed to load for render export'))
  })
}

function waitForVideoMetadata(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA && Number.isFinite(video.duration)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('Motion source failed to load for render export'))
  })
}

function createRenderCanvas(size: SourceSize) {
  const canvas = document.createElement('canvas')

  canvas.width = size.width
  canvas.height = size.height
  canvas.style.position = 'fixed'
  canvas.style.left = '-100000px'
  canvas.style.top = '0'
  canvas.style.width = `${size.width}px`
  canvas.style.height = `${size.height}px`
  canvas.style.pointerEvents = 'none'
  canvas.style.visibility = 'hidden'
  document.body.appendChild(canvas)

  return canvas
}

async function createRenderSource(source: LiquidGlassSource): Promise<RenderSourceElement> {
  if (source.kind === 'image') {
    const image = document.createElement('img')

    image.decoding = 'async'
    image.src = source.src
    await waitForImageLoad(image)

    return image
  }

  const video = document.createElement('video')

  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = source.src
  await waitForVideoMetadata(video)

  return video
}

function seekVideo(video: HTMLVideoElement, timeSeconds: number) {
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
  const targetTime = duration > 0 ? Math.min(duration - 0.001, timeSeconds % duration) : 0

  if (Math.abs(video.currentTime - targetTime) < 0.001 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('error', handleError)
    }
    const handleSeeked = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('Motion source seek failed during render export'))
    }

    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('error', handleError)
    video.currentTime = targetTime
  })
}

export async function renderMp4Export({
  durationSeconds,
  fps,
  onProgress,
  settings,
  sizePreset,
  source,
  sourceNaturalSize,
}: RenderMp4ExportOptions) {
  assertRenderSupport()

  const safeFps = normalizeRenderExportFps(fps)
  const safeDuration = normalizeRenderExportDuration(durationSeconds)
  const outputSize = resolveRenderExportSize(sizePreset, sourceNaturalSize)
  const timeline = buildRenderFrameTimeline({
    durationSeconds: safeDuration,
    fps: safeFps,
  })
  const canvas = createRenderCanvas(outputSize)
  const renderSource = await createRenderSource(source)
  const renderer = new WebGLVideoEdgeGlassRenderer({
    canvas,
    settings,
    source: renderSource,
    sourceNaturalSize,
  })

  try {
    renderer.resizeTo(outputSize)

    const target = new BufferTarget()
    const output = new Output({
      format: new Mp4OutputFormat(),
      target,
    })
    const canvasSource = new CanvasSource(canvas, {
      bitrate: resolveRenderExportBitrate({
        fps: safeFps,
        height: outputSize.height,
        width: outputSize.width,
      }),
      codec: 'avc',
      keyFrameInterval: 1,
      sizeChangeBehavior: 'deny',
    })

    output.addVideoTrack(canvasSource, {
      frameRate: safeFps,
    })
    await output.start()

    for (const frame of timeline) {
      if (renderSource instanceof HTMLVideoElement) {
        await seekVideo(renderSource, frame.timeSeconds)
      }

      renderer.renderFrame(frame.timeSeconds)
      await canvasSource.add(frame.timestampUs / 1_000_000, frame.durationUs / 1_000_000, {
        keyFrame: frame.index % safeFps === 0,
      })
      onProgress?.((frame.index + 1) / timeline.length)
    }

    await output.finalize()

    if (!target.buffer) {
      throw new Error('MP4 render finished without a file buffer')
    }

    return new Blob([target.buffer], { type: 'video/mp4' })
  } finally {
    renderer.dispose()
    canvas.remove()
  }
}
