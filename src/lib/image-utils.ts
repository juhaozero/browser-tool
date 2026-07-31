/**
 * 图片处理工具函数
 * 基于 Canvas API 在本地完成缩放与格式转换，不依赖服务端
 */

import { MAX_IMAGE_DIMENSION } from '@/lib/input-validation'

export interface ImageConvertOptions {
  quality?: number // 0~1，仅对有损格式（JPEG/WebP/AVIF）生效
  scalePercent?: number // 相对原图缩放百分比
  maxWidth?: number
  maxHeight?: number
  smoothingQuality?: ImageSmoothingQuality // 缩放插值质量，影响速度与清晰度
}

/** 校验原图单边尺寸，避免解码超大图导致浏览器 OOM */
export function validateImageDimensions(width: number, height: number): void {
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error(`图片尺寸过大，单边不得超过 ${MAX_IMAGE_DIMENSION}px`)
  }
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        validateImageDimensions(img.width, img.height)
        resolve(img)
      } catch (e) {
        reject(e instanceof Error ? e : new Error('图片尺寸无效'))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.src = url
  })
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('转换失败'))),
      mime,
      quality,
    )
  })
}

/** 根据缩放比例与最大宽高约束计算输出尺寸 */
function resolveDimensionsFromSize(
  sourceW: number,
  sourceH: number,
  options: ImageConvertOptions,
): { w: number; h: number } {
  let w = sourceW
  let h = sourceH

  if (options.scalePercent && options.scalePercent !== 100) {
    w = Math.round((w * options.scalePercent) / 100)
    h = Math.round((h * options.scalePercent) / 100)
  }

  if (options.maxWidth && w > options.maxWidth) {
    h = Math.round((h * options.maxWidth) / w)
    w = options.maxWidth
  }
  if (options.maxHeight && h > options.maxHeight) {
    w = Math.round((w * options.maxHeight) / h)
    h = options.maxHeight
  }

  return capDimensions(Math.max(1, w), Math.max(1, h), MAX_IMAGE_DIMENSION)
}

function resolveDimensions(
  img: HTMLImageElement,
  options: ImageConvertOptions,
): { w: number; h: number } {
  return resolveDimensionsFromSize(img.width, img.height, options)
}

/** 根据原图尺寸与转换选项估算输出宽高（供 UI 预览） */
export function computeOutputDimensions(
  sourceW: number,
  sourceH: number,
  options: Pick<ImageConvertOptions, 'scalePercent' | 'maxWidth' | 'maxHeight'> = {},
): { w: number; h: number } {
  return resolveDimensionsFromSize(sourceW, sourceH, options)
}

/** 等比缩放到不超过 maxDim，防止超大 Canvas 导致浏览器卡死 */
function capDimensions(w: number, h: number, maxDim: number): { w: number; h: number } {
  if (w <= maxDim && h <= maxDim) return { w, h }
  const ratio = Math.min(maxDim / w, maxDim / h)
  return {
    w: Math.max(1, Math.round(w * ratio)),
    h: Math.max(1, Math.round(h * ratio)),
  }
}

export async function resizeImage(
  file: File,
  width: number,
  height: number,
  keepAspect = true,
  smoothingQuality: ImageSmoothingQuality = 'high',
): Promise<HTMLCanvasElement> {
  const img = await loadImage(file)
  let w = width
  let h = height
  if (keepAspect) {
    const ratio = Math.min(width / img.width, height / img.height)
    w = Math.round(img.width * ratio)
    h = Math.round(img.height * ratio)
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = smoothingQuality
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

export async function convertImageFormat(
  file: File,
  mime: string,
  options: ImageConvertOptions = {},
): Promise<Blob> {
  const { quality = 0.92, smoothingQuality = 'high' } = options
  const img = await loadImage(file)
  const { w, h } = resolveDimensions(img, options)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = smoothingQuality

  // JPEG 不支持透明，先铺白底
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)
  return canvasToBlob(canvas, mime, quality)
}

/** 生成正方形 favicon，输出 PNG（浏览器原生 ICO 编码较复杂，此处简化） */
export async function imageToIco(
  file: File,
  size = 32,
  smoothingQuality: ImageSmoothingQuality = 'high',
): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = smoothingQuality
  ctx.drawImage(img, 0, 0, size, size)
  return canvasToBlob(canvas, 'image/png')
}

export interface IcoPngFrame {
  /** 边长；≥256 时目录项宽高写 0 */
  size: number
  png: Uint8Array
}

/**
 * 将一或多张 PNG 打包为标准 ICO（Vista+ PNG 内嵌格式）
 * @see https://en.wikipedia.org/wiki/ICO_(file_format)
 */
export function encodeIco(frames: IcoPngFrame[]): Blob {
  if (frames.length === 0) throw new Error('ICO 至少需要一张图片')
  if (frames.length > 255) throw new Error('ICO 图像数量过多')

  for (const frame of frames) {
    if (frame.size < 1 || frame.size > 256) {
      throw new Error('ICO 单边尺寸须在 1–256px')
    }
    if (frame.png.byteLength < 8) throw new Error('PNG 数据无效')
    // PNG signature
    if (
      frame.png[0] !== 0x89 ||
      frame.png[1] !== 0x50 ||
      frame.png[2] !== 0x4e ||
      frame.png[3] !== 0x47
    ) {
      throw new Error('ICO 内嵌数据必须是 PNG')
    }
  }

  const count = frames.length
  const headerSize = 6 + 16 * count
  let offset = headerSize
  const entries = frames.map((frame) => {
    const entry = {
      width: frame.size >= 256 ? 0 : frame.size,
      height: frame.size >= 256 ? 0 : frame.size,
      bytes: frame.png.byteLength,
      offset,
    }
    offset += frame.png.byteLength
    return entry
  })

  const buffer = new ArrayBuffer(offset)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type = ICO
  view.setUint16(4, count, true)

  let entryAt = 6
  for (const entry of entries) {
    view.setUint8(entryAt, entry.width)
    view.setUint8(entryAt + 1, entry.height)
    view.setUint8(entryAt + 2, 0) // color count
    view.setUint8(entryAt + 3, 0) // reserved
    view.setUint16(entryAt + 4, 1, true) // planes
    view.setUint16(entryAt + 6, 32, true) // bit count
    view.setUint32(entryAt + 8, entry.bytes, true)
    view.setUint32(entryAt + 12, entry.offset, true)
    entryAt += 16
  }

  frames.forEach((frame, i) => {
    bytes.set(frame.png, entries[i].offset)
  })

  return new Blob([buffer], { type: 'image/x-icon' })
}

async function rasterToPngBytes(
  img: HTMLImageElement,
  size: number,
  smoothingQuality: ImageSmoothingQuality,
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = smoothingQuality
  // 等比居中绘制，透明底
  const scale = Math.min(size / img.width, size / img.height)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const x = Math.floor((size - w) / 2)
  const y = Math.floor((size - h) / 2)
  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(img, x, y, w, h)
  const blob = await canvasToBlob(canvas, 'image/png')
  return new Uint8Array(await blob.arrayBuffer())
}

/** PNG/JPG → 真正的 .ico（可含多尺寸） */
export async function imageToIcoFile(
  file: File,
  sizes: number[],
  smoothingQuality: ImageSmoothingQuality = 'high',
): Promise<Blob> {
  const unique = [...new Set(sizes.filter((s) => s >= 1 && s <= 256))].sort((a, b) => a - b)
  if (unique.length === 0) throw new Error('请至少选择一个有效尺寸')
  const img = await loadImage(file)
  const frames: IcoPngFrame[] = []
  for (const size of unique) {
    frames.push({ size, png: await rasterToPngBytes(img, size, smoothingQuality) })
  }
  return encodeIco(frames)
}

export interface ImageToSvgOptions {
  /** 限制输出 SVG 宽高（等比），不传则用原图尺寸 */
  maxSize?: number
  /** 内嵌位图 MIME，默认 image/png */
  embedMime?: 'image/png' | 'image/jpeg'
  jpegQuality?: number
  smoothingQuality?: ImageSmoothingQuality
}

/** PNG/JPG → SVG（以内嵌 Base64 位图方式，非矢量化描摹） */
export async function imageToSvg(
  file: File,
  options: ImageToSvgOptions = {},
): Promise<string> {
  const {
    maxSize,
    embedMime = 'image/png',
    jpegQuality = 0.92,
    smoothingQuality = 'high',
  } = options
  const img = await loadImage(file)
  let w = img.width
  let h = img.height
  if (maxSize && (w > maxSize || h > maxSize)) {
    const scale = Math.min(maxSize / w, maxSize / h)
    w = Math.max(1, Math.round(w * scale))
    h = Math.max(1, Math.round(h * scale))
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = smoothingQuality
  if (embedMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await canvasToBlob(
    canvas,
    embedMime,
    embedMime === 'image/jpeg' ? jpegQuality : undefined,
  )
  const dataUrl = await blobToDataUrl(blob)
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `  <image width="${w}" height="${h}" href="${dataUrl}" xlink:href="${dataUrl}" />`,
    `</svg>`,
  ].join('\n')
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.readAsDataURL(blob)
  })
}

/** 校验是否为常见位图输入（PNG / JPEG） */
export function assertRasterImageFile(file: File): void {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  const okMime = type === 'image/png' || type === 'image/jpeg' || type === 'image/jpg'
  const okExt = /\.(png|jpe?g)$/.test(name)
  if (!okMime && !okExt) {
    throw new Error('请选择 PNG 或 JPG 图片')
  }
}
