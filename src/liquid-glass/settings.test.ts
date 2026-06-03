import { describe, expect, it } from 'vitest'
import {
  defaultLiquidGlassSettings,
  formatLiquidGlassValue,
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
})
