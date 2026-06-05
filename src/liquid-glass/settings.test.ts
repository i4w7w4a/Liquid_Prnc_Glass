import { describe, expect, it } from 'vitest'
import {
  defaultLiquidGlassSettings,
  formatLiquidGlassValue,
  normalizeLiquidGlassSettings,
  parseLiquidGlassPreset,
  serializeLiquidGlassPreset,
} from './settings'

describe('liquid glass settings', () => {
  it('formats normalized edge values as percents', () => {
    expect(formatLiquidGlassValue('edgeThickness', 0.125)).toBe('12.5%')
    expect(formatLiquidGlassValue('cornerRadius', 0.025)).toBe('2.5%')
  })

  it('serializes presets as readable JSON', () => {
    expect(serializeLiquidGlassPreset(defaultLiquidGlassSettings)).toContain('"ior": 1.22')
    expect(serializeLiquidGlassPreset(defaultLiquidGlassSettings)).toContain('"pixelRatio": 2')
  })

  it('keeps the center-to-edge field disabled by default', () => {
    expect(defaultLiquidGlassSettings.fieldEnabled).toBe(false)
    expect(defaultLiquidGlassSettings.fieldStart).toBe(0.22)
    expect(defaultLiquidGlassSettings.fieldSoftness).toBe(0.42)
    expect(defaultLiquidGlassSettings.fieldFadeMode).toBe(0)
    expect(defaultLiquidGlassSettings.fieldCurve).toBe(2.4)
    expect(defaultLiquidGlassSettings.fieldStrength).toBe(1)
    expect(defaultLiquidGlassSettings.regionTop).toBe(true)
    expect(defaultLiquidGlassSettings.regionRight).toBe(true)
    expect(defaultLiquidGlassSettings.regionBottom).toBe(true)
    expect(defaultLiquidGlassSettings.regionLeft).toBe(true)
    expect(defaultLiquidGlassSettings.regionWidth).toBe(1)
    expect(defaultLiquidGlassSettings.regionSoftness).toBe(0.12)
    expect(defaultLiquidGlassSettings.shapeType).toBe(0)
    expect(defaultLiquidGlassSettings.shapeWarp).toBe(0.35)
    expect(defaultLiquidGlassSettings.flowEnabled).toBe(false)
    expect(defaultLiquidGlassSettings.flowMode).toBe(0)
    expect(defaultLiquidGlassSettings.flowSpeed).toBe(1)
    expect(defaultLiquidGlassSettings.flowStrength).toBe(0.35)
    expect(defaultLiquidGlassSettings.flowScale).toBe(2.4)
    expect(defaultLiquidGlassSettings.flowTurbulence).toBe(0.35)
    expect(defaultLiquidGlassSettings.flowBoundaryDamping).toBe(0.65)
    expect(defaultLiquidGlassSettings.flowLayerMix).toBe(0.55)
  })

  it('formats signed IOR values', () => {
    expect(formatLiquidGlassValue('ior', -0.65)).toBe('-0.65')
  })

  it('parses a complete preset from JSON', () => {
    const parsedPreset = parseLiquidGlassPreset(serializeLiquidGlassPreset(defaultLiquidGlassSettings))

    expect(parsedPreset).toEqual(defaultLiquidGlassSettings)
  })

  it('parses legacy presets with default center-to-edge field settings', () => {
    const parsedPreset = parseLiquidGlassPreset(
      JSON.stringify({
        ior: 1.22,
        edgeThickness: 0.12,
        cornerRadius: 0.025,
        dispersion: 0.018,
        edgeDarkening: 0.34,
        highlightStrength: 0.72,
        pixelRatio: 2,
      }),
    )

    expect(parsedPreset.fieldEnabled).toBe(false)
    expect(parsedPreset.fieldStart).toBe(defaultLiquidGlassSettings.fieldStart)
    expect(parsedPreset.fieldSoftness).toBe(defaultLiquidGlassSettings.fieldSoftness)
    expect(parsedPreset.fieldFadeMode).toBe(defaultLiquidGlassSettings.fieldFadeMode)
    expect(parsedPreset.fieldCurve).toBe(defaultLiquidGlassSettings.fieldCurve)
    expect(parsedPreset.fieldStrength).toBe(defaultLiquidGlassSettings.fieldStrength)
    expect(parsedPreset.regionTop).toBe(defaultLiquidGlassSettings.regionTop)
    expect(parsedPreset.regionRight).toBe(defaultLiquidGlassSettings.regionRight)
    expect(parsedPreset.regionBottom).toBe(defaultLiquidGlassSettings.regionBottom)
    expect(parsedPreset.regionLeft).toBe(defaultLiquidGlassSettings.regionLeft)
    expect(parsedPreset.regionWidth).toBe(defaultLiquidGlassSettings.regionWidth)
    expect(parsedPreset.regionSoftness).toBe(defaultLiquidGlassSettings.regionSoftness)
    expect(parsedPreset.shapeType).toBe(defaultLiquidGlassSettings.shapeType)
    expect(parsedPreset.shapeWarp).toBe(defaultLiquidGlassSettings.shapeWarp)
    expect(parsedPreset.flowEnabled).toBe(defaultLiquidGlassSettings.flowEnabled)
    expect(parsedPreset.flowMode).toBe(defaultLiquidGlassSettings.flowMode)
    expect(parsedPreset.flowSpeed).toBe(defaultLiquidGlassSettings.flowSpeed)
    expect(parsedPreset.flowStrength).toBe(defaultLiquidGlassSettings.flowStrength)
    expect(parsedPreset.flowScale).toBe(defaultLiquidGlassSettings.flowScale)
    expect(parsedPreset.flowTurbulence).toBe(defaultLiquidGlassSettings.flowTurbulence)
    expect(parsedPreset.flowBoundaryDamping).toBe(defaultLiquidGlassSettings.flowBoundaryDamping)
    expect(parsedPreset.flowLayerMix).toBe(defaultLiquidGlassSettings.flowLayerMix)
  })

  it('normalizes persisted settings with missing field controls', () => {
    const normalizedSettings = normalizeLiquidGlassSettings({
      ior: 1.3,
      edgeThickness: 0.1,
      cornerRadius: 0.02,
      dispersion: 0.01,
      edgeDarkening: 0.3,
      highlightStrength: 0.5,
      pixelRatio: 2,
    })

    expect(normalizedSettings.ior).toBe(1.3)
    expect(normalizedSettings.fieldEnabled).toBe(false)
    expect(normalizedSettings.fieldStart).toBe(defaultLiquidGlassSettings.fieldStart)
    expect(normalizedSettings.fieldSoftness).toBe(defaultLiquidGlassSettings.fieldSoftness)
    expect(normalizedSettings.fieldFadeMode).toBe(defaultLiquidGlassSettings.fieldFadeMode)
    expect(normalizedSettings.regionTop).toBe(defaultLiquidGlassSettings.regionTop)
    expect(normalizedSettings.regionWidth).toBe(defaultLiquidGlassSettings.regionWidth)
    expect(normalizedSettings.shapeType).toBe(defaultLiquidGlassSettings.shapeType)
    expect(normalizedSettings.shapeWarp).toBe(defaultLiquidGlassSettings.shapeWarp)
    expect(normalizedSettings.flowEnabled).toBe(defaultLiquidGlassSettings.flowEnabled)
    expect(normalizedSettings.flowMode).toBe(defaultLiquidGlassSettings.flowMode)
    expect(normalizedSettings.flowSpeed).toBe(defaultLiquidGlassSettings.flowSpeed)
    expect(normalizedSettings.flowStrength).toBe(defaultLiquidGlassSettings.flowStrength)
    expect(normalizedSettings.flowScale).toBe(defaultLiquidGlassSettings.flowScale)
    expect(normalizedSettings.flowTurbulence).toBe(defaultLiquidGlassSettings.flowTurbulence)
    expect(normalizedSettings.flowBoundaryDamping).toBe(defaultLiquidGlassSettings.flowBoundaryDamping)
    expect(normalizedSettings.flowLayerMix).toBe(defaultLiquidGlassSettings.flowLayerMix)
  })

  it('parses signed IOR values', () => {
    const signedPreset = parseLiquidGlassPreset(
      JSON.stringify({
        ...defaultLiquidGlassSettings,
        ior: -0.65,
      }),
    )

    expect(signedPreset.ior).toBe(-0.65)
  })

  it('rejects presets with missing settings', () => {
    expect(() => parseLiquidGlassPreset('{"ior":1.2}')).toThrow('Missing setting: edgeThickness')
  })

  it('rejects presets outside control ranges', () => {
    const unsafePreset = {
      ...defaultLiquidGlassSettings,
      dispersion: 1,
    }

    expect(() => parseLiquidGlassPreset(JSON.stringify(unsafePreset))).toThrow(
      'Setting out of range: dispersion',
    )
  })

  it('rejects center-to-edge field values outside control ranges', () => {
    const unsafePreset = {
      ...defaultLiquidGlassSettings,
      fieldSoftness: 2,
    }

    expect(() => parseLiquidGlassPreset(JSON.stringify(unsafePreset))).toThrow(
      'Setting out of range: fieldSoftness',
    )
  })

  it('rejects unknown center-to-edge fade modes', () => {
    const unsafePreset = {
      ...defaultLiquidGlassSettings,
      fieldFadeMode: 4,
    }

    expect(() => parseLiquidGlassPreset(JSON.stringify(unsafePreset))).toThrow(
      'Setting out of range: fieldFadeMode',
    )
  })

  it('parses side region masks and strip shaping controls', () => {
    const parsedPreset = parseLiquidGlassPreset(
      JSON.stringify({
        ...defaultLiquidGlassSettings,
        regionTop: true,
        regionRight: false,
        regionBottom: true,
        regionLeft: false,
        regionWidth: 0.32,
        regionSoftness: 0.18,
      }),
    )

    expect(parsedPreset.regionTop).toBe(true)
    expect(parsedPreset.regionRight).toBe(false)
    expect(parsedPreset.regionBottom).toBe(true)
    expect(parsedPreset.regionLeft).toBe(false)
    expect(parsedPreset.regionWidth).toBe(0.32)
    expect(parsedPreset.regionSoftness).toBe(0.18)
  })

  it('parses shape geometry controls', () => {
    const parsedPreset = parseLiquidGlassPreset(
      JSON.stringify({
        ...defaultLiquidGlassSettings,
        shapeType: 7,
        shapeWarp: 0.62,
      }),
    )

    expect(parsedPreset.shapeType).toBe(7)
    expect(parsedPreset.shapeWarp).toBe(0.62)
  })

  it('rejects invalid shape geometry controls', () => {
    expect(() =>
      parseLiquidGlassPreset(
        JSON.stringify({
          ...defaultLiquidGlassSettings,
          shapeType: 11,
        }),
      ),
    ).toThrow('Setting out of range: shapeType')

    expect(() =>
      parseLiquidGlassPreset(
        JSON.stringify({
          ...defaultLiquidGlassSettings,
          shapeWarp: 2,
        }),
      ),
    ).toThrow('Setting out of range: shapeWarp')
  })

  it('parses flow field controls', () => {
    const parsedPreset = parseLiquidGlassPreset(
      JSON.stringify({
        ...defaultLiquidGlassSettings,
        flowEnabled: true,
        flowMode: 9,
        flowSpeed: 2.25,
        flowStrength: 1.12,
        flowScale: 5.5,
        flowTurbulence: 0.72,
        flowBoundaryDamping: 0.88,
        flowLayerMix: 0.41,
      }),
    )

    expect(parsedPreset.flowEnabled).toBe(true)
    expect(parsedPreset.flowMode).toBe(9)
    expect(parsedPreset.flowSpeed).toBe(2.25)
    expect(parsedPreset.flowStrength).toBe(1.12)
    expect(parsedPreset.flowScale).toBe(5.5)
    expect(parsedPreset.flowTurbulence).toBe(0.72)
    expect(parsedPreset.flowBoundaryDamping).toBe(0.88)
    expect(parsedPreset.flowLayerMix).toBe(0.41)
  })

  it('rejects invalid flow field controls', () => {
    expect(() =>
      parseLiquidGlassPreset(
        JSON.stringify({
          ...defaultLiquidGlassSettings,
          flowMode: 12,
        }),
      ),
    ).toThrow('Setting out of range: flowMode')

    expect(() =>
      parseLiquidGlassPreset(
        JSON.stringify({
          ...defaultLiquidGlassSettings,
          flowStrength: 2,
        }),
      ),
    ).toThrow('Setting out of range: flowStrength')

    expect(() =>
      parseLiquidGlassPreset(
        JSON.stringify({
          ...defaultLiquidGlassSettings,
          flowEnabled: 1,
        }),
      ),
    ).toThrow('Invalid setting: flowEnabled')
  })

  it('rejects invalid side region controls', () => {
    expect(() =>
      parseLiquidGlassPreset(
        JSON.stringify({
          ...defaultLiquidGlassSettings,
          regionWidth: 2,
        }),
      ),
    ).toThrow('Setting out of range: regionWidth')

    expect(() =>
      parseLiquidGlassPreset(
        JSON.stringify({
          ...defaultLiquidGlassSettings,
          regionTop: 1,
        }),
      ),
    ).toThrow('Invalid setting: regionTop')
  })
})
