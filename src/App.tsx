import { useEffect, useMemo, useState } from 'react'
import demoPoster from './assets/demo-poster.png'
import demoVideo from './assets/demo-video.web.mp4'
import {
  WebGLVideoEdgeGlass,
  defaultLiquidGlassSettings,
  formatLiquidGlassValue,
  liquidGlassControls,
  normalizeLiquidGlassSettings,
  parseLiquidGlassPreset,
  serializeLiquidGlassPreset,
} from './liquid-glass'
import type {
  LiquidGlassDiscreteSettingKey,
  LiquidGlassSettingKey,
  LiquidGlassSettings,
} from './liquid-glass'

type Language = 'en' | 'ru'

const coreControls = liquidGlassControls.filter((control) => control.section === 'core')
const fieldControls = liquidGlassControls.filter((control) => control.section === 'field')
const fieldFadeOptions: {
  copyKey: 'fadeMask' | 'fadeDissolve'
  value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey]
}[] = [
  { value: 0, copyKey: 'fadeMask' },
  { value: 1, copyKey: 'fadeDissolve' },
]

const uiCopy = {
  en: {
    coreOptics: 'Core optics',
    centerField: 'Center field',
    copy: 'Copy',
    copied: 'Copied',
    currentPreset: 'Current preset',
    enableField: 'Enable center-to-edge field',
    fadeDissolve: 'Source dissolve',
    fadeMask: 'Optical mask',
    fadeMethod: 'Fade method',
    fieldHidden: 'Field controls are hidden until enabled.',
    fieldHint: 'The center stays clean; refraction dissolves into the video by curve.',
    failed: 'Failed',
    import: 'Import',
    imported: 'Imported',
    invalid: 'Invalid',
    reset: 'Reset',
    subtitle: 'WebGL / VideoTexture / SDF / GLSL',
  },
  ru: {
    coreOptics: 'Оптика',
    centerField: 'Поле от центра',
    copy: 'Копия',
    copied: 'Скопировано',
    currentPreset: 'Текущий пресет',
    enableField: 'Включить поле от центра к краю',
    fadeDissolve: 'Растворение в исходник',
    fadeMask: 'Оптическая маска',
    fadeMethod: 'Метод затухания',
    fieldHidden: 'Настройки поля скрыты, пока режим выключен.',
    fieldHint: 'Центр остается чистым; преломление растворяется в видео по кривой.',
    failed: 'Ошибка',
    import: 'Импорт',
    imported: 'Импортировано',
    invalid: 'Неверно',
    reset: 'Сброс',
    subtitle: 'WebGL / VideoTexture / SDF / GLSL',
  },
} satisfies Record<Language, Record<string, string>>

const controlCopy: Record<LiquidGlassSettingKey, Record<Language, { help: string; label: string }>> = {
  ior: {
    en: {
      label: 'IOR',
      help: 'Signed optical power. 0 is clean; negative values reverse refraction.',
    },
    ru: {
      label: 'IOR',
      help: 'Подписанная оптическая сила. 0 - чистое видео; минус разворачивает преломление.',
    },
  },
  edgeThickness: {
    en: {
      label: 'Edge thickness',
      help: 'Normalized width of the refractive border zone.',
    },
    ru: {
      label: 'Толщина края',
      help: 'Нормализованная ширина зоны преломления по краю.',
    },
  },
  cornerRadius: {
    en: {
      label: 'Corner radius',
      help: 'SDF corner rounding. Keep low for a sharp cinematic video window.',
    },
    ru: {
      label: 'Скругление',
      help: 'SDF-скругление углов. Держи низко для резкого киношного окна.',
    },
  },
  dispersion: {
    en: {
      label: 'Dispersion',
      help: 'RGB channel split along the edge normal. Use with restraint.',
    },
    ru: {
      label: 'Дисперсия',
      help: 'Разделение RGB-каналов по нормали края. Используй сдержанно.',
    },
  },
  edgeDarkening: {
    en: {
      label: 'Edge darkening',
      help: 'Simulates light absorption through thicker glass.',
    },
    ru: {
      label: 'Затемнение края',
      help: 'Имитирует поглощение света в более толстом стекле.',
    },
  },
  highlightStrength: {
    en: {
      label: 'Highlight strength',
      help: 'Rim, lower lip and sweep highlight intensity.',
    },
    ru: {
      label: 'Сила блика',
      help: 'Интенсивность обода, нижней кромки и скользящего блика.',
    },
  },
  fieldStart: {
    en: {
      label: 'Field start',
      help: 'Clean center radius before the invisible field begins to grow.',
    },
    ru: {
      label: 'Старт поля',
      help: 'Чистый радиус центра до начала невидимого роста поля.',
    },
  },
  fieldSoftness: {
    en: {
      label: 'Field softness',
      help: 'Feather width that dissolves the field into the video background.',
    },
    ru: {
      label: 'Мягкость вреза',
      help: 'Ширина растушевки, которая растворяет поле в фоне видео.',
    },
  },
  fieldCurve: {
    en: {
      label: 'Field curve',
      help: 'Power curve for how gently the field emerges from the center.',
    },
    ru: {
      label: 'Кривая поля',
      help: 'Степенная кривая того, насколько мягко поле выходит из центра.',
    },
  },
  fieldStrength: {
    en: {
      label: 'Field strength',
      help: 'Multiplier for full-frame center-to-edge refraction.',
    },
    ru: {
      label: 'Сила поля',
      help: 'Множитель преломления от центра к краям всего кадра.',
    },
  },
  pixelRatio: {
    en: {
      label: 'Pixel ratio',
      help: 'GPU render scale. 2 is high-end; 3 is a stress setting.',
    },
    ru: {
      label: 'Pixel ratio',
      help: 'Масштаб GPU-рендера. 2 — качественный режим, 3 — стресс.',
    },
  },
}

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [settings, setSettings] = useState<LiquidGlassSettings>(defaultLiquidGlassSettings)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [importState, setImportState] = useState<'idle' | 'imported' | 'invalid'>('idle')
  const activeSettings = useMemo(() => normalizeLiquidGlassSettings(settings), [settings])
  const presetJson = useMemo(() => serializeLiquidGlassPreset(activeSettings), [activeSettings])
  const [presetDraft, setPresetDraft] = useState(presetJson)
  const copy = uiCopy[language]

  useEffect(() => {
    setPresetDraft(presetJson)
  }, [presetJson])

  const handleSettingChange = (key: LiquidGlassSettingKey, value: number) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      [key]: value,
    }))
    setCopyState('idle')
    setImportState('idle')
  }

  const handleFieldEnabledChange = (value: boolean) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      fieldEnabled: value,
    }))
    setCopyState('idle')
    setImportState('idle')
  }

  const handleFieldFadeModeChange = (value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey]) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      fieldFadeMode: value,
    }))
    setCopyState('idle')
    setImportState('idle')
  }

  const copyPreset = async () => {
    try {
      await navigator.clipboard.writeText(presetJson)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const importPreset = () => {
    try {
      setSettings(parseLiquidGlassPreset(presetDraft))
      setCopyState('idle')
      setImportState('imported')
    } catch {
      setImportState('invalid')
    }
  }

  const resetPreset = () => {
    setSettings(defaultLiquidGlassSettings)
    setCopyState('idle')
    setImportState('idle')
  }

  return (
    <main className="app-shell" aria-label="Liquid Prnc Glass lab">
      <section className="preview-stage" aria-label="WebGL video glass preview">
        <WebGLVideoEdgeGlass
          className="preview-stage__glass"
          poster={demoPoster}
          settings={activeSettings}
          src={demoVideo}
        />
      </section>
      <aside className="control-panel" aria-label="Glass controls">
        <div className="control-panel__head">
          <div className="control-panel__title-row">
            <p>Liquid_Prnc_Glass</p>
            <div className="language-toggle" aria-label="Language">
              {(['en', 'ru'] as Language[]).map((item) => (
                <button
                  aria-pressed={language === item}
                  key={item}
                  onClick={() => setLanguage(item)}
                  title={item === 'en' ? 'English' : 'Русский'}
                  type="button"
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <span>{copy.subtitle}</span>
        </div>
        <div className="control-panel__controls">
          <details className="control-group" open>
            <summary>{copy.coreOptics}</summary>
            {coreControls.map((control) => {
              const inputId = `glass-${control.key}`
              const text = controlCopy[control.key][language]

              return (
                <div className="glass-control" key={control.key}>
                  <span className="glass-control__row">
                    <label htmlFor={inputId} title={text.help}>
                      {text.label}
                    </label>
                    <output aria-hidden="true" htmlFor={inputId}>
                      {formatLiquidGlassValue(control.key, activeSettings[control.key])}
                    </output>
                  </span>
                  <input
                    id={inputId}
                    max={control.max}
                    min={control.min}
                    onChange={(event) =>
                      handleSettingChange(control.key, Number(event.currentTarget.value))
                    }
                    step={control.step}
                    type="range"
                    value={activeSettings[control.key]}
                  />
                  <small>{text.help}</small>
                </div>
              )
            })}
          </details>
          <details className="control-group" open>
            <summary>{copy.centerField}</summary>
            <label className="field-toggle">
              <input
                checked={activeSettings.fieldEnabled}
                onChange={(event) => handleFieldEnabledChange(event.currentTarget.checked)}
                type="checkbox"
              />
              <span>{copy.enableField}</span>
            </label>
            <small className="field-toggle__hint">
              {copy.fieldHint}
            </small>
            {activeSettings.fieldEnabled ? (
              <>
                <div className="fade-mode">
                  <span>{copy.fadeMethod}</span>
                  <div className="fade-mode__buttons">
                    {fieldFadeOptions.map((option) => (
                      <button
                        aria-pressed={activeSettings.fieldFadeMode === option.value}
                        key={option.value}
                        onClick={() => handleFieldFadeModeChange(option.value)}
                        type="button"
                      >
                        {copy[option.copyKey]}
                      </button>
                    ))}
                  </div>
                </div>
                {fieldControls.map((control) => {
                  const inputId = `glass-${control.key}`
                  const text = controlCopy[control.key][language]

                  return (
                    <div className="glass-control" key={control.key}>
                      <span className="glass-control__row">
                        <label htmlFor={inputId} title={text.help}>
                          {text.label}
                        </label>
                        <output aria-hidden="true" htmlFor={inputId}>
                          {formatLiquidGlassValue(control.key, activeSettings[control.key])}
                        </output>
                      </span>
                      <input
                        id={inputId}
                        max={control.max}
                        min={control.min}
                        onChange={(event) =>
                          handleSettingChange(control.key, Number(event.currentTarget.value))
                        }
                        step={control.step}
                        type="range"
                        value={activeSettings[control.key]}
                      />
                      <small>{text.help}</small>
                    </div>
                  )
                })}
              </>
            ) : (
              <p className="control-group__empty">{copy.fieldHidden}</p>
            )}
          </details>
        </div>
        <div className="preset-box">
          <div className="preset-box__head">
            <span>{copy.currentPreset}</span>
            <span className="preset-box__actions">
              <button onClick={importPreset} type="button">
                {importState === 'imported'
                  ? copy.imported
                  : importState === 'invalid'
                    ? copy.invalid
                    : copy.import}
              </button>
              <button onClick={resetPreset} type="button">
                {copy.reset}
              </button>
              <button onClick={copyPreset} type="button">
                {copyState === 'copied'
                  ? copy.copied
                  : copyState === 'failed'
                    ? copy.failed
                    : copy.copy}
              </button>
            </span>
          </div>
          <textarea
            aria-label="Current Liquid_Prnc_Glass preset"
            onChange={(event) => {
              setPresetDraft(event.currentTarget.value)
              setImportState('idle')
            }}
            spellCheck={false}
            value={presetDraft}
          />
        </div>
      </aside>
    </main>
  )
}

export default App
