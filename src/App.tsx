import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import demoPoster from './assets/demo-poster.png'
import demoVideo from './assets/demo-video.web.mp4'
import {
  buildRecordingOptionCandidates,
  WebGLVideoEdgeGlass,
  defaultLiquidGlassSettings,
  formatLiquidGlassValue,
  generateLiquidGlassIntegrationBrief,
  buildRecordingExportFilename,
  chooseSupportedRecordingMimeType,
  buildRenderImageFilename,
  buildRenderMp4Filename,
  getMp4RenderAvailability,
  liquidGlassControls,
  normalizeRenderExportDuration,
  normalizeRenderExportFps,
  normalizeRecordingFps,
  normalizeLiquidGlassSettings,
  parseLiquidGlassPreset,
  resolveRenderExportDurationFromSource,
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
  RenderExportSizePreset,
  SourceSize,
} from './liquid-glass'

type Language = 'en' | 'ru'
type RecordingState = 'failed' | 'idle' | 'ready' | 'recording' | 'unsupported'
type RenderExportState = 'failed' | 'idle' | 'needs-https' | 'ready' | 'rendering' | 'unsupported'
type SourceFrameMode = 'manual' | 'natural' | 'viewport'
type RenderSizeCopyKey = 'renderSize1080p' | 'renderSize720p' | 'renderSizeSource'
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
const renderSizeOptions: { copyKey: RenderSizeCopyKey; value: RenderExportSizePreset }[] = [
  { value: 'source', copyKey: 'renderSizeSource' },
  { value: '720p', copyKey: 'renderSize720p' },
  { value: '1080p', copyKey: 'renderSize1080p' },
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
    downloadExport: 'Download',
    downloadMp4: 'Download MP4',
    downloadPng: 'Download PNG',
    enableField: 'Enable center-to-edge field',
    effectRegions: 'Effect regions',
    exportFailed: 'Export failed',
    exportFps: 'FPS',
    exportHint: 'Quick preview recording is real-time; MP4 render writes exact frames.',
    exportPreviewRecord: 'Preview record',
    exportReady: 'Export ready',
    exportResult: 'Export result',
    exportUnsupported: 'Export unsupported',
    exporting: 'Recording',
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
    renderDuration: 'Seconds',
    renderFailed: 'Render failed',
    rendering: 'Rendering',
    renderNeedsHttps: 'Needs HTTPS',
    renderMp4: 'Render MP4',
    renderPng: 'Render PNG',
    renderPngIdle: 'PNG frame',
    renderPngReady: 'PNG ready',
    renderReady: 'MP4 ready',
    renderSize: 'Render size',
    renderSize1080p: '1080p',
    renderSize720p: '720p',
    renderSizeSource: 'Source',
    renderUnsupported: 'Render unsupported',
    reset: 'Reset',
    startExport: 'Record',
    stopExport: 'Stop',
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
    downloadExport: 'Скачать',
    downloadMp4: 'Скачать MP4',
    downloadPng: 'Скачать PNG',
    enableField: 'Включить поле от центра к краю',
    effectRegions: 'Зоны эффекта',
    exportFailed: 'Ошибка экспорта',
    exportFps: 'FPS',
    exportHint: 'Быстрая запись пишет preview в реальном времени; MP4-рендер пишет точные кадры.',
    exportPreviewRecord: 'Запись preview',
    exportReady: 'Экспорт готов',
    exportResult: 'Экспорт результата',
    exportUnsupported: 'Экспорт не поддержан',
    exporting: 'Запись',
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
    renderDuration: 'Секунды',
    renderFailed: 'Ошибка рендера',
    rendering: 'Рендер',
    renderNeedsHttps: 'Нужен HTTPS',
    renderMp4: 'Рендер MP4',
    renderPng: 'Рендер PNG',
    renderPngIdle: 'PNG кадр',
    renderPngReady: 'PNG готов',
    renderReady: 'MP4 готов',
    renderSize: 'Размер рендера',
    renderSize1080p: '1080p',
    renderSize720p: '720p',
    renderSizeSource: 'Исходник',
    renderUnsupported: 'Рендер не поддержан',
    reset: 'Сброс',
    startExport: 'Запись',
    stopExport: 'Стоп',
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
  const [recordingDownloadUrl, setRecordingDownloadUrl] = useState<string | null>(null)
  const [recordingFilename, setRecordingFilename] = useState('')
  const [recordingFps, setRecordingFps] = useState(() => normalizeRecordingFps(30))
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [renderDownloadUrl, setRenderDownloadUrl] = useState<string | null>(null)
  const [renderDuration, setRenderDuration] = useState(() => normalizeRenderExportDuration(6))
  const [renderFilename, setRenderFilename] = useState('')
  const [renderFps, setRenderFps] = useState(() => normalizeRenderExportFps(30))
  const [renderProgress, setRenderProgress] = useState(0)
  const [renderSizePreset, setRenderSizePreset] = useState<RenderExportSizePreset>('1080p')
  const [renderState, setRenderState] = useState<RenderExportState>('idle')
  const [sourceAspectLocked, setSourceAspectLocked] = useState(true)
  const [sourceFrameMode, setSourceFrameMode] = useState<SourceFrameMode>('viewport')
  const [sourceFrameSize, setSourceFrameSize] = useState<SourceSize>(defaultSourceSize)
  const [sourceNaturalSize, setSourceNaturalSize] = useState<SourceSize>(defaultSourceSize)
  const [uploadedSourceUrl, setUploadedSourceUrl] = useState<string | null>(null)
  const [viewportSize, setViewportSize] = useState(() => ({
    height: window.innerHeight,
    width: window.innerWidth,
  }))
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<BlobPart[]>([])
  const recordingStreamRef = useRef<MediaStream | null>(null)
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

  useEffect(() => {
    return () => {
      if (recordingDownloadUrl) {
        URL.revokeObjectURL(recordingDownloadUrl)
      }
    }
  }, [recordingDownloadUrl])

  useEffect(() => {
    return () => {
      if (renderDownloadUrl) {
        URL.revokeObjectURL(renderDownloadUrl)
      }
    }
  }, [renderDownloadUrl])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }

      recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => {
    exportCanvasRef.current = canvas
  }, [])

  const clearRenderResult = () => {
    if (renderDownloadUrl) {
      URL.revokeObjectURL(renderDownloadUrl)
    }

    setRenderDownloadUrl(null)
    setRenderFilename('')
    setRenderProgress(0)
    setRenderState('idle')
  }

  const handleSourceDurationChange = (durationSeconds: number | null) => {
    if (durationSeconds === null) {
      return
    }

    setRenderDuration((currentDuration) =>
      resolveRenderExportDurationFromSource({
        fallbackDurationSeconds: currentDuration,
        sourceDurationSeconds: durationSeconds,
      }),
    )
    clearRenderResult()
  }

  const handleSettingChange = (key: LiquidGlassSettingKey, value: number) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      [key]: value,
    }))
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
    clearRenderResult()
  }

  const handleFieldEnabledChange = (value: boolean) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      fieldEnabled: value,
    }))
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
    clearRenderResult()
  }

  const handleFieldFadeModeChange = (value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey]) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      fieldFadeMode: value,
    }))
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
    clearRenderResult()
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
    clearRenderResult()
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
    clearRenderResult()
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
    clearRenderResult()
  }

  const resetSource = () => {
    setGlassSource(defaultGlassSource)
    setUploadedSourceUrl(null)
    setSourceFrameMode('viewport')
    setSourceNaturalSize(defaultSourceSize)
    setSourceFrameSize(defaultSourceSize)
    setCopyState('idle')
    setBriefState('idle')
    clearRenderResult()
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current

    if (recorder?.state === 'recording') {
      recorder.stop()
      return
    }

    recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
    recordingStreamRef.current = null
    mediaRecorderRef.current = null
    setRecordingState((currentState) => (currentState === 'recording' ? 'idle' : currentState))
  }

  const startRecording = () => {
    const canvas = exportCanvasRef.current

    if (!canvas || !('captureStream' in canvas) || typeof MediaRecorder === 'undefined') {
      setRecordingState('unsupported')
      return
    }

    if (recordingDownloadUrl) {
      URL.revokeObjectURL(recordingDownloadUrl)
      setRecordingDownloadUrl(null)
      setRecordingFilename('')
    }

    const safeRecordingFps = normalizeRecordingFps(recordingFps)

    let stream: MediaStream | null = null
    try {
      stream = canvas.captureStream(safeRecordingFps)
      const recordingStream = stream

      const mimeType = chooseSupportedRecordingMimeType((candidate) =>
        typeof MediaRecorder.isTypeSupported === 'function'
          ? MediaRecorder.isTypeSupported(candidate)
          : false,
      )
      const bitsPerSecond = Math.min(
        20_000_000,
        Math.max(2_000_000, Math.round(canvas.width * canvas.height * safeRecordingFps * 0.12)),
      )

      recordingChunksRef.current = []
      recordingStreamRef.current = recordingStream

      const recorder = buildRecordingOptionCandidates(mimeType, bitsPerSecond).reduce<MediaRecorder | null>(
        (createdRecorder, options) => {
          if (createdRecorder) {
            return createdRecorder
          }

          try {
            return new MediaRecorder(recordingStream, options)
          } catch {
            return null
          }
        },
        null,
      )

      if (!recorder) {
        throw new Error('MediaRecorder could not be created')
      }

      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }
      recorder.onerror = () => {
        recordingStream.getTracks().forEach((track) => track.stop())
        recordingStreamRef.current = null
        mediaRecorderRef.current = null
        setRecordingState('failed')
      }
      recorder.onstop = () => {
        recordingStream.getTracks().forEach((track) => track.stop())
        recordingStreamRef.current = null
        mediaRecorderRef.current = null

        const recorderMimeType = recorder.mimeType || mimeType
        const blob = new Blob(recordingChunksRef.current, { type: recorderMimeType })

        if (blob.size <= 0) {
          setRecordingState('failed')
          return
        }

        setRecordingFilename(buildRecordingExportFilename(new Date(), recorderMimeType))
        setRecordingDownloadUrl(URL.createObjectURL(blob))
        setRecordingState('ready')
      }

      recorder.start(250)
      setRecordingState('recording')
    } catch {
      stream?.getTracks().forEach((track) => track.stop())
      recordingStreamRef.current = null
      mediaRecorderRef.current = null
      setRecordingState('failed')
    }
  }

  const startRenderExport = async () => {
    if (renderState === 'rendering') {
      return
    }

    if (renderDownloadUrl) {
      URL.revokeObjectURL(renderDownloadUrl)
      setRenderDownloadUrl(null)
      setRenderFilename('')
    }

    if (glassSource.kind === 'video') {
      const availability = getMp4RenderAvailability({
        hasVideoEncoder: typeof VideoEncoder !== 'undefined',
        isSecureContext: window.isSecureContext,
      })

      if (availability !== 'ready') {
        setRenderProgress(0)
        setRenderState(availability)
        return
      }
    }

    setRenderProgress(0)
    setRenderState('rendering')

    try {
      const now = new Date()
      const blob =
        glassSource.kind === 'image'
          ? await import('./liquid-glass/renderImageExport').then(({ renderImageExport }) =>
              renderImageExport({
                settings: activeSettings,
                sizePreset: renderSizePreset,
                source: glassSource,
                sourceNaturalSize,
                timeSeconds: performance.now() / 1000,
              }),
            )
          : await import('./liquid-glass/renderMp4Export').then(({ renderMp4Export }) =>
              renderMp4Export({
                durationSeconds: renderDuration,
                fps: renderFps,
                onProgress: setRenderProgress,
                settings: activeSettings,
                sizePreset: renderSizePreset,
                source: glassSource,
                sourceNaturalSize,
              }),
            )

      setRenderFilename(
        glassSource.kind === 'image' ? buildRenderImageFilename(now) : buildRenderMp4Filename(now),
      )
      setRenderDownloadUrl(URL.createObjectURL(blob))
      setRenderState('ready')
    } catch (error) {
      const availability = getMp4RenderAvailability({
        hasVideoEncoder: typeof VideoEncoder !== 'undefined',
        isSecureContext: window.isSecureContext,
      })

      if (glassSource.kind === 'video' && availability !== 'ready') {
        setRenderState(availability)
        return
      }

      console.error(error)
      setRenderState('failed')
    }
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
          onCanvasReady={handleCanvasReady}
          onDurationChange={handleSourceDurationChange}
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
            <summary>{copy.exportResult}</summary>
            <div className="export-subsection">
              <span className="export-subsection__title">{copy.exportPreviewRecord}</span>
            <div className="source-dimensions">
              <label>
                <span>{copy.exportFps}</span>
                <input
                  max={60}
                  min={12}
                  onChange={(event) =>
                    setRecordingFps(normalizeRecordingFps(Number(event.currentTarget.value)))
                  }
                  step={1}
                  type="number"
                  value={recordingFps}
                />
              </label>
              <div className="export-status" data-state={recordingState}>
                {recordingState === 'recording'
                  ? copy.exporting
                  : recordingState === 'ready'
                    ? copy.exportReady
                    : recordingState === 'unsupported'
                      ? copy.exportUnsupported
                      : recordingState === 'failed'
                        ? copy.exportFailed
                        : `${recordingFps} fps`}
              </div>
            </div>
            <div className="export-actions">
              {recordingState === 'recording' ? (
                <button onClick={stopRecording} type="button">
                  {copy.stopExport}
                </button>
              ) : (
                <button onClick={startRecording} type="button">
                  {copy.startExport}
                </button>
              )}
              {recordingDownloadUrl ? (
                <a className="export-download" download={recordingFilename} href={recordingDownloadUrl}>
                  {copy.downloadExport}
                </a>
              ) : null}
            </div>
            <small className="field-toggle__hint">
              {copy.exportHint}
            </small>
            </div>
            <div className="export-subsection">
              <span className="export-subsection__title">
                {glassSource.kind === 'image' ? copy.renderPng : copy.renderMp4}
              </span>
              {glassSource.kind === 'video' ? (
                <div className="source-dimensions">
                  <label>
                    <span>{copy.exportFps}</span>
                    <input
                      max={60}
                      min={24}
                      disabled={renderState === 'rendering'}
                      onChange={(event) => {
                        setRenderFps(normalizeRenderExportFps(Number(event.currentTarget.value)))
                        clearRenderResult()
                      }}
                      step={1}
                      type="number"
                      value={renderFps}
                    />
                  </label>
                  <label>
                    <span>{copy.renderDuration}</span>
                    <input
                      max={600}
                      min={1}
                      disabled={renderState === 'rendering'}
                      onChange={(event) => {
                        setRenderDuration(normalizeRenderExportDuration(Number(event.currentTarget.value)))
                        clearRenderResult()
                      }}
                      step={0.5}
                      type="number"
                      value={renderDuration}
                    />
                  </label>
                </div>
              ) : null}
              <div className="fade-mode">
                <span>{copy.renderSize}</span>
                <div className="source-size-mode">
                  {renderSizeOptions.map((option) => (
                    <button
                      aria-pressed={renderSizePreset === option.value}
                      disabled={renderState === 'rendering'}
                      key={option.value}
                      onClick={() => {
                        setRenderSizePreset(option.value)
                        clearRenderResult()
                      }}
                      type="button"
                    >
                      {copy[option.copyKey]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="source-dimensions">
                <div className="export-status" data-state={renderState}>
                  {renderState === 'rendering'
                    ? `${copy.rendering} ${Math.round(renderProgress * 100)}%`
                    : renderState === 'ready'
                      ? glassSource.kind === 'image'
                        ? copy.renderPngReady
                        : copy.renderReady
                      : renderState === 'needs-https'
                        ? copy.renderNeedsHttps
                      : renderState === 'unsupported'
                        ? copy.renderUnsupported
                        : renderState === 'failed'
                          ? copy.renderFailed
                          : glassSource.kind === 'image'
                            ? copy.renderPngIdle
                            : `${renderFps} fps`}
                </div>
                <div className="export-actions">
                  <button
                    disabled={renderState === 'rendering'}
                    onClick={startRenderExport}
                    type="button"
                  >
                    {glassSource.kind === 'image' ? copy.renderPng : copy.renderMp4}
                  </button>
                  {renderDownloadUrl ? (
                    <a className="export-download" download={renderFilename} href={renderDownloadUrl}>
                      {glassSource.kind === 'image' ? copy.downloadPng : copy.downloadMp4}
                    </a>
                  ) : null}
                </div>
              </div>
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
