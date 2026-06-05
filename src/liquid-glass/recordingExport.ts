const recordingMimeTypeCandidates = [
  'video/mp4;codecs=h264',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

const defaultRecordingFps = 30
const maxRecordingFps = 60
const minRecordingFps = 12

export function normalizeRecordingFps(value: number) {
  if (!Number.isFinite(value)) {
    return defaultRecordingFps
  }

  return Math.min(maxRecordingFps, Math.max(minRecordingFps, Math.round(value)))
}

export function chooseSupportedRecordingMimeType(
  isTypeSupported: (mimeType: string) => boolean,
) {
  return recordingMimeTypeCandidates.find((mimeType) => isTypeSupported(mimeType)) ?? 'video/webm'
}

export function buildRecordingOptionCandidates(mimeType: string, bitsPerSecond: number) {
  return [
    {
      mimeType,
      videoBitsPerSecond: bitsPerSecond,
    },
    {
      videoBitsPerSecond: bitsPerSecond,
    },
    {},
  ] satisfies MediaRecorderOptions[]
}

export function getRecordingExtension(mimeType: string) {
  return mimeType.includes('mp4') ? 'mp4' : 'webm'
}

function padTimestampPart(value: number) {
  return value.toString().padStart(2, '0')
}

export function buildRecordingExportFilename(date: Date, mimeType: string) {
  const stamp = [
    date.getFullYear(),
    padTimestampPart(date.getMonth() + 1),
    padTimestampPart(date.getDate()),
    padTimestampPart(date.getHours()),
    padTimestampPart(date.getMinutes()),
    padTimestampPart(date.getSeconds()),
  ].join('-')

  return `liquid-prnc-glass-${stamp}.${getRecordingExtension(mimeType)}`
}
