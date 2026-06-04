export type SourceSize = {
  height: number
  width: number
}

export type SourceResizeAxis = 'height' | 'width'

const maxSourceDimension = 8192
const minSourceDimension = 64

export function clampSourceDimension(value: number) {
  if (!Number.isFinite(value)) {
    return minSourceDimension
  }

  return Math.min(maxSourceDimension, Math.max(minSourceDimension, Math.round(value)))
}

export function resolveNaturalSourceSize(
  naturalSize: SourceSize,
  fallbackSize: SourceSize = { width: 1280, height: 720 },
) {
  if (naturalSize.width > 0 && naturalSize.height > 0) {
    return {
      width: clampSourceDimension(naturalSize.width),
      height: clampSourceDimension(naturalSize.height),
    }
  }

  return {
    width: clampSourceDimension(fallbackSize.width),
    height: clampSourceDimension(fallbackSize.height),
  }
}

export function resizeSourceFrameWithAspect({
  axis,
  lockAspect,
  nextValue,
  size,
}: {
  axis: SourceResizeAxis
  lockAspect: boolean
  nextValue: number
  size: SourceSize
}) {
  const nextDimension = clampSourceDimension(nextValue)

  if (!lockAspect) {
    return axis === 'width'
      ? { ...size, width: nextDimension }
      : { ...size, height: nextDimension }
  }

  const aspect = size.width / Math.max(size.height, 1)

  if (axis === 'width') {
    return {
      width: nextDimension,
      height: clampSourceDimension(nextDimension / Math.max(aspect, 0.001)),
    }
  }

  return {
    width: clampSourceDimension(nextDimension * aspect),
    height: nextDimension,
  }
}
