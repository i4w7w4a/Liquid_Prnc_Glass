import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import demoPoster from './assets/demo-poster.png'
import demoVideo from './assets/demo-video.web.mp4'
import {
  buildRecordingOptionCandidates,
  WebGLVideoEdgeGlass,
  buildDemoGlassSource,
  defaultLiquidGlassSettings,
  formatLiquidGlassValue,
  generateLiquidGlassIntegrationBrief,
  buildRecordingExportFilename,
  chooseSupportedRecordingMimeType,
  buildRenderImageFilename,
  buildRenderMp4Filename,
  getMp4RenderAvailability,
  getDemoGlassSourceMode,
  liquidGlassControls,
  normalizeRenderExportDuration,
  normalizeRenderExportFps,
  normalizeRecordingFps,
  normalizeLiquidGlassSettings,
  parseLiquidGlassPreset,
  resolveControlPanelQuickAction,
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
  ControlPanelQuickAction,
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
type FlowModeCopyKey =
  | 'flowClockwise'
  | 'flowCounterclockwise'
  | 'flowDown'
  | 'flowFromCenter'
  | 'flowLeft'
  | 'flowNone'
  | 'flowOrganicCurl'
  | 'flowRight'
  | 'flowShear'
  | 'flowStandingWave'
  | 'flowToCenter'
  | 'flowUp'
type ShapeCopyKey =
  | 'shapeBlob'
  | 'shapeChipped'
  | 'shapeCircle'
  | 'shapeDiamond'
  | 'shapeEllipse'
  | 'shapeHexagon'
  | 'shapePetal'
  | 'shapeRect'
  | 'shapeTorn'
  | 'shapeTriangle'
  | 'shapeWave'
type ShapeIconKind =
  | 'blob'
  | 'chipped'
  | 'circle'
  | 'diamond'
  | 'ellipse'
  | 'hexagon'
  | 'petal'
  | 'rect'
  | 'torn'
  | 'triangle'
  | 'wave'

const coreControls = liquidGlassControls.filter((control) => control.section === 'core')
const colorControls = liquidGlassControls.filter((control) => control.section === 'color')
const fieldControls = liquidGlassControls.filter((control) => control.section === 'field')
const flowControls = liquidGlassControls.filter((control) => control.section === 'flow')
const primaryFlowControlKeys: LiquidGlassSettingKey[] = ['flowSpeed', 'flowStrength', 'flowScale']
const primaryFlowControls = flowControls.filter((control) => primaryFlowControlKeys.includes(control.key))
const advancedFlowControls = flowControls.filter((control) => !primaryFlowControlKeys.includes(control.key))
const geometryControls = liquidGlassControls.filter((control) => control.section === 'geometry')
const regionControls = liquidGlassControls.filter((control) => control.section === 'region')
const defaultSourceSize: SourceSize = { width: 1280, height: 720 }
const demoGlassSourceAssets = {
  motionSrc: demoVideo,
  posterSrc: demoPoster,
}
const defaultGlassSource = buildDemoGlassSource({ ...demoGlassSourceAssets, mode: 'motion' })
const stillDemoGlassSource = buildDemoGlassSource({ ...demoGlassSourceAssets, mode: 'still' })
const fieldFadeOptions: {
  copyKey: 'fadeMask' | 'fadeDissolve'
  value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey]
}[] = [
  { value: 0, copyKey: 'fadeMask' },
  { value: 1, copyKey: 'fadeDissolve' },
]
const flowModeOptions = [
  { value: 0, copyKey: 'flowNone' },
  { value: 1, copyKey: 'flowLeft' },
  { value: 2, copyKey: 'flowRight' },
  { value: 3, copyKey: 'flowUp' },
  { value: 4, copyKey: 'flowDown' },
  { value: 5, copyKey: 'flowClockwise' },
  { value: 6, copyKey: 'flowCounterclockwise' },
  { value: 7, copyKey: 'flowFromCenter' },
  { value: 8, copyKey: 'flowToCenter' },
  { value: 9, copyKey: 'flowOrganicCurl' },
  { value: 10, copyKey: 'flowShear' },
  { value: 11, copyKey: 'flowStandingWave' },
] satisfies { copyKey: FlowModeCopyKey; value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey] }[]
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
const shapeOptions = [
  { value: 0, copyKey: 'shapeRect', icon: 'rect', irregular: false },
  { value: 1, copyKey: 'shapeCircle', icon: 'circle', irregular: false },
  { value: 2, copyKey: 'shapeEllipse', icon: 'ellipse', irregular: false },
  { value: 3, copyKey: 'shapeDiamond', icon: 'diamond', irregular: false },
  { value: 4, copyKey: 'shapeTriangle', icon: 'triangle', irregular: false },
  { value: 5, copyKey: 'shapeHexagon', icon: 'hexagon', irregular: false },
  { value: 6, copyKey: 'shapeBlob', icon: 'blob', irregular: true },
  { value: 7, copyKey: 'shapeWave', icon: 'wave', irregular: true },
  { value: 8, copyKey: 'shapeChipped', icon: 'chipped', irregular: true },
  { value: 9, copyKey: 'shapePetal', icon: 'petal', irregular: true },
  { value: 10, copyKey: 'shapeTorn', icon: 'torn', irregular: true },
] satisfies {
  copyKey: ShapeCopyKey
  icon: ShapeIconKind
  irregular: boolean
  value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey]
}[]

const uiCopy = {
  en: {
    coreOptics: 'Core optics',
    centerField: 'Center field',
    brief: 'Brief',
    briefCopied: 'Brief copied',
    copy: 'Copy',
    copied: 'Copied',
    color: 'Color',
    colorHint: 'Neutral values preserve the source after the corrected sRGB output pass.',
    colorQuickAction: 'Open only color controls',
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
    flow: 'Flow',
    flowAdvanced: 'Flow advanced',
    flowClockwise: 'Clockwise',
    flowCounterclockwise: 'Counter',
    flowDirection: 'Direction',
    flowDown: 'Down',
    flowFromCenter: 'From center',
    flowHidden: 'Flow is quiet until enabled.',
    flowHint: 'Flow perturbs the optical normal before IOR, so zero IOR stays clean.',
    flowLeft: 'Left',
    flowNone: 'Still',
    flowOrganicCurl: 'Curl',
    flowQuickAction: 'Collapse all controls',
    flowRight: 'Right',
    flowShear: 'Shear',
    flowStandingWave: 'Standing',
    flowToCenter: 'To center',
    flowUp: 'Up',
    hideStarterVideo: 'Remove starter video',
    enableFlow: 'Enable optical flow',
    geometry: 'Geometry',
    import: 'Import',
    imported: 'Imported',
    integrationBrief: 'Integration brief',
    invalid: 'Invalid',
    lockAspect: 'Lock aspect',
    manualSize: 'Manual',
    naturalSize: 'Natural',
    preset: 'Preset',
    quickControls: 'Quick controls',
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
    showStarterVideo: 'Restore starter video',
    sourceHint: 'Upload an image or a moving source. Remove starter video swaps the MP4 demo for a still poster.',
    sourceKindImage: 'Image',
    sourceKindVideo: 'Motion',
    sourceSize: 'Source size',
    shapeBlob: 'Soft blob',
    shapeChipped: 'Chipped frame',
    shapeCircle: 'Circle',
    shapeDiamond: 'Diamond',
    shapeEllipse: 'Ellipse',
    shapeHexagon: 'Hexagon',
    shapePetal: 'Petal lens',
    shapePicker: 'Shape',
    shapeRect: 'Rounded rect',
    shapeTorn: 'Torn oval',
    shapeTriangle: 'Triangle',
    shapeWarpHint: 'Irregular shapes use stable edge variation; flow lives in its own optics layer.',
    shapeWave: 'Wave capsule',
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
    color: 'Цвет',
    colorHint: 'Нейтральные значения сохраняют исходник после исправленного sRGB-выхода.',
    colorQuickAction: 'Открыть только настройки цвета',
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
    flow: 'Поток',
    flowAdvanced: 'Глубина потока',
    flowClockwise: 'По часовой',
    flowCounterclockwise: 'Против',
    flowDirection: 'Направление',
    flowDown: 'Вниз',
    flowFromCenter: 'От центра',
    flowHidden: 'Поток спит, пока не включен.',
    flowHint: 'Поток меняет оптическую нормаль до IOR, поэтому нулевой IOR остается чистым.',
    flowLeft: 'Влево',
    flowNone: 'Покой',
    flowOrganicCurl: 'Вихрь',
    flowQuickAction: 'Свернуть все настройки',
    flowRight: 'Вправо',
    flowShear: 'Сдвиг',
    flowStandingWave: 'Стоячая',
    flowToCenter: 'К центру',
    flowUp: 'Вверх',
    hideStarterVideo: 'Убрать стартовое видео',
    enableFlow: 'Включить оптический поток',
    geometry: 'Геометрия',
    import: 'Импорт',
    imported: 'Импортировано',
    integrationBrief: 'ТЗ для агента',
    invalid: 'Неверно',
    lockAspect: 'Держать пропорции',
    manualSize: 'Вручную',
    naturalSize: 'Натуральный',
    preset: 'Пресет',
    quickControls: 'Быстрые настройки',
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
    showStarterVideo: 'Вернуть стартовое видео',
    sourceHint: 'Загрузи изображение или движущийся source. Убрать стартовое видео заменяет MP4-демо на статичный постер.',
    sourceKindImage: 'Изображение',
    sourceKindVideo: 'Движение',
    sourceSize: 'Размер исходника',
    shapeBlob: 'Мягкий blob',
    shapeChipped: 'Сколотая рамка',
    shapeCircle: 'Круг',
    shapeDiamond: 'Ромб',
    shapeEllipse: 'Эллипс',
    shapeHexagon: 'Шестиугольник',
    shapePetal: 'Лепесток',
    shapePicker: 'Форма',
    shapeRect: 'Скругленный квадрат',
    shapeTorn: 'Рваный овал',
    shapeTriangle: 'Треугольник',
    shapeWarpHint: 'Неровные формы стабильны по краю; поток живет отдельным оптическим слоем.',
    shapeWave: 'Волновая капсула',
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
      help: 'Подписанная оптическая сила. 0 - чистый исходник; минус разворачивает преломление.',
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
  exposure: {
    en: {
      label: 'Exposure',
      help: 'EV-style gain after optical composition. 0 preserves the source.',
    },
    ru: {
      label: 'Экспозиция',
      help: 'EV-усиление после оптической сборки. 0 сохраняет исходник.',
    },
  },
  brightness: {
    en: {
      label: 'Brightness',
      help: 'Fine linear lift for source matching. Extremes are removed for softer tuning.',
    },
    ru: {
      label: 'Яркость',
      help: 'Тонкий линейный подъем для подгонки исходника. Крайние значения убраны.',
    },
  },
  contrast: {
    en: {
      label: 'Contrast',
      help: 'Midpoint contrast around neutral 0.5. 1 preserves the source.',
    },
    ru: {
      label: 'Контраст',
      help: 'Контраст вокруг средней точки 0.5. 1 сохраняет исходник.',
    },
  },
  saturation: {
    en: {
      label: 'Saturation',
      help: 'Luma-based color intensity. 1 preserves the source.',
    },
    ru: {
      label: 'Насыщенность',
      help: 'Интенсивность цвета через luma-смешивание. 1 сохраняет исходник.',
    },
  },
  temperature: {
    en: {
      label: 'Temperature',
      help: 'Warm-cool balance for matching the source mood.',
    },
    ru: {
      label: 'Температура',
      help: 'Баланс теплее-холоднее для подстройки настроения исходника.',
    },
  },
  tint: {
    en: {
      label: 'Tint',
      help: 'Green-magenta balance for fine source correction.',
    },
    ru: {
      label: 'Оттенок',
      help: 'Баланс зеленый-магента для тонкой коррекции исходника.',
    },
  },
  gamma: {
    en: {
      label: 'Gamma',
      help: 'Tonal curve applied before output color-space conversion. 1 is neutral.',
    },
    ru: {
      label: 'Гамма',
      help: 'Тональная кривая перед выходным color-space conversion. 1 нейтрально.',
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
  shapeWarp: {
    en: {
      label: 'Shape warp',
      help: 'Stable edge irregularity for organic silhouettes.',
    },
    ru: {
      label: 'Неровность формы',
      help: 'Стабильная неровность края для органических силуэтов.',
    },
  },
  flowSpeed: {
    en: {
      label: 'Flow speed',
      help: 'Temporal phase speed for the analytic optical flow.',
    },
    ru: {
      label: 'Скорость потока',
      help: 'Скорость временной фазы аналитического оптического потока.',
    },
  },
  flowStrength: {
    en: {
      label: 'Flow strength',
      help: 'How strongly flow bends the optical normal before IOR is applied.',
    },
    ru: {
      label: 'Сила потока',
      help: 'Насколько поток сгибает оптическую нормаль до применения IOR.',
    },
  },
  flowScale: {
    en: {
      label: 'Flow scale',
      help: 'Spatial scale of the moving surface field.',
    },
    ru: {
      label: 'Масштаб потока',
      help: 'Пространственный масштаб движущегося поля поверхности.',
    },
  },
  flowTurbulence: {
    en: {
      label: 'Turbulence',
      help: 'Curl-like organic breakup blended into the base flow.',
    },
    ru: {
      label: 'Турбулентность',
      help: 'Вихревая органика, смешанная с базовым потоком.',
    },
  },
  flowBoundaryDamping: {
    en: {
      label: 'Boundary damping',
      help: 'Softly damps flow near mask boundaries to prevent seams.',
    },
    ru: {
      label: 'Гашение границ',
      help: 'Мягко тушит поток возле границ маски, чтобы не было швов.',
    },
  },
  flowLayerMix: {
    en: {
      label: 'Layer mix',
      help: 'Second phase layer that reduces repetitive pulsing.',
    },
    ru: {
      label: 'Смешение слоев',
      help: 'Второй фазовый слой, который снижает механическую пульсацию.',
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

function ShapeIcon({ icon }: { icon: ShapeIconKind }) {
  return (
    <svg aria-hidden="true" className="shape-icon" focusable="false" viewBox="0 0 48 48">
      {icon === 'rect' ? (
        <path d="M11 9h26c1.1 0 2 .9 2 2v26c0 1.1-.9 2-2 2H11c-1.1 0-2-.9-2-2V11c0-1.1.9-2 2-2Z" />
      ) : icon === 'circle' ? (
        <circle cx="24" cy="24" r="16" />
      ) : icon === 'ellipse' ? (
        <ellipse cx="24" cy="24" rx="18" ry="12" />
      ) : icon === 'diamond' ? (
        <path d="M24 6 42 24 24 42 6 24 24 6Z" />
      ) : icon === 'triangle' ? (
        <path d="M24 7 42 39H6L24 7Z" />
      ) : icon === 'hexagon' ? (
        <path d="M15 8h18l10 16-10 16H15L5 24 15 8Z" />
      ) : icon === 'blob' ? (
        <path d="M14 10c7-6 21-2 25 7 5 10-2 22-13 24-10 2-20-4-22-13-2-8 3-14 10-18Z" />
      ) : icon === 'wave' ? (
        <path d="M9 17c4-7 14-7 20-3 5 3 9 2 12-1 2 8-1 18-9 21-7 4-14-1-20 1-4 1-6 3-7 5-2-8 0-17 4-23Z" />
      ) : icon === 'chipped' ? (
        <path d="M9 9h16l3 5 5-5h6v15l-4 3 4 5v7H24l-4-4-5 4H9V27l5-3-5-4V9Z" />
      ) : icon === 'petal' ? (
        <path d="M24 7c12 7 17 17 12 26-5 8-19 8-24 0C7 24 12 14 24 7Z" />
      ) : (
        <path d="M14 9c9-5 23 0 26 9 2 7-2 10-1 16-7 5-19 8-27 2-7-5-9-15-4-22 2-2 3-3 6-5Z" />
      )}
    </svg>
  )
}

function ColorGlyph() {
  return (
    <svg aria-hidden="true" className="color-glyph" focusable="false" viewBox="0 0 48 48">
      <path d="M24 6v8" />
      <path d="M24 34v8" />
      <path d="M6 24h8" />
      <path d="M34 24h8" />
      <path d="M11.6 11.6l5.7 5.7" />
      <path d="M30.7 30.7l5.7 5.7" />
      <path d="M36.4 11.6l-5.7 5.7" />
      <path d="M17.3 30.7l-5.7 5.7" />
      <circle cx="24" cy="24" r="7.5" />
      <path d="M20 24h8" />
    </svg>
  )
}

function FlowGlyph() {
  return (
    <svg aria-hidden="true" className="flow-glyph" focusable="false" viewBox="0 0 48 48">
      <path d="M12 18c6-9 23-9 29 1" />
      <path d="M36 13l5 6-8 2" />
      <path d="M36 30c-6 9-23 9-29-1" />
      <path d="M12 35l-5-6 8-2" />
      <path d="M16 24c4-4 12-4 16 0" />
    </svg>
  )
}

function FlowModeIcon({ mode }: { mode: number }) {
  const commonProps = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  return (
    <svg aria-hidden="true" className="flow-mode-icon" focusable="false" viewBox="0 0 32 32">
      {mode === 0 ? (
        <path {...commonProps} d="M9 16h14" />
      ) : mode === 1 ? (
        <path {...commonProps} d="M22 8 14 16l8 8M15 16h10" />
      ) : mode === 2 ? (
        <path {...commonProps} d="M10 8l8 8-8 8M7 16h10" />
      ) : mode === 3 ? (
        <path {...commonProps} d="M16 7v18M8 15l8-8 8 8" />
      ) : mode === 4 ? (
        <path {...commonProps} d="M16 7v18M8 17l8 8 8-8" />
      ) : mode === 5 ? (
        <path {...commonProps} d="M10 11a9 9 0 0 1 13 2M23 7v6h-6" />
      ) : mode === 6 ? (
        <path {...commonProps} d="M22 11a9 9 0 0 0-13 2M9 7v6h6" />
      ) : mode === 7 ? (
        <>
          <path {...commonProps} d="M16 16 8 8M16 16l8-8M16 16 8 24M16 16l8 8" />
          <circle cx="16" cy="16" r="2" />
        </>
      ) : mode === 8 ? (
        <>
          <path {...commonProps} d="M8 8l8 8M24 8l-8 8M8 24l8-8M24 24l-8-8" />
          <circle cx="16" cy="16" r="2" />
        </>
      ) : mode === 9 ? (
        <path {...commonProps} d="M10 20c7 8 18-4 10-10-7-5-15 5-8 11" />
      ) : mode === 10 ? (
        <path {...commonProps} d="M7 11h18M7 21h18M11 7l-4 4 4 4M21 17l4 4-4 4" />
      ) : (
        <path {...commonProps} d="M6 16c4-8 8 8 12 0s8 8 12 0" />
      )}
    </svg>
  )
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
  const [sourceReloadKey, setSourceReloadKey] = useState(0)
  const [uploadedSourceUrl, setUploadedSourceUrl] = useState<string | null>(null)
  const [viewportSize, setViewportSize] = useState(() => ({
    height: window.innerHeight,
    width: window.innerWidth,
  }))
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<BlobPart[]>([])
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const controlGroupsRef = useRef<HTMLDivElement>(null)
  const colorGroupRef = useRef<HTMLDetailsElement>(null)
  const sourceFileInputRef = useRef<HTMLInputElement>(null)
  const shapePickerRef = useRef<HTMLDetailsElement>(null)
  const activeSettings = useMemo(() => normalizeLiquidGlassSettings(settings), [settings])
  const activeShape = useMemo(
    () => shapeOptions.find((option) => option.value === activeSettings.shapeType) ?? shapeOptions[0],
    [activeSettings.shapeType],
  )
  const presetJson = useMemo(() => serializeLiquidGlassPreset(activeSettings), [activeSettings])
  const integrationBrief = useMemo(
    () => generateLiquidGlassIntegrationBrief(activeSettings),
    [activeSettings],
  )
  const [presetDraft, setPresetDraft] = useState(presetJson)
  const copy = uiCopy[language]
  const demoSourceMode = getDemoGlassSourceMode(glassSource, demoGlassSourceAssets)
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

  const handleFlowEnabledChange = (value: boolean) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      flowEnabled: value,
    }))
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
    clearRenderResult()
  }

  const handleFlowModeChange = (value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey]) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      flowMode: value,
      flowEnabled: value === 0 ? currentSettings.flowEnabled : true,
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

  const closeAllControlGroups = () => {
    controlGroupsRef.current
      ?.querySelectorAll<HTMLDetailsElement>('details.control-group')
      .forEach((group) => {
        group.open = false
      })
  }

  const applyPanelQuickAction = (action: ControlPanelQuickAction) => {
    const plan = resolveControlPanelQuickAction(action)

    if (plan.collapseAll) {
      closeAllControlGroups()
    }

    if (plan.openGroup === 'color' && colorGroupRef.current) {
      colorGroupRef.current.open = true
      colorGroupRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    controlGroupsRef.current?.scrollTo({ behavior: 'smooth', top: 0 })
  }

  const handleShapeTypeChange = (value: LiquidGlassSettings[LiquidGlassDiscreteSettingKey]) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      shapeType: value,
    }))
    setCopyState('idle')
    setBriefState('idle')
    setImportState('idle')
    clearRenderResult()
    shapePickerRef.current?.removeAttribute('open')
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
    setSourceReloadKey((currentKey) => currentKey + 1)
    setSourceFrameMode('natural')
    setCopyState('idle')
    setBriefState('idle')
    clearRenderResult()
  }

  const resetSource = () => {
    setGlassSource(defaultGlassSource)
    setUploadedSourceUrl(null)
    setSourceReloadKey((currentKey) => currentKey + 1)
    setSourceFrameMode('viewport')
    setSourceNaturalSize(defaultSourceSize)
    setSourceFrameSize(defaultSourceSize)
    setCopyState('idle')
    setBriefState('idle')
    clearRenderResult()
  }

  const toggleStarterVideo = () => {
    const nextSource = demoSourceMode === 'still' ? defaultGlassSource : stillDemoGlassSource

    setGlassSource(nextSource)
    setUploadedSourceUrl(null)
    setSourceReloadKey((currentKey) => currentKey + 1)
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
          key={`${glassSource.kind}:${glassSource.src}:${sourceReloadKey}`}
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
        <div className="control-panel__rail" aria-label={copy.quickControls}>
          <button
            aria-label={copy.colorQuickAction}
            className="color-quick-button"
            onClick={() => applyPanelQuickAction('color-only')}
            title={copy.colorQuickAction}
            type="button"
          >
            <ColorGlyph />
          </button>
          <button
            aria-label={copy.flowQuickAction}
            className="flow-quick-button"
            onClick={() => applyPanelQuickAction('collapse-all')}
            title={copy.flowQuickAction}
            type="button"
          >
            <FlowGlyph />
          </button>
        </div>
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
        <div className="control-panel__controls" ref={controlGroupsRef}>
          <details className="control-group" open>
            <summary>{copy.source}</summary>
            <div className="source-toolbar">
              <button onClick={resetSource} type="button">
                {copy.demoSource}
              </button>
              <button onClick={() => sourceFileInputRef.current?.click()} type="button">
                {copy.uploadSource}
              </button>
              <button
                className="source-toolbar__toggle"
                disabled={demoSourceMode === 'custom'}
                onClick={toggleStarterVideo}
                type="button"
              >
                {demoSourceMode === 'still' ? copy.showStarterVideo : copy.hideStarterVideo}
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
          <details className="control-group control-group--color" ref={colorGroupRef}>
            <summary>{copy.color}</summary>
            <small className="field-toggle__hint">
              {copy.colorHint}
            </small>
            {colorControls.map((control) => {
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
            <summary>{copy.geometry}</summary>
            <div className="shape-field">
              <span>{copy.shapePicker}</span>
              <details className="shape-picker" ref={shapePickerRef}>
                <summary>
                  <ShapeIcon icon={activeShape.icon} />
                  <span>{copy[activeShape.copyKey]}</span>
                </summary>
                <div className="shape-picker__menu">
                  {shapeOptions.map((option) => (
                    <button
                      aria-pressed={activeSettings.shapeType === option.value}
                      key={option.value}
                      onClick={() => handleShapeTypeChange(option.value)}
                      title={copy[option.copyKey]}
                      type="button"
                    >
                      <ShapeIcon icon={option.icon} />
                      <span>{copy[option.copyKey]}</span>
                    </button>
                  ))}
                </div>
              </details>
            </div>
            {activeShape.irregular ? (
              <>
                <small className="field-toggle__hint">
                  {copy.shapeWarpHint}
                </small>
                {geometryControls.map((control) => {
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
            ) : null}
          </details>
          <details className="control-group control-group--flow" open>
            <summary>{copy.flow}</summary>
            <label className="field-toggle">
              <input
                checked={activeSettings.flowEnabled}
                onChange={(event) => handleFlowEnabledChange(event.currentTarget.checked)}
                type="checkbox"
              />
              <span>{copy.enableFlow}</span>
            </label>
            <small className="field-toggle__hint">
              {copy.flowHint}
            </small>
            {activeSettings.flowEnabled ? (
              <>
                <div className="flow-mode">
                  <span>{copy.flowDirection}</span>
                  <div className="flow-mode__buttons">
                    {flowModeOptions.map((option) => (
                      <button
                        aria-pressed={activeSettings.flowMode === option.value}
                        key={option.value}
                        onClick={() => handleFlowModeChange(option.value)}
                        title={copy[option.copyKey]}
                        type="button"
                      >
                        <FlowModeIcon mode={option.value} />
                        <span>{copy[option.copyKey]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {primaryFlowControls.map((control) => {
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
                <details className="flow-advanced">
                  <summary>{copy.flowAdvanced}</summary>
                  {advancedFlowControls.map((control) => {
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
              </>
            ) : (
              <p className="control-group__empty">{copy.flowHidden}</p>
            )}
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
