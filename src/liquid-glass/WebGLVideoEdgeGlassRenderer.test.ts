import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const rendererSource = readFileSync(new URL('./WebGLVideoEdgeGlassRenderer.ts', import.meta.url), 'utf8')

describe('WebGL video edge glass renderer shader contract', () => {
  it('uses Three output encoding without duplicating colorspace pars functions', () => {
    expect(rendererSource).toContain('linearToOutputTexel')
    expect(rendererSource).not.toContain('#include <colorspace_pars_fragment>')
  })

  it('decodes video textures from sRGB before optical composition', () => {
    expect(rendererSource).toContain('uniform float uDecodeSourceTexture')
    expect(rendererSource).toContain('sRGBTransferEOTF(texel).rgb')
    expect(rendererSource).toContain('uDecodeSourceTexture: { value: this.isVideoSource(source) ? 1 : 0 }')
  })

  it('keeps shader brightness lift in the same subtle range as the UI', () => {
    expect(rendererSource).toContain('clamp(uBrightness, -0.25, 0.25)')
  })
})
