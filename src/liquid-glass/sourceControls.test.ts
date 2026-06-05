import { describe, expect, it } from 'vitest'
import {
  buildDemoGlassSource,
  getDemoGlassSourceMode,
} from './sourceControls'

const demoAssets = {
  motionSrc: '/demo.web.mp4',
  posterSrc: '/demo-poster.png',
}

describe('source controls', () => {
  it('builds the moving starter demo from the motion asset', () => {
    expect(buildDemoGlassSource({ ...demoAssets, mode: 'motion' })).toEqual({
      kind: 'video',
      name: 'Demo source',
      poster: '/demo-poster.png',
      src: '/demo.web.mp4',
    })
  })

  it('builds the still starter demo from the poster asset to stop motion decoding', () => {
    expect(buildDemoGlassSource({ ...demoAssets, mode: 'still' })).toEqual({
      kind: 'image',
      name: 'Demo still',
      src: '/demo-poster.png',
    })
  })

  it('distinguishes starter demo sources from uploaded custom sources', () => {
    expect(getDemoGlassSourceMode(buildDemoGlassSource({ ...demoAssets, mode: 'motion' }), demoAssets)).toBe(
      'motion',
    )
    expect(getDemoGlassSourceMode(buildDemoGlassSource({ ...demoAssets, mode: 'still' }), demoAssets)).toBe(
      'still',
    )
    expect(getDemoGlassSourceMode({ kind: 'image', name: 'Upload', src: 'blob:custom' }, demoAssets)).toBe(
      'custom',
    )
  })
})
