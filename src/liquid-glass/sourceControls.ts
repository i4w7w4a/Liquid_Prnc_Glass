import type { LiquidGlassSource } from './WebGLVideoEdgeGlass'

export type DemoGlassSourceMode = 'motion' | 'still'
export type DemoGlassSourceState = DemoGlassSourceMode | 'custom'

type DemoGlassSourceAssets = {
  motionSrc: string
  posterSrc: string
}

export function buildDemoGlassSource({
  mode,
  motionSrc,
  posterSrc,
}: DemoGlassSourceAssets & { mode: DemoGlassSourceMode }): LiquidGlassSource {
  if (mode === 'still') {
    return {
      kind: 'image',
      name: 'Demo still',
      src: posterSrc,
    }
  }

  return {
    kind: 'video',
    name: 'Demo source',
    poster: posterSrc,
    src: motionSrc,
  }
}

export function getDemoGlassSourceMode(
  source: LiquidGlassSource,
  { motionSrc, posterSrc }: DemoGlassSourceAssets,
): DemoGlassSourceState {
  if (source.kind === 'video' && source.src === motionSrc) {
    return 'motion'
  }

  if (source.kind === 'image' && source.src === posterSrc) {
    return 'still'
  }

  return 'custom'
}
