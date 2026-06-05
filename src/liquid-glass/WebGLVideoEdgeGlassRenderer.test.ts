import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const rendererSource = readFileSync(new URL('./WebGLVideoEdgeGlassRenderer.ts', import.meta.url), 'utf8')

describe('WebGL video edge glass renderer shader contract', () => {
  it('uses Three output encoding without duplicating colorspace pars functions', () => {
    expect(rendererSource).toContain('linearToOutputTexel')
    expect(rendererSource).not.toContain('#include <colorspace_pars_fragment>')
  })
})
