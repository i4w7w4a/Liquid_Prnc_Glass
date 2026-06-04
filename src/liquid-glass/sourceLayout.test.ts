import { describe, expect, it } from 'vitest'
import {
  clampSourceDimension,
  resolveNaturalSourceSize,
  resizeSourceFrameWithAspect,
} from './sourceLayout'

describe('source layout sizing', () => {
  it('uses natural source dimensions when they are available', () => {
    expect(resolveNaturalSourceSize({ width: 1920, height: 1080 })).toEqual({
      width: 1920,
      height: 1080,
    })
  })

  it('falls back to the current frame when natural dimensions are not usable', () => {
    expect(resolveNaturalSourceSize({ width: 0, height: 0 }, { width: 1280, height: 720 })).toEqual({
      width: 1280,
      height: 720,
    })
  })

  it('keeps proportions when resizing a manual source frame', () => {
    expect(
      resizeSourceFrameWithAspect({
        axis: 'width',
        lockAspect: true,
        nextValue: 1000,
        size: { width: 1920, height: 1080 },
      }),
    ).toEqual({ width: 1000, height: 563 })
  })

  it('allows independent manual dimensions when aspect lock is disabled', () => {
    expect(
      resizeSourceFrameWithAspect({
        axis: 'height',
        lockAspect: false,
        nextValue: 640,
        size: { width: 1920, height: 1080 },
      }),
    ).toEqual({ width: 1920, height: 640 })
  })

  it('clamps manual source dimensions to a stable rendering range', () => {
    expect(clampSourceDimension(-20)).toBe(64)
    expect(clampSourceDimension(12000)).toBe(8192)
  })
})
