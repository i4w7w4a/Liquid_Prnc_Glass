export type LiquidGlassSettingKey =
  | 'ior'
  | 'edgeThickness'
  | 'cornerRadius'
  | 'dispersion'
  | 'edgeDarkening'
  | 'highlightStrength'
  | 'pixelRatio'

export type LiquidGlassSettings = Record<LiquidGlassSettingKey, number>

export type LiquidGlassControl = {
  help: string
  key: LiquidGlassSettingKey
  label: string
  max: number
  min: number
  step: number
}

export const defaultLiquidGlassSettings: LiquidGlassSettings = {
  ior: 1.22,
  edgeThickness: 0.12,
  cornerRadius: 0.025,
  dispersion: 0.018,
  edgeDarkening: 0.34,
  highlightStrength: 0.72,
  pixelRatio: 2,
}

export const liquidGlassControls: LiquidGlassControl[] = [
  {
    key: 'ior',
    label: 'IOR',
    min: 1,
    max: 1.55,
    step: 0.01,
    help: 'Optical strength. Raise slowly; high values bend the edge aggressively.',
  },
  {
    key: 'edgeThickness',
    label: 'Edge thickness',
    min: 0.02,
    max: 0.24,
    step: 0.005,
    help: 'Normalized width of the refractive border zone.',
  },
  {
    key: 'cornerRadius',
    label: 'Corner radius',
    min: 0,
    max: 0.18,
    step: 0.005,
    help: 'SDF corner rounding. Keep low for a sharp cinematic video window.',
  },
  {
    key: 'dispersion',
    label: 'Dispersion',
    min: 0,
    max: 0.08,
    step: 0.001,
    help: 'RGB channel split along the edge normal. Use with restraint.',
  },
  {
    key: 'edgeDarkening',
    label: 'Edge darkening',
    min: 0,
    max: 0.85,
    step: 0.01,
    help: 'Simulates light absorption through thicker glass.',
  },
  {
    key: 'highlightStrength',
    label: 'Highlight strength',
    min: 0,
    max: 1.5,
    step: 0.01,
    help: 'Rim, lower lip and sweep highlight intensity.',
  },
  {
    key: 'pixelRatio',
    label: 'Pixel ratio',
    min: 1,
    max: 3,
    step: 0.25,
    help: 'GPU render scale. 2 is high-end; 3 is a stress setting.',
  },
]

export function formatLiquidGlassValue(key: LiquidGlassSettingKey, value: number) {
  if (key === 'edgeThickness' || key === 'cornerRadius') {
    return `${(value * 100).toFixed(1)}%`
  }

  if (key === 'dispersion') {
    return value.toFixed(3)
  }

  if (key === 'ior' || key === 'pixelRatio') {
    return value.toFixed(2)
  }

  return value.toFixed(2)
}

export function serializeLiquidGlassPreset(settings: LiquidGlassSettings) {
  return JSON.stringify(settings, null, 2)
}
