import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { WebGLVideoEdgeGlassRenderer } from './WebGLVideoEdgeGlassRenderer'
import type { LiquidGlassSettings } from './settings'
import { resolveNaturalSourceSize } from './sourceLayout'
import type { SourceSize } from './sourceLayout'

export type LiquidGlassSource = {
  kind: 'image' | 'video'
  name: string
  poster?: string
  src: string
}

type WebGLVideoEdgeGlassProps = {
  className?: string
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void
  onDurationChange?: (durationSeconds: number | null) => void
  onNaturalSizeChange?: (size: SourceSize) => void
  settings: LiquidGlassSettings
  source: LiquidGlassSource
  sourceNaturalSize: SourceSize
  style?: CSSProperties
}

export function WebGLVideoEdgeGlass({
  className,
  onCanvasReady,
  onDurationChange,
  onNaturalSizeChange,
  settings,
  source,
  sourceNaturalSize,
  style,
}: WebGLVideoEdgeGlassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const rendererRef = useRef<WebGLVideoEdgeGlassRenderer | null>(null)
  const settingsRef = useRef(settings)
  const sourceKey = `${source.kind}:${source.src}`
  const [readySourceKey, setReadySourceKey] = useState<string | null>(null)
  const sourceReady = readySourceKey === sourceKey
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    settingsRef.current = settings
    rendererRef.current?.updateSettings(settings)
  }, [settings])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    onCanvasReady?.(canvas)

    return () => onCanvasReady?.(null)
  }, [onCanvasReady])

  useEffect(() => {
    const canvas = canvasRef.current
    const sourceElement = source.kind === 'video' ? videoRef.current : imageRef.current

    if (!canvas || !sourceElement || !sourceReady) {
      return undefined
    }

    const renderer = new WebGLVideoEdgeGlassRenderer({
      canvas,
      settings: settingsRef.current,
      source: sourceElement,
      sourceNaturalSize,
    })
    rendererRef.current = renderer
    renderer.start()

    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [source.kind, source.src, sourceReady])

  useEffect(() => {
    rendererRef.current?.updateSourceNaturalSize(sourceNaturalSize)
  }, [sourceNaturalSize])

  const publishImageSize = () => {
    const image = imageRef.current

    if (!image) {
      return
    }

    onNaturalSizeChange?.(
      resolveNaturalSourceSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      }),
    )
    onDurationChange?.(null)
    setReadySourceKey(sourceKey)
  }

  const publishVideoMetadata = () => {
    const video = videoRef.current

    if (!video) {
      return
    }

    onNaturalSizeChange?.(
      resolveNaturalSourceSize({
        width: video.videoWidth,
        height: video.videoHeight,
      }),
    )
    onDurationChange?.(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null)
  }

  return (
    <div className={`webgl-video-edge-glass${className ? ` ${className}` : ''}`} style={style}>
      {source.kind === 'video' ? (
        <video
          aria-hidden="true"
          className="webgl-video-edge-glass__source"
          data-webgl-source-kind={source.kind}
          loop
          muted
          onLoadedData={() => setReadySourceKey(sourceKey)}
          onLoadedMetadata={publishVideoMetadata}
          playsInline
          poster={source.poster}
          preload="auto"
          ref={videoRef}
          src={source.src}
        />
      ) : (
        <img
          alt=""
          aria-hidden="true"
          className="webgl-video-edge-glass__source"
          data-webgl-source-kind={source.kind}
          onLoad={publishImageSize}
          ref={imageRef}
          src={source.src}
        />
      )}
      <canvas
        aria-hidden="true"
        className="webgl-video-edge-glass__canvas"
        data-webgl-video-edge-glass="sdf-refraction"
        ref={canvasRef}
      />
    </div>
  )
}
