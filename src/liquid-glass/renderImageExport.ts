import type { LiquidGlassSource } from './WebGLVideoEdgeGlass'
import { WebGLVideoEdgeGlassRenderer } from './WebGLVideoEdgeGlassRenderer'
import { resolveRenderExportSize } from './renderExport'
import type { RenderExportSizePreset } from './renderExport'
import type { LiquidGlassSettings } from './settings'
import type { SourceSize } from './sourceLayout'

type RenderImageExportOptions = {
  settings: LiquidGlassSettings
  sizePreset: RenderExportSizePreset
  source: LiquidGlassSource
  sourceNaturalSize: SourceSize
  timeSeconds?: number
}

function waitForImageLoad(image: HTMLImageElement) {
  if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image source failed to load for PNG render export'))
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

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG render finished without an image blob'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}

export async function renderImageExport({
  settings,
  sizePreset,
  source,
  sourceNaturalSize,
  timeSeconds = 0,
}: RenderImageExportOptions) {
  if (source.kind !== 'image') {
    throw new Error('PNG render export requires an image source')
  }

  const outputSize = resolveRenderExportSize(sizePreset, sourceNaturalSize)
  const canvas = createRenderCanvas(outputSize)
  const image = document.createElement('img')

  image.decoding = 'async'
  image.src = source.src
  await waitForImageLoad(image)

  const renderer = new WebGLVideoEdgeGlassRenderer({
    autoResize: false,
    canvas,
    fixedPixelRatio: 1,
    preserveDrawingBuffer: true,
    settings,
    source: image,
    sourceNaturalSize,
  })

  try {
    renderer.resizeTo(outputSize)
    renderer.renderFrame(timeSeconds)

    return await canvasToPngBlob(canvas)
  } finally {
    renderer.dispose()
    canvas.remove()
  }
}
