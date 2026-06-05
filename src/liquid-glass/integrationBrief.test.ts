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
  exposure: 0.18,
  brightness: -0.04,
  contrast: 1.08,
  saturation: 0.92,
  temperature: 0.12,
  tint: -0.06,
  gamma: 1.04,
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
  shapeType: 8,
  shapeWarp: 0.62,
  flowEnabled: true,
  flowMode: 9,
  flowSpeed: 2.25,
  flowStrength: 1.12,
  flowScale: 5.5,
  flowTurbulence: 0.72,
  flowBoundaryDamping: 0.88,
  flowLayerMix: 0.41,
  pixelRatio: 2.25,
  fieldEnabled: true,
}

describe('integration brief export', () => {
  it('builds a reusable agent handoff from the current preset', () => {
    const brief = generateLiquidGlassIntegrationBrief(tunedPreset)

    expect(brief).toContain('https://github.com/i4w7w4a/Liquid_Prnc_Glass')
    expect(brief).toContain('https://liquid-prince.online/')
    expect(brief).toContain('"ior": -1.84')
    expect(brief).toContain('"fieldFadeMode": 0')
    expect(brief).toContain('"shapeType": 8')
    expect(brief).toContain('"flowMode": 9')
    expect(brief).toContain('"contrast": 1.08')
    expect(brief).toContain('Shape geometry')
    expect(brief).toContain('Flow field')
    expect(brief).toContain('Color correction')
    expect(brief).toContain('Core optics')
    expect(brief).toContain('Center field')
    expect(brief).toContain('Effect regions')
    expect(brief).toContain('linearToOutputTexel')
    expect(brief).toContain('sRGBTransferEOTF')
    expect(brief).toContain('flowGradient')
    expect(brief).toContain('normal/gradient')
    expect(brief).toContain('shapeDistance')
    expect(brief).toContain('float signedOpticalPower(float ior)')
    expect(brief).toContain('finalColor = mix(baseColor, opticalColor, masterFade)')
    expect(brief).toContain('объект')
  })

  it('lists every control group with its active values outside the preset JSON', () => {
    const brief = generateLiquidGlassIntegrationBrief(tunedPreset)

    expect(brief).toContain(
      'Core optics:\nior -1.84; edgeThickness 0.02; cornerRadius 0.1; dispersion 0.046; edgeDarkening 0.48; highlightStrength 0.53; pixelRatio 2.25',
    )
    expect(brief).toContain(
      'Center field:\nenabled; start 0.42; softness 0.42; fade mode 0 - optical mask; curve 0.5; strength 2',
    )
    expect(brief).toContain(
      'Effect regions:\ntop true; right true; bottom true; left true; width 0.34; softness 0.12',
    )
  })

  it('keeps the exported handoff generic for any rendered source object', () => {
    const brief = generateLiquidGlassIntegrationBrief(tunedPreset)

    expect(brief.toLowerCase()).not.toContain('video')
    expect(brief.toLowerCase()).not.toContain('видео')
  })
})
