export type LiquidGlassSettingKey =
  | 'ior'
  | 'edgeThickness'
  | 'cornerRadius'
  | 'dispersion'
  | 'edgeDarkening'
  | 'highlightStrength'
  | 'fieldStart'
  | 'fieldSoftness'
  | 'fieldCurve'
  | 'fieldStrength'
  | 'pixelRatio'

export type LiquidGlassBooleanSettingKey = 'fieldEnabled'

export type LiquidGlassSettings = Record<LiquidGlassSettingKey, number> &
  Record<LiquidGlassBooleanSettingKey, boolean>

export type LiquidGlassControl = {
  help: string
  key: LiquidGlassSettingKey
  label: string
  max: number
  min: number
  section: 'core' | 'field'
  step: number
}

const liquidGlassSettingKeys: LiquidGlassSettingKey[] = [
  'ior',
  'edgeThickness',
  'cornerRadius',
  'dispersion',
  'edgeDarkening',
  'highlightStrength',
  'pixelRatio',
]

const optionalLiquidGlassSettingKeys: LiquidGlassSettingKey[] = [
  'fieldStart',
  'fieldSoftness',
  'fieldCurve',
  'fieldStrength',
]

const liquidGlassBooleanSettingKeys: LiquidGlassBooleanSettingKey[] = ['fieldEnabled']

export const defaultLiquidGlassSettings: LiquidGlassSettings = {
  ior: 1.22,
  edgeThickness: 0.12,
  cornerRadius: 0.025,
  dispersion: 0.018,
  edgeDarkening: 0.34,
  highlightStrength: 0.72,
  fieldStart: 0.22,
  fieldSoftness: 0.42,
  fieldCurve: 2.4,
  fieldStrength: 1,
  pixelRatio: 2,
  fieldEnabled: false,
}

export const liquidGlassControls: LiquidGlassControl[] = [
  {
    key: 'ior',
    label: 'IOR',
    min: 1,
    max: 1.55,
    step: 0.01,
    section: 'core',
    help: 'Optical strength. Raise slowly; high values bend the edge aggressively.',
  },
  {
    key: 'edgeThickness',
    label: 'Edge thickness',
    min: 0.02,
    max: 0.24,
    step: 0.005,
    section: 'core',
    help: 'Normalized width of the refractive border zone.',
  },
  {
    key: 'cornerRadius',
    label: 'Corner radius',
    min: 0,
    max: 0.18,
    step: 0.005,
    section: 'core',
    help: 'SDF corner rounding. Keep low for a sharp cinematic video window.',
  },
  {
    key: 'dispersion',
    label: 'Dispersion',
    min: 0,
    max: 0.08,
    step: 0.001,
    section: 'core',
    help: 'RGB channel split along the edge normal. Use with restraint.',
  },
  {
    key: 'edgeDarkening',
    label: 'Edge darkening',
    min: 0,
    max: 0.85,
    step: 0.01,
    section: 'core',
    help: 'Simulates light absorption through thicker glass.',
  },
  {
    key: 'highlightStrength',
    label: 'Highlight strength',
    min: 0,
    max: 1.5,
    step: 0.01,
    section: 'core',
    help: 'Rim, lower lip and sweep highlight intensity.',
  },
  {
    key: 'fieldStart',
    label: 'Field start',
    min: 0,
    max: 0.72,
    step: 0.01,
    section: 'field',
    help: 'Clean center radius before the invisible field begins to grow.',
  },
  {
    key: 'fieldSoftness',
    label: 'Field softness',
    min: 0.08,
    max: 0.9,
    step: 0.01,
    section: 'field',
    help: 'Feather width that dissolves the field into the video background.',
  },
  {
    key: 'fieldCurve',
    label: 'Field curve',
    min: 0.45,
    max: 5,
    step: 0.05,
    section: 'field',
    help: 'Power curve for how gently the field emerges from the center.',
  },
  {
    key: 'fieldStrength',
    label: 'Field strength',
    min: 0,
    max: 2,
    step: 0.01,
    section: 'field',
    help: 'Multiplier for full-frame center-to-edge refraction.',
  },
  {
    key: 'pixelRatio',
    label: 'Pixel ratio',
    min: 1,
    max: 3,
    step: 0.25,
    section: 'core',
    help: 'GPU render scale. 2 is high-end; 3 is a stress setting.',
  },
]

export function formatLiquidGlassValue(key: LiquidGlassSettingKey, value: number) {
  if (
    key === 'edgeThickness' ||
    key === 'cornerRadius' ||
    key === 'fieldStart' ||
    key === 'fieldSoftness'
  ) {
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

export function normalizeLiquidGlassSettings(settings: Partial<LiquidGlassSettings>): LiquidGlassSettings {
  return {
    ...defaultLiquidGlassSettings,
    ...settings,
  }
}

export function parseLiquidGlassPreset(rawPreset: string): LiquidGlassSettings {
  const parsedPreset = JSON.parse(rawPreset) as Partial<LiquidGlassSettings> | null

  if (typeof parsedPreset !== 'object' || parsedPreset === null) {
    throw new Error('Preset must be a JSON object')
  }

  const preset = normalizeLiquidGlassSettings({})

  for (const key of liquidGlassSettingKeys) {
    const value = parsedPreset[key]

    if (value === undefined) {
      throw new Error(`Missing setting: ${key}`)
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Invalid setting: ${key}`)
    }

    const control = liquidGlassControls.find((item) => item.key === key)

    if (control && (value < control.min || value > control.max)) {
      throw new Error(`Setting out of range: ${key}`)
    }

    preset[key] = value
  }

  for (const key of optionalLiquidGlassSettingKeys) {
    const value = parsedPreset[key]

    if (value === undefined) {
      continue
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Invalid setting: ${key}`)
    }

    const control = liquidGlassControls.find((item) => item.key === key)

    if (control && (value < control.min || value > control.max)) {
      throw new Error(`Setting out of range: ${key}`)
    }

    preset[key] = value
  }

  for (const key of liquidGlassBooleanSettingKeys) {
    const value = parsedPreset[key]

    if (value === undefined) {
      continue
    }

    if (typeof value !== 'boolean') {
      throw new Error(`Invalid setting: ${key}`)
    }

    preset[key] = value
  }

  return preset
}
