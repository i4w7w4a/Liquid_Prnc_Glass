import { useEffect, useRef } from 'react'
import { WebGLVideoEdgeGlassRenderer } from './WebGLVideoEdgeGlassRenderer'
import type { LiquidGlassSettings } from './settings'

type WebGLVideoEdgeGlassProps = {
  className?: string
  poster: string
  settings: LiquidGlassSettings
  src: string
}

export function WebGLVideoEdgeGlass({ className, poster, settings, src }: WebGLVideoEdgeGlassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const initialSettingsRef = useRef(settings)
  const rendererRef = useRef<WebGLVideoEdgeGlassRenderer | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) {
      return undefined
    }

    const renderer = new WebGLVideoEdgeGlassRenderer({
      canvas,
      settings: initialSettingsRef.current,
      video,
    })
    rendererRef.current = renderer
    renderer.start()

    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [src])

  useEffect(() => {
    rendererRef.current?.updateSettings(settings)
  }, [settings])

  return (
    <div className={`webgl-video-edge-glass${className ? ` ${className}` : ''}`}>
      <video
        aria-hidden="true"
        className="webgl-video-edge-glass__source"
        data-webgl-video-source="demo"
        loop
        muted
        playsInline
        poster={poster}
        preload="auto"
        ref={videoRef}
        src={src}
      />
      <canvas
        aria-hidden="true"
        className="webgl-video-edge-glass__canvas"
        data-webgl-video-edge-glass="sdf-refraction"
        ref={canvasRef}
      />
    </div>
  )
}
