import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Input, Select, ToolPanel, ToolSection } from '@/components/ui'
import { downloadBlob } from '@/lib/download'
import {
  computeOutputDimensions,
  convertImageFormat,
  validateImageDimensions,
} from '@/lib/image-utils'
import {
  MAX_IMAGE_DIMENSION,
  parseIntInRange,
  parseOptionalIntInRange,
} from '@/lib/input-validation'

const FORMAT_OPTIONS = [
  { value: 'image/jpeg', label: 'JPEG（通用，体积小）' },
  { value: 'image/webp', label: 'WebP（现代浏览器，体积更小）' },
  { value: 'image/avif', label: 'AVIF（体积最小，兼容性较弱）' },
  { value: 'image/png', label: 'PNG（无损，适合透明图）' },
]

const SPEED_OPTIONS = [
  { value: 'low', label: '快速（低质量插值）' },
  { value: 'medium', label: '均衡' },
  { value: 'high', label: '高质量（较慢）' },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function suggestFormat(mime: string): string {
  if (mime === 'image/png' || mime === 'image/gif' || mime === 'image/webp') {
    return 'image/webp'
  }
  return 'image/jpeg'
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/png': 'png',
  }
  return map[mime] ?? 'jpg'
}

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 })
  const [format, setFormat] = useState('image/jpeg')
  const [quality, setQuality] = useState('80')
  const [scalePercent, setScalePercent] = useState('100')
  const [maxWidth, setMaxWidth] = useState('')
  const [maxHeight, setMaxHeight] = useState('')
  const [speed, setSpeed] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [compressedSize, setCompressedSize] = useState<number | null>(null)
  const [error, setError] = useState('')

  const previewUrlRef = useRef('')
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    setFile(f)
    setCompressedSize(null)
    setFormat(suggestFormat(f.type))
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(f)
    previewUrlRef.current = url
    setPreview(url)
    setError('')
    const img = new Image()
    img.onload = () => {
      try {
        validateImageDimensions(img.width, img.height)
        setOriginalSize({ w: img.width, h: img.height })
      } catch (e) {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = ''
        setPreview('')
        setFile(null)
        setOriginalSize({ w: 0, h: 0 })
        setError(e instanceof Error ? e.message : '图片尺寸无效')
      }
    }
    img.onerror = () => setError('图片加载失败')
    img.src = url
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [])

  const buildOptions = useCallback(() => {
    const scaleParsed = parseIntInRange(scalePercent, 10, 200, '缩放比例')
    if (!scaleParsed.ok) return { ok: false as const, error: scaleParsed.error }
    const maxWidthParsed = parseOptionalIntInRange(maxWidth, 1, MAX_IMAGE_DIMENSION, '最大宽度')
    if (!maxWidthParsed.ok) return { ok: false as const, error: maxWidthParsed.error }
    const maxHeightParsed = parseOptionalIntInRange(maxHeight, 1, MAX_IMAGE_DIMENSION, '最大高度')
    if (!maxHeightParsed.ok) return { ok: false as const, error: maxHeightParsed.error }
    const supportsQuality = format !== 'image/png'
    let qualityValue: number | undefined
    if (supportsQuality) {
      const qualityParsed = parseIntInRange(quality, 10, 100, '压缩质量')
      if (!qualityParsed.ok) return { ok: false as const, error: qualityParsed.error }
      qualityValue = qualityParsed.value / 100
    }
    return {
      ok: true as const,
      options: {
        quality: qualityValue,
        scalePercent: scaleParsed.value,
        maxWidth: maxWidthParsed.value,
        maxHeight: maxHeightParsed.value,
        smoothingQuality: speed as ImageSmoothingQuality,
      },
    }
  }, [format, quality, scalePercent, maxWidth, maxHeight, speed])

  const runCompress = useCallback(
    async (forPreview: boolean) => {
      if (!file) return null
      const parsed = buildOptions()
      if (!parsed.ok) {
        setError(parsed.error)
        return null
      }
      if (forPreview) setPreviewing(true)
      else setLoading(true)
      setError('')
      try {
        const blob = await convertImageFormat(file, format, parsed.options)
        setCompressedSize(blob.size)
        return blob
      } catch (e) {
        setCompressedSize(null)
        setError(e instanceof Error ? e.message : '压缩失败，当前浏览器可能不支持该格式')
        return null
      } finally {
        if (forPreview) setPreviewing(false)
        else setLoading(false)
      }
    },
    [file, format, buildOptions],
  )

  useEffect(() => {
    if (!file) return
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    previewTimerRef.current = setTimeout(() => {
      void runCompress(true)
    }, 400)
  }, [file, format, quality, scalePercent, maxWidth, maxHeight, speed, runCompress])

  const compress = async () => {
    const blob = await runCompress(false)
    if (!blob || !file) return
    const base = file.name.replace(/\.[^.]+$/, '')
    downloadBlob(blob, `${base}-compressed.${extFromMime(format)}`)
  }

  const outputSize = () => {
    if (!originalSize.w) return null
    const scale = parseInt(scalePercent, 10) || 100
    const mw = maxWidth ? parseInt(maxWidth, 10) : undefined
    const mh = maxHeight ? parseInt(maxHeight, 10) : undefined
    return computeOutputDimensions(originalSize.w, originalSize.h, {
      scalePercent: scale,
      maxWidth: mw && mw > 0 ? mw : undefined,
      maxHeight: mh && mh > 0 ? mh : undefined,
    })
  }

  const size = outputSize()
  const supportsQuality = format !== 'image/png'
  const savings =
    file && compressedSize !== null
      ? Math.max(0, Math.round((1 - compressedSize / file.size) * 100))
      : null

  return (
    <ToolPanel className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        在本地压缩图片体积，可调节输出格式、质量与尺寸，不上传至服务器。
      </p>

      <label className="cursor-pointer">
        <span className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm hover:border-[var(--accent)]">
          选择图片
        </span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>

      {preview && (
        <div className="space-y-2">
          <img src={preview} alt="preview" className="max-h-48 rounded-lg border border-[var(--border)]" />
          {file && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
              <span>原始大小：{formatFileSize(file.size)}</span>
              {originalSize.w > 0 && (
                <span>
                  原始尺寸：{originalSize.w} × {originalSize.h}
                  {size && ` → 输出约 ${size.w} × ${size.h}`}
                </span>
              )}
              {compressedSize !== null && (
                <span className="text-[var(--accent)]">
                  压缩后：{formatFileSize(compressedSize)}
                  {savings !== null && savings > 0 && `（减少 ${savings}%）`}
                  {savings === 0 && '（体积未减小，可尝试降低质量或缩小尺寸）'}
                </span>
              )}
              {previewing && <span>估算中...</span>}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm text-[var(--text-muted)]">输出格式</label>
          <Select value={format} onChange={setFormat} options={FORMAT_OPTIONS} />
        </div>

        {supportsQuality && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">压缩质量</span>
              <span className="font-mono">{quality}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-[var(--text-muted)]">数值越低体积越小，画质损失越明显。</p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">缩放比例</span>
            <span className="font-mono">{scalePercent}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            value={scalePercent}
            onChange={(e) => setScalePercent(e.target.value)}
            className="w-full"
          />
        </div>

        <ToolSection label="最大宽度 (px，可选)">
          <Input value={maxWidth} onChange={setMaxWidth} type="number" placeholder="不限制" />
        </ToolSection>

        <ToolSection label="最大高度 (px，可选)">
          <Input value={maxHeight} onChange={setMaxHeight} type="number" placeholder="不限制" />
        </ToolSection>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-sm text-[var(--text-muted)]">缩放质量</label>
          <Select value={speed} onChange={setSpeed} options={SPEED_OPTIONS} />
        </div>
      </div>

      <Button variant="primary" onClick={compress} disabled={!file || loading}>
        {loading ? '压缩中...' : '压缩并下载'}
      </Button>

      {error && <Alert type="error">{error}</Alert>}
    </ToolPanel>
  )
}
