import { describe, expect, it } from 'vitest'
import { generateLiquidGlassIntegrationBrief } from './integrationBrief'
import type { LiquidGlassSettings } from './settings'

const tunedPreset: LiquidGlassSettings = {
  ior: -1.84,
  edgeThickness: 0.02,
  cornerRadius: 0.1,
  dispersion: 0.046,
  edgeDarkening: 0.48,
  highlightStrength: 0.53,
  fieldStart: 0.42,
  fieldSoftness: 0.42,
  fieldFadeMode: 0,
  fieldCurve: 0.5,
  fieldStrength: 2,
  regionTop: true,
  regionRight: true,
  regionBottom: true,
  regionLeft: true,
  regionWidth: 0.34,
  regionSoftness: 0.12,
  pixelRatio: 2.25,
  fieldEnabled: true,
}

describe('integration brief export', () => {
  it('builds a reusable agent handoff from the current preset', () => {
    const brief = generateLiquidGlassIntegrationBrief(tunedPreset)

    expect(brief).toContain('https://github.com/i4w7w4a/Liquid_Prnc_Glass')
    expect(brief).toContain('http://liquid-prince.online/')
    expect(brief).toContain('"ior": -1.84')
    expect(brief).toContain('"fieldFadeMode": 0')
    expect(brief).toContain('float signedOpticalPower(float ior)')
    expect(brief).toContain('finalColor = mix(baseColor, opticalColor, masterFade)')
    expect(brief).toContain('объект')
  })

  it('keeps the exported handoff generic for any rendered source object', () => {
    const brief = generateLiquidGlassIntegrationBrief(tunedPreset)

    expect(brief.toLowerCase()).not.toContain('video')
    expect(brief.toLowerCase()).not.toContain('видео')
  })
})
