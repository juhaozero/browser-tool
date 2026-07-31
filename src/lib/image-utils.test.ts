import { describe, expect, it } from 'vitest'
import {
  assertRasterImageFile,
  computeOutputDimensions,
  encodeIco,
  validateImageDimensions,
} from './image-utils'
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

describe('encodeIco', () => {
  const pngSig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])

  it('packs single png frame', async () => {
    const blob = encodeIco([{ size: 32, png: pngSig }])
    const buf = new Uint8Array(await blob.arrayBuffer())
    expect(buf[2]).toBe(1) // type ICO
    expect(buf[4]).toBe(1) // count
    expect(buf[6]).toBe(32) // width
    expect(buf[7]).toBe(32) // height
    // PNG signature starts after header 6 + 16
    expect(buf[22]).toBe(0x89)
    expect(buf[23]).toBe(0x50)
  })

  it('writes 0 for 256px size', async () => {
    const blob = encodeIco([{ size: 256, png: pngSig }])
    const buf = new Uint8Array(await blob.arrayBuffer())
    expect(buf[6]).toBe(0)
    expect(buf[7]).toBe(0)
  })

  it('rejects non-png payload', () => {
    expect(() => encodeIco([{ size: 16, png: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]) }])).toThrow(
      /PNG/,
    )
  })
})

describe('assertRasterImageFile', () => {
  it('accepts png mime', () => {
    expect(() =>
      assertRasterImageFile(new File([], 'a.png', { type: 'image/png' })),
    ).not.toThrow()
  })

  it('rejects gif', () => {
    expect(() =>
      assertRasterImageFile(new File([], 'a.gif', { type: 'image/gif' })),
    ).toThrow(/PNG 或 JPG/)
  })
})
