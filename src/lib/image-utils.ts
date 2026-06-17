/**
 * 图片处理工具函数
 * 基于 Canvas API 在本地完成缩放与格式转换，不依赖服务端
 */

export interface ImageConvertOptions {
  quality?: number // 0~1，仅对有损格式（JPEG/WebP/AVIF）生效
  scalePercent?: number // 相对原图缩放百分比
  maxWidth?: number
  maxHeight?: number
  smoothingQuality?: ImageSmoothingQuality // 缩放插值质量，影响速度与清晰度
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
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
function resolveDimensions(
  img: HTMLImageElement,
  options: ImageConvertOptions,
): { w: number; h: number } {
  let w = img.width
  let h = img.height

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

  return { w: Math.max(1, w), h: Math.max(1, h) }
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
