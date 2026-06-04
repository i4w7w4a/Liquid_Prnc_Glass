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
    expect(defaultLiquidGlassSettings.fieldCurve).toBe(2.4)
    expect(defaultLiquidGlassSettings.fieldStrength).toBe(1)
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
    expect(parsedPreset.fieldCurve).toBe(defaultLiquidGlassSettings.fieldCurve)
    expect(parsedPreset.fieldStrength).toBe(defaultLiquidGlassSettings.fieldStrength)
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
})
