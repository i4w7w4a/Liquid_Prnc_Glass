import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import demoPoster from './assets/demo-poster.png'
import demoVideo from './assets/demo-video.web.mp4'
import {
  WebGLVideoEdgeGlass,
  defaultLiquidGlassSettings,
  formatLiquidGlassValue,
  generateLiquidGlassIntegrationBrief,
  liquidGlassControls,
  normalizeLiquidGlassSettings,
  parseLiquidGlassPreset,
  resizeSourceFrameWithAspect,
  resolveNaturalSourceSize,
  serializeLiquidGlassPreset,
} from './liquid-glass'
import type {
  LiquidGlassBooleanSettingKey,
  LiquidGlassDiscreteSettingKey,
  LiquidGlassSource,
  LiquidGlassSettingKey,
  LiquidGlassSettings,
  SourceSize,
} from './liquid-glass'

type Language = 'en' | 'ru'
type SourceFrameMode = 'manual' | 'natural' | 'viewport'
type RegionKey = Extract<
  LiquidGlassBooleanSettingKey,
  'regionBottom' | 'regionLeft' | 'regionRight' | 'regionTop'
>
type RegionToggleCopyKey = 'regionBottom' | 'regionLeft' | 'regionRight' | 'regionTop'
type RegionPresetCopyKey =
  | 'regionAll'
  | 'regionBottomOnly'
  | 'regionSides'
  | 'regionTopBottom'
  | 'regionTopOnly'

const coreControls = liquidGlassControls.filter((control) => control.section === 'core')
const fieldControls = liquidGlassControls.filter((control) => control.section === 'field')
const regionControls = liquidGlassControls.filter((control) => control.section === 'region')
const defaultSourceSize: SourceSize = { width: 1280, height: 720 }
const defaultGlassSource: LiquidGlassSource = {
  kind: 'video',
  name: 'Demo source',
  poster: demoPoster,
  src: demoVideo,
}
const fieldFadeOptions: {
  copyKey: 'fadeMask' | 'fadeDissolve'
  value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey]
}[] = [
  { value: 0, copyKey: 'fadeMask' },
  { value: 1, copyKey: 'fadeDissolve' },
]
const regionToggleOptions: { copyKey: RegionToggleCopyKey; key: RegionKey }[] = [
  { key: 'regionTop', copyKey: 'regionTop' },
  { key: 'regionRight', copyKey: 'regionRight' },
  { key: 'regionBottom', copyKey: 'regionBottom' },
  { key: 'regionLeft', copyKey: 'regionLeft' },
]
const regionPresetOptions = [
  {
    copyKey: 'regionAll',
    edges: { regionTop: true, regionRight: true, regionBottom: true, regionLeft: true },
  },
  {
    copyKey: 'regionTopBottom',
    edges: { regionTop: true, regionRight: false, regionBottom: true, regionLeft: false },
  },
  {
    copyKey: 'regionSides',
    edges: { regionTop: false, regionRight: true, regionBottom: false, regionLeft: true },
  },
  {
    copyKey: 'regionTopOnly',
    edges: { regionTop: true, regionRight: false, regionBottom: false, regionLeft: false },
  },
  {
    copyKey: 'regionBottomOnly',
    edges: { regionTop: false, regionRight: false, regionBottom: true, regionLeft: false },
  },
] satisfies { copyKey: RegionPresetCopyKey; edges: Record<RegionKey, boolean> }[]

const uiCopy = {
  en: {
    coreOptics: 'Core optics',
    centerField: 'Center field',
    brief: 'Brief',
    briefCopied: 'Brief copied',
    copy: 'Copy',
    copied: 'Copied',
    currentPreset: 'Current preset',
    demoSource: 'Demo',
    enableField: 'Enable center-to-edge field',
    effectRegions: 'Effect regions',
    fadeDissolve: 'Source dissolve',
    fadeMask: 'Optical mask',
    fadeMethod: 'Fade method',
    fieldHidden: 'Field controls are hidden until enabled.',
    fieldHint: 'The center stays clean; refraction dissolves into the source by curve.',
    failed: 'Failed',
    import: 'Import',
    imported: 'Imported',
    integrationBrief: 'Integration brief',
    invalid: 'Invalid',
    lockAspect: 'Lock aspect',
    manualSize: 'Manual',
    naturalSize: 'Natural',
    preset: 'Preset',
    regionAll: 'All',
    regionBottom: 'Bottom',
    regionBottomOnly: 'Bottom',
    regionLeft: 'Left',
    regionRight: 'Right',
    regionSides: 'Sides',
    regionTop: 'Top',
    regionTopBottom: 'Top + bottom',
    regionTopOnly: 'Top',
    reset: 'Reset',
    source: 'Source',
    sourceHint: 'Upload an image or a moving source. Demo stays available.',
    sourceKindImage: 'Image',
    sourceKindVideo: 'Motion',
    sourceSize: 'Source size',
    subtitle: 'WebGL / SourceTexture / SDF / GLSL',
    uploadSource: 'Upload',
    viewportSize: 'Viewport',
  },
  ru: {
    coreOptics: 'Оптика',
    centerField: 'Поле от центра',
    brief: 'ТЗ',
    briefCopied: 'ТЗ скопировано',
    copy: 'Копия',
    copied: 'Скопировано',
    currentPreset: 'Текущий пресет',
    demoSource: 'Демо',
    enableField: 'Включить поле от центра к краю',
    effectRegions: 'Зоны эффекта',
    fadeDissolve: 'Растворение в исходник',
    fadeMask: 'Оптическая маска',
    fadeMethod: 'Метод затухания',
    fieldHidden: 'Настройки поля скрыты, пока режим выключен.',
    fieldHint: 'Центр остается чистым; преломление растворяется в исходнике по кривой.',
    failed: 'Ошибка',
    import: 'Импорт',
    imported: 'Импортировано',
    integrationBrief: 'ТЗ для агента',
    invalid: 'Неверно',
    lockAspect: 'Держать пропорции',
    manualSize: 'Вручную',
    naturalSize: 'Натуральный',
    preset: 'Пресет',
    regionAll: 'Все',
    regionBottom: 'Низ',
    regionBottomOnly: 'Низ',
    regionLeft: 'Лево',
    regionRight: 'Право',
    regionSides: 'Бока',
    regionTop: 'Верх',
    regionTopBottom: 'Верх + низ',
    regionTopOnly: 'Верх',
    reset: 'Сброс',
    source: 'Исходник',
    sourceHint: 'Загрузи изображение или движущийся source. Демо остается доступным.',
    sourceKindImage: 'Изображение',
    sourceKindVideo: 'Движение',
    sourceSize: 'Размер исходника',
    subtitle: 'WebGL / SourceTexture / SDF / GLSL',
    uploadSource: 'Загрузить',
    viewportSize: 'Экран',
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
      help: 'SDF corner rounding. Keep low for a sharp cinematic source frame.',
    },
    ru: {
      label: 'Скругление',
      help: 'SDF-скругление углов. Держи низко для резкой рамки исходника.',
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
      help: 'Feather width that dissolves the field into the source background.',
    },
    ru: {
      label: 'Мягкость вреза',
      help: 'Ширина растушевки, которая растворяет поле в фоне исходника.',
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
  regionWidth: {
    en: {
      label: 'Region width',
      help: 'Width of selected effect strips from the chosen edges inward.',
    },
    ru: {
      label: 'Ширина зоны',
      help: 'Ширина выбранных полос эффекта от края внутрь.',
    },
  },
  regionSoftness: {
    en: {
      label: 'Region softness',
      help: 'Feathering at the inner border of selected strips.',
    },
    ru: {
      label: 'Мягкость зоны',
      help: 'Растушевка внутренней границы выбранных полос.',
    },
  },
}

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [settings, setSettings] = useState<LiquidGlassSettings>(defaultLiquidGlassSettings)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [briefState, setBriefState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [exportView, setExportView] = useState<'brief' | 'preset'>('preset')
  const [glassSource, setGlassSource] = useState<LiquidGlassSource>(defaultGlassSource)
  const [importState, setImportState] = useState<'idle' | 'imported' | 'invalid'>('idle')
  const [sourceAspectLocked, setSourceAspectLocked] = useState(true)
  const [sourceFrameMode, setSourceFrameMode] = useState<SourceFrameMode>('viewport')
  const [sourceFrameSize, setSourceFrameSize] = useState<SourceSize>(defaultSourceSize)
  const [sourceNaturalSize, setSourceNaturalSize] = useState<SourceSize>(defaultSourceSize)
  const [uploadedSourceUrl, setUploadedSourceUrl] = useState<string | null>(null)
  const [viewportSize, setViewportSize] = useState(() => ({
    height: window.innerHeight,
    width: window.innerWidth,
  }))
  const sourceFileInputRef = useRef<HTMLInputElement>(null)
  const activeSettings = useMemo(() => normalizeLiquidGlassSettings(settings), [settings])
  const presetJson = useMemo(() => serializeLiquidGlassPreset(activeSettings), [activeSettings])
  const integrationBrief = useMemo(
    () => generateLiquidGlassIntegrationBrief(activeSettings),
    [activeSettings],
  )
  const [presetDraft, setPresetDraft] = useState(presetJson)
  const copy = uiCopy[language]
  const exportText = exportView === 'brief' ? integrationBrief : presetDraft
  const sourceFrameStyle = useMemo<CSSProperties | undefined>(() => {
    if (sourceFrameMode === 'viewport') {
      return undefined
    }

    const controlReserve =
      viewportSize.width > 760 ? Math.min(432, Math.max(0, viewportSize.width - 32)) + 72 : 20
    const availableWidth = Math.max(280, viewportSize.width - controlReserve)
    const availableHeight =
      viewportSize.width > 760 ? Math.max(280, viewportSize.height - 48) : Math.max(220, viewportSize.height * 0.48)
    const scale = Math.min(
      1,
      availableWidth / Math.max(sourceFrameSize.width, 1),
      availableHeight / Math.max(sourceFrameSize.height, 1),
    )
    const centerX = viewportSize.width > 760 ? availableWidth / 2 : viewportSize.width / 2

    return {
      height: `${sourceFrameSize.height}px`,
      left: `${centerX}px`,
      top: '50%',
      transform: `translate(-50%, -50%) scale(${scale})`,
      width: `${sourceFrameSize.width}px`,
    }
  }, [sourceFrameMode, sourceFrameSize.height, sourceFrameSize.width, viewportSize.height, viewportSize.width])

  useEffect(() => {
    setPresetDraft(presetJson)
  }, [presetJson])

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        height: window.innerHeight,
        width: window.innerWidth,
      })
    }

    window.addEventListener('resize', updateViewportSize)
    return () => window.removeEventListener('resize', updateViewportSize)
  }, [])

  useEffect(() => {
    return () => {
      if (uploadedSourceUrl) {
        URL.revokeObjectURL(uploadedSourceUrl)
      }
    }
  }, [uploadedSourceUrl])

  const handleSettingChange = (key: LiquidGlassSettingKey, value: number) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      [key]: value,
    }))
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
  }

  const handleFieldEnabledChange = (value: boolean) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      fieldEnabled: value,
    }))
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
  }

  const handleFieldFadeModeChange = (value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey]) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      fieldFadeMode: value,
    }))
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
  }

  const handleRegionToggleChange = (key: RegionKey, value: boolean) => {
    setSettings((currentSettings) => {
      const normalizedSettings = normalizeLiquidGlassSettings(currentSettings)

      return {
        ...normalizedSettings,
        [key]: value,
        regionWidth: normalizedSettings.regionWidth >= 0.99 ? 0.32 : normalizedSettings.regionWidth,
      }
    })
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
  }

  const handleRegionPresetChange = (edges: Record<RegionKey, boolean>) => {
    setSettings((currentSettings) => {
      const normalizedSettings = normalizeLiquidGlassSettings(currentSettings)
      const allEdges = edges.regionTop && edges.regionRight && edges.regionBottom && edges.regionLeft

      return {
        ...normalizedSettings,
        ...edges,
        regionWidth: allEdges ? 1 : normalizedSettings.regionWidth >= 0.99 ? 0.32 : normalizedSettings.regionWidth,
      }
    })
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
  }

  const handleSourceNaturalSizeChange = (size: SourceSize) => {
    const nextNaturalSize = resolveNaturalSourceSize(size, sourceNaturalSize)

    setSourceNaturalSize(nextNaturalSize)

    if (sourceFrameMode === 'natural') {
      setSourceFrameSize(nextNaturalSize)
    }
  }

  const handleSourceFrameModeChange = (mode: SourceFrameMode) => {
    setSourceFrameMode(mode)

    if (mode === 'natural') {
      setSourceFrameSize(sourceNaturalSize)
    }
  }

  const handleSourceDimensionChange = (axis: 'height' | 'width', value: number) => {
    setSourceFrameMode('manual')
    setSourceFrameSize((currentSize) =>
      resizeSourceFrameWithAspect({
        axis,
        lockAspect: sourceAspectLocked,
        nextValue: value,
        size: currentSize,
      }),
    )
  }

  const handleSourceFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    if (!file) {
      return
    }

    const kind = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : null

    if (!kind) {
      return
    }

    const nextSourceUrl = URL.createObjectURL(file)

    setUploadedSourceUrl(nextSourceUrl)
    setGlassSource({
      kind,
      name: file.name,
      src: nextSourceUrl,
    })
    setSourceFrameMode('natural')
    setCopyState('idle')
    setBriefState('idle')
  }

  const resetSource = () => {
    setGlassSource(defaultGlassSource)
    setUploadedSourceUrl(null)
    setSourceFrameMode('viewport')
    setSourceNaturalSize(defaultSourceSize)
    setSourceFrameSize(defaultSourceSize)
    setCopyState('idle')
    setBriefState('idle')
  }

  const copyCurrentExport = async () => {
    try {
      await navigator.clipboard.writeText(exportView === 'brief' ? integrationBrief : presetJson)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const copyIntegrationBrief = async () => {
    setExportView('brief')

    try {
      await navigator.clipboard.writeText(integrationBrief)
      setBriefState('copied')
    } catch {
      setBriefState('failed')
    }
  }

  const importPreset = () => {
    try {
      setSettings(parseLiquidGlassPreset(presetDraft))
      setExportView('preset')
      setCopyState('idle')
      setBriefState('idle')
      setImportState('imported')
    } catch {
      setImportState('invalid')
    }
  }

  const resetPreset = () => {
    setSettings(defaultLiquidGlassSettings)
    setExportView('preset')
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
  }

  return (
    <main className="app-shell" aria-label="Liquid Prnc Glass lab">
      <section className="preview-stage" aria-label="WebGL source glass preview">
        <WebGLVideoEdgeGlass
          className={`preview-stage__glass${
            sourceFrameMode === 'viewport' ? '' : ' preview-stage__glass--framed'
          }`}
          onNaturalSizeChange={handleSourceNaturalSizeChange}
          settings={activeSettings}
          source={glassSource}
          sourceNaturalSize={sourceNaturalSize}
          style={sourceFrameStyle}
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
            <summary>{copy.source}</summary>
            <div className="source-toolbar">
              <button onClick={resetSource} type="button">
                {copy.demoSource}
              </button>
              <button onClick={() => sourceFileInputRef.current?.click()} type="button">
                {copy.uploadSource}
              </button>
              <input
                accept="image/*,video/*"
                className="source-toolbar__file"
                onChange={handleSourceFileChange}
                ref={sourceFileInputRef}
                type="file"
              />
            </div>
            <small className="field-toggle__hint">
              {copy.sourceHint}
            </small>
            <div className="source-readout">
              <span>{glassSource.name}</span>
              <span>
                {glassSource.kind === 'image' ? copy.sourceKindImage : copy.sourceKindVideo} /{' '}
                {sourceNaturalSize.width}x{sourceNaturalSize.height}
              </span>
            </div>
            <div className="fade-mode">
              <span>{copy.sourceSize}</span>
              <div className="source-size-mode">
                {(['viewport', 'natural', 'manual'] as SourceFrameMode[]).map((mode) => (
                  <button
                    aria-pressed={sourceFrameMode === mode}
                    key={mode}
                    onClick={() => handleSourceFrameModeChange(mode)}
                    type="button"
                  >
                    {mode === 'viewport'
                      ? copy.viewportSize
                      : mode === 'natural'
                        ? copy.naturalSize
                        : copy.manualSize}
                  </button>
                ))}
              </div>
            </div>
            <label className="field-toggle">
              <input
                checked={sourceAspectLocked}
                onChange={(event) => setSourceAspectLocked(event.currentTarget.checked)}
                type="checkbox"
              />
              <span>{copy.lockAspect}</span>
            </label>
            <div className="source-dimensions">
              <label>
                <span>W</span>
                <input
                  min={64}
                  onChange={(event) =>
                    handleSourceDimensionChange('width', Number(event.currentTarget.value))
                  }
                  step={1}
                  type="number"
                  value={sourceFrameSize.width}
                />
              </label>
              <label>
                <span>H</span>
                <input
                  min={64}
                  onChange={(event) =>
                    handleSourceDimensionChange('height', Number(event.currentTarget.value))
                  }
                  step={1}
                  type="number"
                  value={sourceFrameSize.height}
                />
              </label>
            </div>
          </details>
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
          <details className="control-group" open>
            <summary>{copy.effectRegions}</summary>
            <div className="region-presets">
              {regionPresetOptions.map((option) => (
                <button
                  key={option.copyKey}
                  onClick={() => handleRegionPresetChange(option.edges)}
                  type="button"
                >
                  {copy[option.copyKey]}
                </button>
              ))}
            </div>
            <div className="region-grid">
              {regionToggleOptions.map((option) => (
                <button
                  aria-pressed={activeSettings[option.key]}
                  key={option.key}
                  onClick={() => handleRegionToggleChange(option.key, !activeSettings[option.key])}
                  type="button"
                >
                  {copy[option.copyKey]}
                </button>
              ))}
            </div>
            {regionControls.map((control) => {
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
        </div>
        <div className="preset-box">
          <div className="preset-box__head">
            <span>{exportView === 'brief' ? copy.integrationBrief : copy.currentPreset}</span>
            <span className="preset-box__actions">
              {exportView === 'brief' ? (
                <button onClick={() => setExportView('preset')} type="button">
                  {copy.preset}
                </button>
              ) : (
                <button onClick={importPreset} type="button">
                  {importState === 'imported'
                    ? copy.imported
                    : importState === 'invalid'
                      ? copy.invalid
                      : copy.import}
                </button>
              )}
              <button onClick={resetPreset} type="button">
                {copy.reset}
              </button>
              <button onClick={copyIntegrationBrief} type="button">
                {briefState === 'copied'
                  ? copy.briefCopied
                  : briefState === 'failed'
                    ? copy.failed
                    : copy.brief}
              </button>
              <button onClick={copyCurrentExport} type="button">
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
              if (exportView === 'brief') {
                return
              }

              setPresetDraft(event.currentTarget.value)
              setImportState('idle')
            }}
            readOnly={exportView === 'brief'}
            spellCheck={false}
            value={exportText}
          />
        </div>
      </aside>
    </main>
  )
}

export default App
