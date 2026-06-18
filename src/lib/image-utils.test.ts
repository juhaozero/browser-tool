import { describe, expect, it } from 'vitest'
import { computeOutputDimensions, validateImageDimensions } from './image-utils'
import { MAX_IMAGE_DIMENSION } from './input-validation'

describe('validateImageDimensions', () => {
  it('accepts within limit', () => {
    expect(() => validateImageDimensions(1000, 800)).not.toThrow()
  })

  it('rejects oversized image', () => {
    expect(() => validateImageDimensions(MAX_IMAGE_DIMENSION + 1, 100)).toThrow(/过大/)
  })
})

describe('computeOutputDimensions', () => {
  it('caps output to MAX_IMAGE_DIMENSION', () => {
    const { w, h } = computeOutputDimensions(20000, 10000, { scalePercent: 200 })
    expect(w).toBeLessThanOrEqual(MAX_IMAGE_DIMENSION)
    expect(h).toBeLessThanOrEqual(MAX_IMAGE_DIMENSION)
  })
})
