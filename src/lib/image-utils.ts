export interface ImageConvertOptions {
  quality?: number
  scalePercent?: number
  maxWidth?: number
  maxHeight?: number
  smoothingQuality?: ImageSmoothingQuality
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

  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }
  ctx.drawImage(img, 0, 0, w, h)
  return canvasToBlob(canvas, mime, quality)
}

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
